// commands/skipfile.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skipfile')
        .setDescription('Skips the current local file.'),
    
    async execute(interaction) {
        const guildState = interaction.client.localPlayerMap.get(interaction.guild.id);
        if (!guildState || !guildState.isPlaying) {
            return interaction.reply({ content: 'Nothing is playing from the local library.', ephemeral: true });
        }
        
        guildState.player.stop(); // Der 'Idle'-Listener kümmert sich um den Rest
        await interaction.reply({ content: 'Skipped the local song.', ephemeral: true });
    }
};