// commands/ping.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db-manager.js'); 
const achievementsHandler = require('../achievements-handler.js'); 
const { embedColor } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Shows the bot\'s latency.'), // <-- War Deutsch

    async execute(interaction) { 
        const userData = db.getUserData(interaction.guild.id, interaction.user.id);
        userData.achievementCounters.commandUsage.ping = (userData.achievementCounters.commandUsage.ping || 0) + 1;
        if (userData.achievementCounters.commandUsage.ping >= 100 && !userData.achievements.PING_PONG_MASTER) {
            await achievementsHandler.unlockAchievement(interaction.member, 'PING_PONG_MASTER', userData);
        }
        db.setUserData(interaction.guild.id, interaction.user.id, userData);

        await interaction.reply({ content: 'Pinging...' });
        const sent = await interaction.fetchReply();

        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('Pong!')
            .setDescription(`**Bot Latency:** ${latency}ms.\n**API Latency:** ${apiLatency}ms.`);
        
        await interaction.editReply({ content: null, embeds: [embed] });
    }
};