// commands/setup-serverstats.js
const { SlashCommandBuilder, PermissionsBitField, ChannelType, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../db-manager.js');
const { embedColor } = require('../config.json');

// --- HELPER ZUM LÖSCHEN ---
async function deleteAllStatsChannels(guild, settings) {
    const channelIds = [
        settings.stats_member_channel_id,
        settings.stats_online_channel_id,
        settings.stats_all_members_channel_id,
        settings.stats_bots_channel_id,
        settings.stats_time_channel_id,
        settings.stats_date_channel_id,
        settings.stats_dnd_channel_id,
        settings.stats_idle_channel_id,
        settings.stats_offline_channel_id,
        settings.stats_compact_channel_id
    ].filter(id => id); 

    let categoryId = null;

    for (const id of channelIds) {
        try {
            const channel = await guild.channels.fetch(id).catch(() => null);
            if (channel) {
                if (channel.parentId && !categoryId) categoryId = channel.parentId;
                await channel.delete();
            }
        } catch (error) {
            console.warn(`[Stats] Failed to delete stats channel ${id}:`, error.message);
        }
    }
    
    if (categoryId) {
        try {
             const category = await guild.channels.fetch(categoryId).catch(() => null);
             if (category && category.children.cache.size === 0) {
                 await category.delete();
             }
        } catch (error) {
            console.warn("Failed to delete stats category:", error.message);
        }
    }

    // Setzt alle DB-Werte zurück
    const keysToReset = [
        'stats_mode', 'stats_member_channel_id', 'stats_online_channel_id',
        'stats_all_members_channel_id', 'stats_bots_channel_id', 'stats_time_channel_id',
        'stats_date_channel_id', 'stats_dnd_channel_id', 'stats_idle_channel_id',
        'stats_offline_channel_id', 'stats_compact_channel_id'
    ];
    for (const key of keysToReset) {
        db.setServerSetting(guild.id, key, (key === 'stats_mode' ? 'off' : null));
    }
}

// --- HELPER ZUM ERSTELLEN ---
const denyConnect = (everyoneRole) => ([
    { id: everyoneRole.id, deny: [PermissionsBitField.Flags.Connect] }
]);

async function createSimpleChannels(guild, everyoneRole) {
    try {
        const category = await guild.channels.create({ name: '📊 SERVER STATS', type: ChannelType.GuildCategory, permissionOverwrites: denyConnect(everyoneRole) });
        const memberChannel = await guild.channels.create({ name: '● Members: ...', type: ChannelType.GuildVoice, parent: category });
        const onlineChannel = await guild.channels.create({ name: '● Online: ...', type: ChannelType.GuildVoice, parent: category });
        return { stats_member_channel_id: memberChannel.id, stats_online_channel_id: onlineChannel.id };
    } catch (error) { console.error("Could not create simple stats channels:", error); return null; }
}

async function createAdvancedChannels(guild, everyoneRole) {
    try {
        const category = await guild.channels.create({ name: '📊 ADVANCED STATS', type: ChannelType.GuildCategory, permissionOverwrites: denyConnect(everyoneRole) });
        const allMembersChannel = await guild.channels.create({ name: '📈 All Members: ...', type: ChannelType.GuildVoice, parent: category });
        const memberChannel = await guild.channels.create({ name: '👤 Members: ...', type: ChannelType.GuildVoice, parent: category });
        const botChannel = await guild.channels.create({ name: '🤖 Bots: ...', type: ChannelType.GuildVoice, parent: category });
        const dateChannel = await guild.channels.create({ name: '📅 Date: ...', type: ChannelType.GuildVoice, parent: category });
        const timeChannel = await guild.channels.create({ name: '🕖 Time (CET): ...', type: ChannelType.GuildVoice, parent: category });
        
        return {
            stats_member_channel_id: memberChannel.id,
            stats_all_members_channel_id: allMembersChannel.id,
            stats_bots_channel_id: botChannel.id,
            stats_date_channel_id: dateChannel.id,
            stats_time_channel_id: timeChannel.id
        };
    } catch (error) { console.error("Could not create advanced channels:", error); return null; }
}

async function createPerfectChannels(guild, everyoneRole) {
    try {
        const category = await guild.channels.create({ name: '📊 SERVER STATS', type: ChannelType.GuildCategory, permissionOverwrites: denyConnect(everyoneRole) });
        const allMembersChannel = await guild.channels.create({ name: '📈 All Members: ...', type: ChannelType.GuildVoice, parent: category });
        const memberChannel = await guild.channels.create({ name: '👤 Members: ...', type: ChannelType.GuildVoice, parent: category });
        const botChannel = await guild.channels.create({ name: '🤖 Bots: ...', type: ChannelType.GuildVoice, parent: category });
        
        await guild.channels.create({ name: '—————', type: ChannelType.GuildVoice, parent: category, permissionOverwrites: denyConnect(everyoneRole) });
        
        const onlineChannel = await guild.channels.create({ name: '🟢 Online: ...', type: ChannelType.GuildVoice, parent: category });
        const dndChannel = await guild.channels.create({ name: '⛔ Do Not Disturb: ...', type: ChannelType.GuildVoice, parent: category });
        const idleChannel = await guild.channels.create({ name: '🌙 Idle: ...', type: ChannelType.GuildVoice, parent: category });
        const offlineChannel = await guild.channels.create({ name: '⚫ Offline: ...', type: ChannelType.GuildVoice, parent: category });

        await guild.channels.create({ name: '—————', type: ChannelType.GuildVoice, parent: category, permissionOverwrites: denyConnect(everyoneRole) });

        const dateChannel = await guild.channels.create({ name: '📅 Date: ...', type: ChannelType.GuildVoice, parent: category });
        const timeChannel = await guild.channels.create({ name: '🕖 Time (CET): ...', type: ChannelType.GuildVoice, parent: category });

        return {
            stats_all_members_channel_id: allMembersChannel.id,
            stats_member_channel_id: memberChannel.id,
            stats_bots_channel_id: botChannel.id,
            stats_online_channel_id: onlineChannel.id,
            stats_dnd_channel_id: dndChannel.id,
            stats_idle_channel_id: idleChannel.id,
            stats_offline_channel_id: offlineChannel.id,
            stats_date_channel_id: dateChannel.id,
            stats_time_channel_id: timeChannel.id
        };
    } catch (error) { console.error("Could not create perfect channels:", error); return null; }
}

async function createCompactChannels(guild, everyoneRole) {
    try {
        const category = await guild.channels.create({ name: '📊 SERVER STATS', type: ChannelType.GuildCategory, permissionOverwrites: denyConnect(everyoneRole) });
        const memberChannel = await guild.channels.create({ name: '📈 Members: ...', type: ChannelType.GuildVoice, parent: category });
        const statusChannel = await guild.channels.create({ name: '🟢 ... ⛔ ... 🌙 ...', type: ChannelType.GuildVoice, parent: category });
        const timeChannel = await guild.channels.create({ name: '🕖 Time (CET): ...', type: ChannelType.GuildVoice, parent: category });

        return {
            stats_all_members_channel_id: memberChannel.id, // Wiederverwendung der "All Members"-Spalte
            stats_compact_channel_id: statusChannel.id,
            stats_time_channel_id: timeChannel.id
        };
    } catch (error) { console.error("Could not create compact channels:", error); return null; }
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-serverstats')
        .setDescription('[Admin] Manages the automatic server statistics display.')
        .addStringOption(option =>
            option.setName('theme')
                .setDescription('The theme/style of the stats display.')
                .setRequired(true)
                .addChoices(
                    { name: 'Off (Disable Stats)', value: 'off' },
                    { name: 'Simple (Members / Online)', value: 'simple' },
                    { name: 'Advanced (All Members / Bots / Time / Date)', value: 'advanced' }, 
                    { name: 'Perfect (Screenshot Clone)', value: 'perfect' }, 
                    { name: 'Compact (All Members / Statuses / Time)', value: 'compact' } 
                ))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    
    async execute(interaction) {
        // --- FIX FÜR 10062-Fehler ---
        // Sofort antworten (ephemeral), *bevor* wir langsame Aktionen ausführen.
        await interaction.reply({ content: 'Processing your request...', flags: [ MessageFlags.Ephemeral ] }); // Fix für 'ephemeral' Warnung

        const theme = interaction.options.getString('theme');
        const guild = interaction.guild;
        const everyoneRole = guild.roles.everyone;
        const currentSettings = db.getServerSettings(guild.id);

        // --- 1. ALLES ALTE LÖSCHEN (falls vorhanden) ---
        if (currentSettings.stats_mode !== 'off') {
            await interaction.editReply('Disabling old stats system and deleting old channels...');
            await deleteAllStatsChannels(guild, currentSettings);
        }

        // --- 2. NEUES SYSTEM INSTALLIEREN ---
        let channels;
        let successMessage = '';

        switch (theme) {
            case 'simple':
                await interaction.editReply('Creating "Simple" theme channels...');
                channels = await createSimpleChannels(guild, everyoneRole);
                successMessage = `[OK] "Simple" statistics channels created! They will update automatically.`;
                break;
            case 'advanced':
                await interaction.editReply('Creating "Advanced" theme channels...');
                channels = await createAdvancedChannels(guild, everyoneRole);
                successMessage = `[OK] "Advanced" theme channels created! They will update automatically.`;
                break;
            case 'perfect':
                await interaction.editReply('Creating "Perfect" theme channels...');
                channels = await createPerfectChannels(guild, everyoneRole);
                successMessage = `[OK] "Perfect" theme channels created! They will update automatically.`;
                break;
            case 'compact':
                await interaction.editReply('Creating "Compact" theme channels...');
                channels = await createCompactChannels(guild, everyoneRole);
                successMessage = `[OK] "Compact" theme channels created! They will update automatically.`;
                break;
            case 'off':
                await interaction.editReply('[OK] Server stats system has been disabled and all channels removed.');
                return;
        }

        if (!channels) {
            return interaction.editReply('[ERROR] Failed to create channels. Do I have "Manage Channels" permissions?');
        }

        // Speichere das Theme und alle zurückgegebenen Kanal-IDs in der DB
        db.setServerSetting(guild.id, 'stats_mode', theme);
        for (const [key, value] of Object.entries(channels)) {
            db.setServerSetting(guild.id, key, value);
        }

        await interaction.editReply(successMessage);
    }
};