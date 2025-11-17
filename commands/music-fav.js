// commands/music-fav.js
const { SlashCommandBuilder } = require('discord.js');
const musicPlayer = require('../music-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('favorites')
        .setDescription('Shows your list of favorite songs.'),
        
    async execute(interaction) {
        // 'handleFavoritesCommand' sendet eine Liste (mit Paginierung).
        const fakeMessage = {
            author: interaction.user,
            guild: interaction.guild,
            channel: {
                send: async (options) => {
                    return interaction.reply(options);
                }
            },
            client: interaction.client // Wichtig für den Collector!
        };

        await musicPlayer.handleFavoritesCommand(fakeMessage, interaction.client.guildsMap);
    }
};