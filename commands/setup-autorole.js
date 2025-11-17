// commands/setup-autorole.js
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const db = require('../db-manager.js');
const { embedColor } = require('../config.json');

const PARAMETER_CHOICES = [
    { name: 'Level (z.B. 50)', value: 'LEVEL' },
    { name: 'Total Messages (z.B. 1000)', value: 'MESSAGE_COUNT' },
    { name: 'Days on Server (z.B. 365)', value: 'JOIN_AGE_DAYS' },
    { name: 'Hours in Voice Chat (z.B. 100)', value: 'VC_TIME_HOURS' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-autorole')
        .setDescription('[Admin] Manages roles automatically assigned based on user stats.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Adds or updates an automatic role rule.')
                .addRoleOption(option => 
                    option.setName('role').setDescription('The role to be awarded.').setRequired(true))
                .addStringOption(option =>
                    option.setName('parameter')
                        .setDescription('The statistic to track.')
                        .setRequired(true)
                        .addChoices(...PARAMETER_CHOICES))
                .addIntegerOption(option =>
                    option.setName('value')
                        .setDescription('The required amount (e.g., 50 for Level 50).')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes an automatic role rule.')
                .addRoleOption(option => 
                    option.setName('role').setDescription('The role whose rule you want to remove.').setRequired(true))
                .addStringOption(option =>
                    option.setName('parameter')
                        .setDescription('The specific rule parameter to remove.')
                        .setRequired(true)
                        .setAutocomplete(true))) // Autocomplete für einfaches Löschen
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lists all active auto-role rules for this server.')),
    
    async autocomplete(interaction) {
        // Zeigt nur die Parameter an, die für die ausgewählte Rolle bereits existieren
        const focusedValue = interaction.options.getFocused();
        const role = interaction.options.getRole('role');
        if (!role) return;

        const rules = db.listAutoRoles(interaction.guild.id);
        const filtered = rules
            .filter(rule => rule.role_id === role.id && rule.parameter_type.startsWith(focusedValue))
            .map(rule => ({ name: rule.parameter_type, value: rule.parameter_type }));
        
        await interaction.respond(filtered.slice(0, 25));
    },
            
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        await interaction.deferReply({ ephemeral: true });

        if (subcommand === 'add') {
            const role = interaction.options.getRole('role');
            const parameter = interaction.options.getString('parameter');
            const value = interaction.options.getInteger('value');

            if (value <= 0) {
                return interaction.editReply('[!] The required value must be greater than 0.');
            }
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.editReply('[!] I cannot assign this role because it is higher than or equal to my own highest role.');
            }

            db.addAutoRole(guildId, role.id, parameter, value);
            await interaction.editReply(`[OK] Rule updated: Users will receive the \`${role.name}\` role when their \`${parameter}\` reaches \`${value}\`.\n*(Note: This check runs approximately every hour.)*`);

        } else if (subcommand === 'remove') {
            const role = interaction.options.getRole('role');
            const parameter = interaction.options.getString('parameter');
            
            const result = db.removeAutoRole(guildId, role.id, parameter);

            if (result.success) {
                await interaction.editReply(`[OK] The rule for \`${role.name}\` based on \`${parameter}\` has been deleted.`);
            } else {
                await interaction.editReply(`[!] Could not find a rule for \`${role.name}\` matching that parameter.`);
            }

        } else if (subcommand === 'list') {
            const rules = db.listAutoRoles(guildId);
            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`Auto-Role Rules for ${interaction.guild.name}`)
                .setFooter({ text: `${rules.length} rules found.` });

            if (rules.length === 0) {
                embed.setDescription('No auto-role rules have been set up yet.');
            } else {
                let description = '';
                for (const rule of rules) {
                    const line = `**<@&${rule.role_id}>** when **${rule.parameter_type}** >= **${rule.required_value}**\n`;
                    if (description.length + line.length > 4096) {
                        description += "...and more.";
                        break; 
                    }
                    description += line;
                }
                embed.setDescription(description);
            }
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};