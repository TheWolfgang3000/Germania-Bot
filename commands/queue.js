// commands/queue.js
const { SlashCommandBuilder } = require('discord.js');
const musicPlayer = require('../music-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Displays the current song queue.'),
        
    async execute(interaction) {
        // 'handleQueueCommand' sendet ein Embed oder eine Textnachricht.
        // Wir müssen 'interaction.reply' verwenden, um die Antwort zu senden.
        
        const fakeMessage = {
            guild: interaction.guild,
            channel: {
                send: async (options) => {
                    // fängt 'The queue is empty.' oder das Embed ab
                    return interaction.reply(options);
                }
            }
        };

        musicPlayer.handleQueueCommand(fakeMessage, interaction.client.guildsMap);
    }
};