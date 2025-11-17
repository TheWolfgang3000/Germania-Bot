// commands/resume.js
const { SlashCommandBuilder } = require('discord.js');
const musicPlayer = require('../music-player.js');
const db = require('../db-manager.js');
const achievementsHandler = require('../achievements-handler.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resumes the paused song.'),
        
    async execute(interaction) {
        const guildState = interaction.client.guildsMap.get(interaction.guild.id);
        if (!guildState || guildState.player.state.status !== 'paused') {
            return interaction.reply({ content: 'Nothing is paused right now.', ephemeral: true });
        }

        // Logik migriert aus 'case 'resume':'
        const userData = db.getUserData(interaction.guild.id, interaction.user.id);
        userData.achievementCounters.commandUsage.resume = (userData.achievementCounters.commandUsage.resume || 0) + 1;
        if (!userData.achievements.RESUME) {
            await achievementsHandler.unlockAchievement(interaction.member, 'RESUME', userData);
        }
        db.setUserData(interaction.guild.id, interaction.user.id, userData);

        const fakeMessage = { guild: interaction.guild };
        musicPlayer.handleResumeCommand(fakeMessage, interaction.client.guildsMap);
        
        await interaction.reply({ content: 'Song resumed.', ephemeral: true });
    }
};