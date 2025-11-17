// commands/broadcast.js
const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { embedColor } = require('../config.json');
const db = require('../db-manager.js');

// WICHTIG: Füge deine Discord User ID in deine .env-Datei ein
// OWNER_ID=DEINE_ID_HIER
const OWNER_ID = process.env.OWNER_ID; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('broadcast')
        .setDescription('[Bot Owner] Sends an announcement to all servers.')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the announcement embed.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to broadcast (supports \\n for new lines).')
                .setRequired(true)),
    
    async execute(interaction) {
        // --- 1. OWNER-PRÜFUNG ---
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: 'This command can only be used by the Bot Owner.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const title = interaction.options.getString('title');
        const message = interaction.options.getString('message').replace(/\\n/g, '\n');
        
        const broadcastEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(title)
            .setDescription(message)
            .setFooter({ text: 'NOTE: These Messages can be turned off with "/setup-announcements"' });

        const client = interaction.client;
        let successCount = 0;
        let failCount = 0;
        const totalGuilds = client.guilds.cache.size;

        // --- 2. DER "RUNDMAIL"-LOOP ---
        for (const guild of client.guilds.cache.values()) {
            // 3. ADMIN-TOGGLE-PRÜFUNG
            const canSend = db.getServerSetting(guild.id, 'allow_bot_announcements');
            if (canSend === 0) { // 0 = false
                failCount++;
                continue;
            }

            // 4. KANAL-FINDUNGS-LOGIK (Idiotensicher)
            let targetChannel = null;
            try {
                const channels = await guild.channels.fetch();
                const everyoneRole = guild.roles.everyone;

                // Finde alle Textkanäle, sortiere sie nach Position (oben nach unten)
                // und wähle den ERSTEN, in den @everyone SCHREIBEN kann.
                targetChannel = channels
                    .filter(c => 
                        c.type === ChannelType.GuildText &&
                        c.permissionsFor(everyoneRole).has(PermissionsBitField.Flags.SendMessages)
                    )
                    .sort((a, b) => a.position - b.position)
                    .first();

                if (targetChannel) {
                    await targetChannel.send({ embeds: [broadcastEmbed] });
                    successCount++;
                } else {
                    // (Konnte keinen Kanal finden, in den @everyone schreiben darf)
                    failCount++;
                }
            } catch (e) {
                // (Bot hat keine Berechtigung, Kanäle zu lesen oder zu senden)
                console.warn(`[Broadcast] Could not send to guild ${guild.name} (ID: ${guild.id}): ${e.message}`);
                failCount++;
            }
        }

        // --- 5. BERICHT AN OWNER ---
        await interaction.editReply({
            content: `**Broadcast Complete**\n\n` +
                     `Successfully sent to **${successCount}** / ${totalGuilds} servers.\n` +
                     `Failed (or disabled by admins): **${failCount}** servers.`
        });
    }
};