// commands/stop.js
const { SlashCommandBuilder } = require('discord.js');
const musicPlayer = require('../music-player.js');
const db = require('../db-manager.js');
const achievementsHandler = require('../achievements-handler.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the music and clears the queue.'),
        
    async execute(interaction) {
        const guildState = interaction.client.guildsMap.get(interaction.guild.id);
        if (!guildState) {
            return interaction.reply({ content: 'Nothing is playing right now.', ephemeral: true });
        }

        const userData = db.getUserData(interaction.guild.id, interaction.user.id);
        
        // Achievement-Logik
        userData.achievementCounters.commandUsage.stop = (userData.achievementCounters.commandUsage.stop || 0) + 1;
        if (userData.achievementCounters.commandUsage.stop >= 50 && !userData.achievements.PARTY_STOPPER) {
            await achievementsHandler.unlockAchievement(interaction.member, 'PARTY_STOPPER', userData);
        }
        db.setUserData(interaction.guild.id, interaction.user.id, userData);

        const fakeMessage = {
            member: interaction.member,
            guild: interaction.guild
        };

        musicPlayer.handleStopCommand(fakeMessage, interaction.client.guildsMap);
        
        await interaction.reply('Music stopped and queue cleared.');
    }
};