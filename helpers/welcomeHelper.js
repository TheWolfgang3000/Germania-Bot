// helpers/welcomeHelper.js
const { EmbedBuilder } = require('discord.js');
const db = require('../db-manager.js');
const { embedColor } = require('../config.json');

function formatMessage(message, member) {
    return message
        .replace(/{user}/g, `<@${member.id}>`)
        .replace(/{username}/g, member.user.username)
        .replace(/{server}/g, member.guild.name);
}

async function sendWelcomeLeaveMessage(client, member, type) {
    const guildId = member.guild.id;
    const channelId = db.getServerSetting(guildId, 'welcomeChannelId');
    if (!channelId) return;

    let customMessage, defaultMessage;
    if (type === 'welcome') {
        customMessage = db.getServerSetting(guildId, 'welcomeMessage');
        defaultMessage = '{username} has joined the server.';
    } else {
        customMessage = db.getServerSetting(guildId, 'leaveMessage');
        defaultMessage = '{username} has left the server.';
    }

    const messageToSend = customMessage || defaultMessage;
    const formattedMessage = formatMessage(messageToSend, member);

    const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
        .setDescription(formattedMessage)
        .setTimestamp();

    try {
        const channel = await client.channels.fetch(channelId);
        if (channel && channel.isTextBased()) {
            channel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error(`Error sending ${type} message for server ${member.guild.name}:`, error);
    }
}

module.exports = { sendWelcomeLeaveMessage };