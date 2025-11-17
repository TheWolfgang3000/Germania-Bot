// commands/setup-linking.js
const { SlashCommandBuilder, PermissionsBitField, ChannelType, EmbedBuilder } = require('discord.js');
const db = require('../db-manager.js');
const crypto = require('crypto');
const { embedColor } = require('../config.json');

// Helper function from admin-commands.js
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-linking')
        .setDescription('[Admin] Manages the cross-message channel links.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('global')
                .setDescription('Connects a channel to the global link.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The text channel to link.')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('private')
                .setDescription('Connects a channel to a private link.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The text channel to link.')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('link-name')
                        .setDescription('The name of the private link.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('password')
                        .setDescription('The password for the private link.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('create-private')
                .setDescription('Creates a new private link name and password.')
                .addStringOption(option =>
                    option.setName('link-name')
                        .setDescription('The new, unique name for the link.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('password')
                        .setDescription('The password for this new link.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlink')
                .setDescription('Disconnects a channel from any link.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The text channel to unlink.')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();
        const linkedChannels = db.getServerSetting(interaction.guild.id, 'linkedChannels') || {};

        if (subcommand === 'global') {
            // Logic from handleGlobalLink
            const channel = interaction.options.getChannel('channel');
            linkedChannels[channel.id] = { type: 'global' };
            db.setServerSetting(interaction.guild.id, 'linkedChannels', linkedChannels);
            await interaction.editReply(`[OK] Channel ${channel} is now connected to the **global** link.`);

        } else if (subcommand === 'private') {
            // Logic from handlePrivateLink
            const channel = interaction.options.getChannel('channel');
            const linkName = interaction.options.getString('link-name');
            const password = interaction.options.getString('password');
            
            const privateLinks = db.getPrivateLinks();
            const storedHash = privateLinks[linkName];

            if (!storedHash) {
                return interaction.editReply(`[!] Private link \`${linkName}\` does not exist.`);
            }

            const hashedInputPassword = hashPassword(password);
            if (hashedInputPassword !== storedHash) {
                return interaction.editReply('[!] Incorrect password for this private link.');
            }

            linkedChannels[channel.id] = { type: 'private', linkName: linkName };
            db.setServerSetting(interaction.guild.id, 'linkedChannels', linkedChannels);
            await interaction.editReply(`[OK] Channel ${channel} is now connected to the private link \`${linkName}\`.`);

        } else if (subcommand === 'create-private') {
            // Logic from handlePrivateLinkCreate
            const linkName = interaction.options.getString('link-name');
            const password = interaction.options.getString('password');

            const privateLinks = db.getPrivateLinks();
            if (privateLinks[linkName]) {
                return interaction.editReply(`[!] A private link with the name \`${linkName}\` already exists.`);
            }

            const hashedPassword = hashPassword(password);
            db.savePrivateLink(linkName, hashedPassword);
            await interaction.editReply(`[OK] Private link \`${linkName}\` has been created.`);

        } else if (subcommand === 'unlink') {
            // Logic from handleUnlink
            const channel = interaction.options.getChannel('channel');

            if (!linkedChannels[channel.id]) {
                return interaction.editReply('[!] This channel is not linked.');
            }

            delete linkedChannels[channel.id];
            db.setServerSetting(interaction.guild.id, 'linkedChannels', linkedChannels);
            await interaction.editReply(`[OK] The link for channel ${channel} has been removed.`);
        }
    }
};