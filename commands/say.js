// commands/say.js
const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Makes the bot say a message in a specific channel.')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The text you want the bot to say.')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send the message in (defaults to current).')
                .addChannelTypes(ChannelType.GuildText) // Nur Textkanäle erlauben
                .setRequired(false))
        // Setzt die Berechtigung: Nur Mitglieder mit "Manage Messages"
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
    
    async execute(interaction) {
        // Logik migriert von handleSay
        const sayMessage = interaction.options.getString('message');
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

        try {
            await targetChannel.send(sayMessage);
            await interaction.reply({ content: 'Message sent successfully.', ephemeral: true });
        } catch (error) {
            console.error('Error sending /say message:', error);
            await interaction.reply({ content: `Could not send message to ${targetChannel}. Do I have permissions?`, ephemeral: true });
        }
    }
};