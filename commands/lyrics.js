// commands/lyrics.js
const { SlashCommandBuilder } = require('discord.js');
const musicPlayer = require('../music-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Finds the lyrics for the currently playing song.'),
        
    async execute(interaction) {
        // 'handleLyricsCommand' sendet 'Searching...' und bearbeitet es.
        // Wir müssen das 'deferReply' und 'editReply' von Discord verwenden.
        
        await interaction.deferReply(); // Ersetzt 'Searching...'

        const fakeMessage = {
            member: interaction.member,
            guild: interaction.guild,
            channel: {
                send: async (options) => { /* Wird nicht mehr genutzt */ },
                // Wir leiten 'edit' auf 'interaction.editReply' um
                edit: async (options) => {
                    return interaction.editReply(options);
                }
            }
        };

        // Wir rufen die Logik auf, die jetzt 'interaction.editReply' nutzt
        await musicPlayer.handleLyricsCommand(fakeMessage, interaction.client.guildsMap);
    }
};