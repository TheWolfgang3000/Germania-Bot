// commands/setup-messages.js
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const db = require('../db-manager.js');
const { embedColor } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-messages')
        .setDescription('[Admin] Sets the custom welcome and leave messages.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-welcome')
                .setDescription('Sets the custom welcome message.')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('The text. Use {user}, {username}, or {server}.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-leave')
                .setDescription('Sets the custom leave message.')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('The text. Use {user}, {username}, or {server}.')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    
    async execute(interaction) {
        // Logic from handleSetWelcomeMessage and handleSetLeaveMessage
        const subcommand = interaction.options.getSubcommand();
        const customMessage = interaction.options.getString('message');

        if (subcommand === 'set-welcome') {
            db.setServerSetting(interaction.guild.id, 'welcomeMessage', customMessage);
            await interaction.reply({ content: `[OK] Welcome message set to: \`${customMessage}\``, ephemeral: true });
        } else if (subcommand === 'set-leave') {
            db.setServerSetting(interaction.guild.id, 'leaveMessage', customMessage);
            await interaction.reply({ content: `[OK] Leave message set to: \`${customMessage}\``, ephemeral: true });
        }
    }
};