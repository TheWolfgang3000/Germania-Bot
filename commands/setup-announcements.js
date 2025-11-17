// commands/setup-announcements.js
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const db = require('../db-manager.js');
const { embedColor } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-announcements')
        .setDescription('[Admin] Allows or denies bot announcements (e.g., updates) on this server.')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('Allow or deny announcements from the bot owner.')
                .setRequired(true)
                .addChoices(
                    { name: 'Allow (Default)', value: 'on' },
                    { name: 'Deny', value: 'off' }
                ))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    
    async execute(interaction) {
        const status = interaction.options.getString('status');
        const isEnabled = status === 'on' ? 1 : 0; // 1 = true, 0 = false

        db.setServerSetting(interaction.guild.id, 'allow_bot_announcements', isEnabled);

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('Bot Announcement Settings')
            .setDescription(`Bot announcements for this server have been **${status === 'on' ? 'ENABLED' : 'DISABLED'}**.`);
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};