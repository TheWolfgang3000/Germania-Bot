// commands/radio.js
const { SlashCommandBuilder } = require('discord.js');
const radioPlayer = require('../radio-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('Starts a live radio stream.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('The audio stream URL.')
                .setRequired(true)),
    
    async execute(interaction) {
        // We use the shim to call the old logic
        
        const fakeMessage = {
            member: interaction.member,
            guild: interaction.guild,
            channel: {
                send: async (options) => {
                    // This catches '[!] You must be in a voice channel...'
                    return interaction.reply(options);
                },
                // This is for the '[...] Connecting to radio stream...' message
                edit: async (options) => {
                    return interaction.editReply(options);
                }
            }
        };

        // We create the 'args' array that the old command expects
        const args = [interaction.options.getString('url')];

        // Defer reply, as connecting can take time
        await interaction.deferReply();
        
        // Call the old function
        await radioPlayer.handleRadioCommand(fakeMessage, args, interaction.client.radioConnections);

        // handleRadioCommand sends its own reply/edit,
        // so we just delete the initial "thinking..." message.
        await interaction.deleteReply();
    }
};