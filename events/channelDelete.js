// events/channelDelete.js
const { Events, EmbedBuilder } = require('discord.js');
const { sendLog } = require('../helpers/logHelper.js');

module.exports = {
    name: Events.ChannelDelete,
    once: false,
    async execute(channel) {
        if (!channel.guild) return;
        const embed = new EmbedBuilder()
            .setDescription(`**Channel Deleted:** #${channel.name} (${channel.type})`)
            .setColor(0xDC143C); // Karmesinrot
        
        sendLog(channel.client, channel.guild, 'log_server', embed);
    },
};