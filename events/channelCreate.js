// events/channelCreate.js
const { Events, EmbedBuilder } = require('discord.js');
const { sendLog } = require('../helpers/logHelper.js');

module.exports = {
    name: Events.ChannelCreate,
    once: false,
    async execute(channel) {
        if (!channel.guild) return;
        const embed = new EmbedBuilder()
            .setDescription(`**Channel Created:** ${channel.name} (${channel.type})`)
            .setColor(0x32CD32); // Limettengrün
        
        sendLog(channel.client, channel.guild, 'log_server', embed);
    },
};