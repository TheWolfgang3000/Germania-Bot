// commands/setup-customcommand.js
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const db = require('../db-manager.js');
const { embedColor } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-customcommand')
        .setDescription('[Admin] Manages custom text commands.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Adds or updates a custom command.')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The name of the command (e.g., "rules" for /c rules).')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('response')
                        .setDescription('The text the bot should respond with (supports \\n for new lines).')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes a custom command.')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The name of the command to remove.')
                        .setRequired(true)
                        .setAutocomplete(true))) // Wir fügen Autocomplete hinzu
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lists all custom commands for this server.')),
    
    // Autocomplete-Funktion für den 'remove'-Befehl
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const commands = db.listCustomCommands(interaction.guild.id);
        const filtered = commands
            .filter(cmd => cmd.command_name.startsWith(focusedValue))
            .map(cmd => ({ name: cmd.command_name, value: cmd.command_name }));
        
        await interaction.respond(filtered.slice(0, 25)); // Maximal 25 Optionen anzeigen
    },
            
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        await interaction.deferReply({ ephemeral: true });

        if (subcommand === 'add') {
            const name = interaction.options.getString('name').toLowerCase().trim();
            let response = interaction.options.getString('response');

            // Ersetzt manuelle "\n" durch echte Zeilenumbrüche
            response = response.replace(/\\n/g, '\n');

            if (name.includes(' ') || name.length > 32) {
                return interaction.editReply('[!] Command name cannot contain spaces and must be 32 characters or less.');
            }

            db.addCustomCommand(guildId, name, response);
            await interaction.editReply(`[OK] Custom command \`/${name}\` has been created/updated.`);

        } else if (subcommand === 'remove') {
            const name = interaction.options.getString('name').toLowerCase().trim();
            const result = db.removeCustomCommand(guildId, name);

            if (result.success) {
                await interaction.editReply(`[OK] Custom command \`/${name}\` has been deleted.`);
            } else {
                await interaction.editReply(`[!] Could not find a command named \`/${name}\` to delete.`);
            }

        } else if (subcommand === 'list') {
            const commands = db.listCustomCommands(guildId);
            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`Custom Commands for ${interaction.guild.name}`)
                .setFooter({ text: `${commands.length} commands found.` });

            if (commands.length === 0) {
                embed.setDescription('No custom commands have been set up yet.');
            } else {
                let description = '';
                for (const cmd of commands) {
                    const line = `**/${cmd.command_name}**\n`;
                    if (description.length + line.length > 4096) break; // Embed-Limit
                    description += line;
                }
                embed.setDescription(description);
            }
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};