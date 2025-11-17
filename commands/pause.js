// commands/pause.js
const { SlashCommandBuilder } = require('discord.js');
const musicPlayer = require('../music-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pauses the current song.'),
        
    async execute(interaction) {
        const guildState = interaction.client.guildsMap.get(interaction.guild.id);
        if (!guildState || !guildState.isPlaying || guildState.player.state.status !== 'playing') {
            return interaction.reply({ content: 'Nothing is playing or the player is already paused.', ephemeral: true });
        }

        // Wir erstellen ein minimales 'fakeMessage'
        const fakeMessage = { guild: interaction.guild };
        
        musicPlayer.handlePauseCommand(fakeMessage, interaction.client.guildsMap);
        
        await interaction.reply({ content: 'Song paused.', ephemeral: true });
    }
};