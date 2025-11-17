// commands/inventory.js
const { SlashCommandBuilder } = require('discord.js');
const inventoryCommands = require('../inventory-commands.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription("Shows your or another user's inventory.")
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose inventory you want to see.')
                .setRequired(false)),
    
    async execute(interaction) {
        // Shim for handleInventoryCommand
        const fakeMessage = {
            mentions: {
                users: {
                    first: () => interaction.options.getUser('user')
                }
            },
            author: interaction.user,
            guild: interaction.guild,
            channel: {
                send: async (options) => {
                    return interaction.reply(options);
                }
            }
        };

        await inventoryCommands.handleInventoryCommand(fakeMessage, interaction.client);
    }
};