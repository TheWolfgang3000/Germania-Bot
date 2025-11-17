// commands/radiostop.js
const { SlashCommandBuilder } = require('discord.js');
const radioPlayer = require('../radio-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('radiostop')
        .setDescription('Stops the radio stream.'),
    
    async execute(interaction) {
        // Shim for handleRadioStopCommand
        const fakeMessage = {
            guild: interaction.guild,
            channel: {
                send: async (options) => {
                    // Catches '[!] The radio is not currently playing.'
                    // or '[OK] Radio stopped...'
                    return interaction.reply(options);
                }
            }
        };

        radioPlayer.handleRadioStopCommand(fakeMessage, interaction.client.radioConnections);
    }
};