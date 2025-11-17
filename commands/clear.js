// commands/clear.js
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { embedColor } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Deletes a specified number of messages (1-100).')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The number of messages to delete.')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true))
        // Setzt die Berechtigung: Nur Mitglieder mit "Manage Messages" können dies tun
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
    
    async execute(interaction) {
        // Logik migriert von handleClear
        const amount = interaction.options.getInteger('amount');
        
        // Wir antworten sofort (aber nur für den Admin sichtbar)
        await interaction.deferReply({ ephemeral: true });

        try {
            const messages = await interaction.channel.bulkDelete(amount, true);
            
            const successEmbed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle('Messages Cleared')
                .setDescription(`Successfully deleted ${messages.size} messages.`);
            
            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error during bulk delete:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000) // Red color for error
                .setTitle('Error')
                .setDescription('Could not delete messages. They might be older than 14 days or I lack permissions.');
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};