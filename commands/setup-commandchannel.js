// commands/setup-commandchannel.js
const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const db = require('../db-manager.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-commandchannel')
        .setDescription('[Admin] Restricts bot commands to a specific channel.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Restricts bot commands to a specific channel.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to restrict commands to.')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Allows bot commands in all channels again.'))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    
    async execute(interaction) {
        // Logic from handleSetCommandChannel and handleClearCommandChannel
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'set') {
            const channel = interaction.options.getChannel('channel');
            db.setServerSetting(interaction.guild.id, 'commandChannelId', channel.id);
            await interaction.reply({ content: `[OK] Bot commands are now restricted to ${channel}.`, ephemeral: true });
        } else if (subcommand === 'clear') {
            db.setServerSetting(interaction.guild.id, 'commandChannelId', null);
            await interaction.reply({ content: '[OK] Bot commands can now be used in any channel.', ephemeral: true });
        }
    }
};