// tasks/statsUpdater.js
const { ActivityType } = require('discord.js');
const db = require('../db-manager.js');

// Helper für die Uhrzeit (CET/Berlin)
function getGermanTimeAndDate() {
    const now = new Date();
    // 'en-GB' sorgt für das 24-Stunden-Format (z.B. 14:30 statt 2:30 PM)
    const time = now.toLocaleTimeString('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('en-GB', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric' });
    return { time, date };
}

// Helper zum sicheren Umbenennen von Kanälen (Dein Code, unverändert & gut!)
async function safeUpdateChannel(guild, channelId, newName) {
    if (!channelId) return; 
    try {
        const channel = await guild.channels.fetch(channelId).catch(() => null);
        if (channel && channel.name !== newName) {
            await channel.setName(newName);
        }
    } catch (error) {
        if (error.code === 10003) { 
            console.warn(`[Stats] Channel ${channelId} in ${guild.id} not found. Disabling stats.`);
            db.setServerSetting(guild.id, 'stats_mode', 'off');
        } else if (error.code === 50013 || error.code === 429) { 
            console.warn(`[Stats] Rate limit or missing permissions in ${guild.id}: ${error.message}`);
        } else {
            console.error(`[Stats] Failed to update channel ${channelId} in ${guild.id}:`, error);
        }
    }
}

// --- NEU: Funktion 1 (Nur Zeit/Datum) ---
async function updateStats_Fast(client) {
    const allServers = db.getAllServerSettings();
    const { time, date } = getGermanTimeAndDate();

    for (const server of allServers) {
        if (server.stats_mode === 'off' || !server.stats_time_channel_id) continue; 

        const guild = await client.guilds.fetch(server.guildId).catch(err => {
            console.warn(`[Stats] Guild ${server.guildId} not found.`);
            db.setServerSetting(server.guildId, 'stats_mode', 'off');
            return null;
        });
        if (!guild) continue;

        // Diese Funktion aktualisiert NUR Zeit und Datum, je nach Theme
        try {
            switch (server.stats_mode) {
                case 'advanced':
                    await safeUpdateChannel(guild, server.stats_date_channel_id, `📅 Date: ${date}`);
                    await safeUpdateChannel(guild, server.stats_time_channel_id, `⏰ Time (CET): ${time}`);
                    break;
                case 'perfect':
                    await safeUpdateChannel(guild, server.stats_date_channel_id, `📅 Date: ${date}`);
                    await safeUpdateChannel(guild, server.stats_time_channel_id, `⏰ Time (CET): ${time}`);
                    break;
                case 'compact':
                    // Das "Compact"-Theme (dein Bild) hat nur Zeit, kein Datum
                    await safeUpdateChannel(guild, server.stats_time_channel_id, `⏰ Time (CET): ${time}`);
                    break;
                // 'simple' hat weder Zeit noch Datum
            }
        } catch (error) {
            console.warn(`[Stats-Fast] Fehler beim Aktualisieren der Gilde ${guild.id}: ${error.message}`);
        }
    }
}

// --- NEU: Funktion 2 (Nur Mitglieder/Status) ---
async function updateStats_Slow(client) {
    let totalMembers = 0;
    const allServers = db.getAllServerSettings();
    
    for (const server of allServers) {
        if (server.stats_mode === 'off') continue; 

        const guild = await client.guilds.fetch(server.guildId).catch(err => {
            console.warn(`[Stats] Guild ${server.guildId} not found.`);
            db.setServerSetting(server.guildId, 'stats_mode', 'off');
            return null;
        });
        if (!guild) continue;
        
        try {
            // --- 1. DATEN SAMMELN (Die "schwere" Operation) ---
            // Wir holen alle Mitglieder-Daten (inkl. Anwesenheit/Status)
            await guild.members.fetch({ force: true }); 
            
            const members = guild.members.cache;
            const allMembersCount = guild.memberCount;
            const botCount = members.filter(m => m.user.bot).size;
            const humanCount = allMembersCount - botCount;

            // Status-Zählung (nur von Menschen)
            const onlineCount = members.filter(m => !m.user.bot && m.presence?.status === 'online').size;
            const dndCount = members.filter(m => !m.user.bot && m.presence?.status === 'dnd').size;
            const idleCount = members.filter(m => !m.user.bot && m.presence?.status === 'idle').size;
            const offlineCount = humanCount - (onlineCount + dndCount + idleCount);
            
            totalMembers += allMembersCount;

            // --- 2. KANÄLE AKTUALISIEREN (NUR Mitglieder/Status) ---
            switch (server.stats_mode) {
                case 'simple':
                    await safeUpdateChannel(guild, server.stats_member_channel_id, `● Members: ${humanCount}`);
                    await safeUpdateChannel(guild, server.stats_online_channel_id, `● Online: ${onlineCount}`);
                    break;
                
                case 'advanced':
                    await safeUpdateChannel(guild, server.stats_all_members_channel_id, `📈 All Members: ${allMembersCount}`);
                    await safeUpdateChannel(guild, server.stats_member_channel_id, `👤 Members: ${humanCount}`);
                    await safeUpdateChannel(guild, server.stats_bots_channel_id, `🤖 Bots: ${botCount}`);
                    break;

                case 'perfect':
                    await safeUpdateChannel(guild, server.stats_all_members_channel_id, `📈 All Members: ${allMembersCount}`);
                    await safeUpdateChannel(guild, server.stats_member_channel_id, `👤 Members: ${humanCount}`);
                    await safeUpdateChannel(guild, server.stats_bots_channel_id, `🤖 Bots: ${botCount}`);
                    await safeUpdateChannel(guild, server.stats_online_channel_id, `🟢 Online: ${onlineCount}`);
                    await safeUpdateChannel(guild, server.stats_dnd_channel_id, `⛔ Do Not Disturb: ${dndCount}`);
                    await safeUpdateChannel(guild, server.stats_idle_channel_id, `🌙 Idle: ${idleCount}`);
                    await safeUpdateChannel(guild, server.stats_offline_channel_id, `⚫ Offline: ${offlineCount}`);
                    break;
                
                case 'compact':
                    // Das "Compact"-Theme (dein Bild)
                    await safeUpdateChannel(guild, server.stats_all_members_channel_id, `📈 Members: ${allMembersCount}`);
                    await safeUpdateChannel(guild, server.stats_compact_channel_id, `🟢${onlineCount} ⛔${dndCount} 🌙${idleCount}`);
                    break;
            }

        } catch (fetchError) {
            console.warn(`[Stats-Slow] Fehler beim Aktualisieren der Gilde ${guild.id}: ${fetchError.message}`);
        }
    }
    
    // --- 3. BOT-STATUS AKTUALISIEREN (Global) ---
    try {
        client.user.setActivity(
            `${totalMembers} Members on ${client.guilds.cache.size} Servers`, 
            { type: ActivityType.Watching }
        );
    } catch (error) {
        console.error(`[Stats] Fehler beim Setzen des Bot-Status:`, error);
    }
}


// --- KORRIGIERTER EXPORT ---
// Wir exportieren die zwei unterschiedlichen Funktionen
module.exports = { 
    updateStats_Slow: updateStats_Slow, 
    updateStats_Fast: updateStats_Fast 
};