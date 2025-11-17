// commands/c.js
const { SlashCommandBuilder } = require('discord.js');
const db = require('../db-manager.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('c')
        .setDescription('Executes a custom server command.')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('The name of the custom command you want to run.')
                .setRequired(true)
                .setAutocomplete(true)), // Wichtig für die "idiotensichere" Bedienung

    // Autocomplete-Funktion, die dem Benutzer die Befehle vorschlägt
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const commands = db.listCustomCommands(interaction.guild.id);
        
        // Filtern und mappen in das Format, das Discord erwartet
        const filtered = commands
            .filter(cmd => cmd.command_name.startsWith(focusedValue))
            .map(cmd => ({ name: cmd.command_name, value: cmd.command_name }));
        
        await interaction.respond(filtered.slice(0, 25)); // Maximal 25 Optionen anzeigen
    },

    async execute(interaction) {
        const commandName = interaction.options.getString('command').toLowerCase();
        const command = db.getCustomCommand(interaction.guild.id, commandName);

        if (command) {
            // Befehl gefunden, sende die Antwort (öffentlich)
            await interaction.reply(command.command_response);
        } else {
            // Befehl nicht gefunden (nur für den Benutzer sichtbar)
            await interaction.reply({ content: `[!] The command \`/${commandName}\` does not exist.`, ephemeral: true });
        }
    }
};