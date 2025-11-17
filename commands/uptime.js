// commands/uptime.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { embedColor } = require('../config.json');

function formatUptime(ms) {
    const totalSeconds = ms / 1000;
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${days}d, ${hours}h, ${minutes}m, ${seconds}s`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Shows how long the bot has been online.'), // <-- War Deutsch
    
    async execute(interaction) {
        const uptime = formatUptime(interaction.client.uptime);
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('Uptime')
            .setDescription(`I have been online for: **${uptime}**`);

        await interaction.reply({ embeds: [embed] });
    }
};