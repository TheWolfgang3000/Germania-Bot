// commands/shop.js
const { SlashCommandBuilder } = require('discord.js');
const shopCommands = require('../shop-commands.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Opens the item shop.'),
    
    async execute(interaction) {
        // Shim for handleShopCommand
        // This command is simple as it's always for the author
        const fakeMessage = {
            author: interaction.user,
            guild: interaction.guild,
            channel: {
                send: async (options) => {
                    return interaction.reply(options);
                }
            }
        };

        await shopCommands.handleShopCommand(fakeMessage, interaction.client);
    }
};