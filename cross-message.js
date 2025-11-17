// cross-message.js
const db = require('./db-manager.js');

// Filtert Erwähnungen wie @everyone und @here
function sanitizeContent(content) {
    return content
        .replace(/@everyone/g, '@-everyone')
        .replace(/@here/g, '@-here');
}

async function relayMessage(client, originalMessage) {
    const sourceGuildId = originalMessage.guild.id;
    const sourceChannelId = originalMessage.channel.id;

    // Hole alle Server-Einstellungen aus der DB
    const allServerSettings = db.getAllServerSettings();

    // Finde die Link-Informationen für den Kanal, in dem die Nachricht gesendet wurde
    const sourceServer = allServerSettings.find(s => s.guildId === sourceGuildId);
    if (!sourceServer || !sourceServer.linkedChannels) return;

    const sourceLinkedChannels = JSON.parse(sourceServer.linkedChannels);
    const sourceLinkInfo = sourceLinkedChannels[sourceChannelId];
    if (!sourceLinkInfo) return; // Der Kanal ist nicht verlinkt

    console.log(`[DEBUG] Cross-Message: Nachricht aus Kanal ${sourceChannelId} mit Link-Typ '${sourceLinkInfo.type}' empfangen.`);

    // Nachricht formatieren
    const sanitizedMessage = sanitizeContent(originalMessage.content);
    const formattedString = `**${originalMessage.guild.name}** - **${originalMessage.author.tag}**: ${sanitizedMessage}`;

    // Iteriere durch alle Server und ihre Kanäle, um Ziele zu finden
    for (const targetServer of allServerSettings) {
        if (!targetServer.linkedChannels) continue;

        const targetLinkedChannels = JSON.parse(targetServer.linkedChannels);
        for (const targetChannelId in targetLinkedChannels) {
            // Überspringe den Quellkanal selbst
            if (targetChannelId === sourceChannelId) continue;

            const targetLinkInfo = targetLinkedChannels[targetChannelId];

            // Prüfe, ob die Links übereinstimmen (gleicher Typ und, falls privat, gleicher Name)
            const isSameLink = sourceLinkInfo.type === targetLinkInfo.type &&
                               (sourceLinkInfo.type === 'global' || sourceLinkInfo.linkName === targetLinkInfo.linkName);

            if (isSameLink) {
                try {
                    const channel = await client.channels.fetch(targetChannelId);
                    if (channel && channel.isTextBased()) {
                        console.log(`[DEBUG] Cross-Message: Leite Nachricht weiter an Kanal ${targetChannelId}.`);
                        await channel.send({
                            content: formattedString,
                            files: originalMessage.attachments.map(a => a.url)
                        });
                    }
                } catch (error) {
                    console.error(`[FEHLER] Cross-Message Weiterleitung zu Kanal ${targetChannelId} fehlgeschlagen:`, error);
                }
            }
        }
    }
}

module.exports = { relayMessage };