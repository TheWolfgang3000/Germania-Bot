// commands/skip.js
const { SlashCommandBuilder } = require('discord.js');
const musicPlayer = require('../music-player.js');
const db = require('../db-manager.js');
const achievementsHandler = require('../achievements-handler.js'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current song.'),
        
    async execute(interaction) {
        const guildState = interaction.client.guildsMap.get(interaction.guild.id);
        if (!guildState || !guildState.isPlaying) {
            return interaction.reply({ content: "There's nothing playing that I could skip.", ephemeral: true });
        }

        const userData = db.getUserData(interaction.guild.id, interaction.user.id);
        
        const fakeMessage = {
            member: interaction.member,
            guild: interaction.guild,
            author: interaction.user
        };

        await musicPlayer.handleSkipCommand(fakeMessage, interaction.client.guildsMap, userData);
        
        await interaction.reply({ content: 'Skipped the song.', ephemeral: true }); 
    }
};