// helpers/logHelper.js
const { EmbedBuilder } = require('discord.js');
const db = require('../db-manager.js');
const { embedColor } = require('../config.json');

/**
 * Sends a log embed to the correct, configured log channel.
 * @param {Client} client The Discord Client object.
 * @param {Guild} guild The guild where the event occurred.
 * @param {string} logType The type of log (e.g., 'log_messages', 'log_members').
 * @param {EmbedBuilder} embed The embed to send.
 */
async function sendLog(client, guild, logType, embed) {
    if (!guild || !guild.id) return;
    
    // Holt den KORREKTEN, spezifischen Log-Kanal
    const logChannelId = db.getServerSetting(guild.id, logType);
    if (!logChannelId) return; // Logging für diesen Typ ist deaktiviert

    try {
        const channel = await client.channels.fetch(logChannelId);
        if (channel && channel.isTextBased()) {
            // Setzt die Standard-Farbe und den Zeitstempel
            embed.setColor(embedColor).setTimestamp();
            await channel.send({ embeds: [embed] });
        }
    } catch (error) {
        if (error.code === 50013 || error.code === 10003) { // 50013 = Missing Permissions, 10003 = Unknown Channel
            console.warn(`[Log] Log channel ${logChannelId} for ${logType} in ${guild.name} is missing or I can't access it.`);
            // Deaktivieren, um Spam zu vermeiden? Vorerst nicht.
        } else {
            console.error(`[Log] Could not send log message to server ${guild.name}: ${error}`);
        }
    }
}

module.exports = { sendLog };