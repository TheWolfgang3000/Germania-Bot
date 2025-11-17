// commands/setup-levelroles.js
const { SlashCommandBuilder, PermissionsBitField, Role, EmbedBuilder } = require('discord.js');
const db = require('../db-manager.js');
const { embedColor } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-levelroles')
        .setDescription('[Admin] Manages role rewards for leveling up.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Adds or updates a role reward for a specific level.')
                .addIntegerOption(option => 
                    option.setName('level').setDescription('The level required to get the role.').setRequired(true))
                .addRoleOption(option =>
                    option.setName('role').setDescription('The role to award.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes the role reward for a specific level.')
                .addIntegerOption(option =>
                    option.setName('level').setDescription('The level whose role reward you want to remove.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lists all currently configured level role rewards.'))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    
    async execute(interaction) {
        // Logik migriert von handleAddLevelRole, handleRemoveLevelRole, handleListLevelRoles
        
        const subcommand = interaction.options.getSubcommand();
        const levelRoles = db.getServerSetting(interaction.guild.id, 'levelRoles') || {};

        if (subcommand === 'add') {
            const level = interaction.options.getInteger('level');
            const role = interaction.options.getRole('role');

            levelRoles[level] = role.id;
            db.setServerSetting(interaction.guild.id, 'levelRoles', levelRoles);
            await interaction.reply({ content: `[OK] Role **${role.name}** will now be awarded at **Level ${level}**.`, ephemeral: true });
        
        } else if (subcommand === 'remove') {
            const level = interaction.options.getInteger('level');
            
            if (!levelRoles[level]) {
                return interaction.reply({ content: `[!] No role is configured for Level ${level}.`, ephemeral: true });
            }
            
            delete levelRoles[level];
            db.setServerSetting(interaction.guild.id, 'levelRoles', levelRoles);
            await interaction.reply({ content: `[OK] The role reward for **Level ${level}** has been removed.`, ephemeral: true });

        } else if (subcommand === 'list') {
            const description = Object.entries(levelRoles)
                .sort((a, b) => a[0] - b[0])
                .map(([level, roleId]) => `**Level ${level}**: <@&${roleId}>`)
                .join('\n') || 'No level roles configured.';
            
            const embed = new EmbedBuilder().setColor(embedColor).setTitle('Configured Level Roles').setDescription(description);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};