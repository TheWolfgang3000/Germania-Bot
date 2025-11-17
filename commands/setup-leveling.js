// commands/setup-leveling.js
const { SlashCommandBuilder, PermissionsBitField, ChannelType, EmbedBuilder } = require('discord.js');
const db = require('../db-manager.js');
const { embedColor } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-leveling')
        .setDescription('[Admin] Configures the leveling system.')
        .addStringOption(option =>
            option.setName('toggle')
                .setDescription('Turn the leveling system on or off.')
                .addChoices(
                    { name: 'On', value: 'on' },
                    { name: 'Off', value: 'off' }
                )
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('level-up-channel')
                .setDescription('The channel for level up announcements.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    
    async execute(interaction) {
        // Logik migriert von handleLevelingToggle und handleSetLevelingChannel
        await interaction.deferReply({ ephemeral: true });

        const toggle = interaction.options.getString('toggle');
        const channel = interaction.options.getChannel('level-up-channel');
        let confirmationMessage = "Leveling settings updated:\n";

        if (toggle) {
            const isEnabled = toggle === 'on';
            db.setServerSetting(interaction.guild.id, 'levelingEnabled', isEnabled);
            confirmationMessage += `\n- Leveling system has been **${isEnabled ? 'enabled' : 'disabled'}**.`;
        }
        if (channel) {
            db.setServerSetting(interaction.guild.id, 'levelingChannelId', channel.id);
            confirmationMessage += `\n- Level-up announcement channel set to ${channel}.`;
        }

        if (!toggle && !channel) {
            confirmationMessage = "No settings were changed. You must provide at least one option.";
        }

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('Leveling Settings')
            .setDescription(confirmationMessage);
        
        await interaction.editReply({ embeds: [embed] });
    }
};