// commands/setup-logs.js
const { SlashCommandBuilder, PermissionsBitField, ChannelType, EmbedBuilder } = require('discord.js');
const db = require('../db-manager.js');
const { embedColor } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-logs')
        .setDescription('[Admin] Configures the logging channels for the server.')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of log you want to set or clear.')
                .setRequired(true)
                .addChoices(
                    { name: 'Message Logs (Edit/Delete)', value: 'log_messages' },
                    { name: 'Member Logs (Roles/Nicknames)', value: 'log_members' },
                    { name: 'Voice Logs (Join/Leave)', value: 'log_voice' },
                    { name: 'Server Logs (Channels/Roles)', value: 'log_server' }
                ))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send logs to. (Leave blank to disable this log type)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)) // Nicht erforderlich, damit wir löschen können
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const logType = interaction.options.getString('type');
        const channel = interaction.options.getChannel('channel');

        let confirmationMessage = "";

        if (channel) {
            // Setzt den Kanal
            db.setServerSetting(interaction.guild.id, logType, channel.id);
            confirmationMessage = `[OK] Logs for **${logType}** will now be sent to ${channel}.`;
        } else {
            // Löscht den Kanal (setzt auf null)
            db.setServerSetting(interaction.guild.id, logType, null);
            confirmationMessage = `[OK] Logs for **${logType}** have been disabled.`;
        }

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('Log Settings Updated')
            .setDescription(confirmationMessage);
        
        await interaction.editReply({ embeds: [embed] });
    }
};