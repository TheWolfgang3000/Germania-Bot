// info-commands.js
const { EmbedBuilder } = require('discord.js');
const { embedColor } = require('./config.json');

// Funktion zur Umrechnung von Millisekunden in ein lesbares Format
function formatUptime(ms) {
    const totalSeconds = ms / 1000;
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${days}d, ${hours}h, ${minutes}m, ${seconds}s`;
}

function handlePing(message) {
    const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('Pong!')
        .setDescription(`Latency is ${Date.now() - message.createdTimestamp}ms. API Latency is ${Math.round(message.client.ws.ping)}ms.`);
    
    message.channel.send({ embeds: [embed] });
}

function handleUptime(message) {
    const uptime = formatUptime(message.client.uptime);
    const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('Uptime')
        .setDescription(`I have been online for: **${uptime}**`);

    message.channel.send({ embeds: [embed] });
}

function handleBotInfo(message) {
    const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('Bot Information')
        .setAuthor({ name: message.client.user.tag, iconURL: message.client.user.displayAvatarURL() })
        .addFields(
            { name: 'Version', value: '1.0.0', inline: true },
            { name: 'Creator', value: 'Germania AI v5.6.', inline: true },
            { name: 'Online Since', value: new Date(message.client.readyTimestamp).toUTCString(), inline: false }
        );

    message.channel.send({ embeds: [embed] });
}

module.exports = {
    handlePing,
    handleUptime,
    handleBotInfo
};