// events/roleCreate.js
const { Events, EmbedBuilder } = require('discord.js');
const { sendLog } = require('../helpers/logHelper.js');

module.exports = {
    name: Events.RoleCreate,
    once: false,
    async execute(role) {
        const embed = new EmbedBuilder()
            .setDescription(`**Role Created:** ${role.name}`)
            .setColor(0x32CD32); // Limettengrün
        
        sendLog(role.client, role.guild, 'log_server', embed);
    },
};