// events/roleDelete.js
const { Events, EmbedBuilder } = require('discord.js');
const { sendLog } = require('../helpers/logHelper.js');

module.exports = {
    name: Events.RoleDelete,
    once: false,
    async execute(role) {
        const embed = new EmbedBuilder()
            .setDescription(`**Role Deleted:** @${role.name}`)
            .setColor(0xDC143C); // Karmesinrot
        
        sendLog(role.client, role.guild, 'log_server', embed);
    },
};