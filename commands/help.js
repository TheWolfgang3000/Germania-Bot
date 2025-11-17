// commands/help.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { embedColor } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows a list of available commands.')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('The category of commands you want to see.')
                .setRequired(false)
                .addChoices(
                    { name: 'Info & Profile', value: 'info' },
                    { name: 'Music', value: 'music' },
                    { name: 'Radio', value: 'radio' },
                    { name: 'Fun', value: 'fun' },
                    { name: 'Economy', value: 'economy' },
                    { name: 'Admin', value: 'admin' }
                )),
    
    async execute(interaction) {
        const commands = interaction.client.commands;
        const category = interaction.options.getString('category');

        let title = 'Help Menu';
        let description = 'Here are all my available commands. Use the option to filter by category.';
        
        // Wir definieren, welche Befehle zu welcher Kategorie gehören
        const categories = {
            info: ['ping', 'uptime', 'botinfo', 'rank', 'profile', 'achievements', 'help'],
            music: ['play', 'skip', 'stop', 'pause', 'resume', 'loop', 'queue', 'shuffle', 'nowplaying', 'lyrics', 'favorites', 'fav-play'],
            radio: ['radio', 'radiostop'],
            fun: ['meme', 'video'],
            economy: ['shop', 'inventory'],
            admin: ['clear', 'say', 'setup-logs', 'setup-leveling', 'setup-levelroles', 'setup-linking', 'setup-messages', 'setup-commandchannel', 'setup-shop', 'award-achievement']
        };

        let filteredCommands;

        if (category) {
            title = `Help: ${category.charAt(0).toUpperCase() + category.slice(1)} Commands`;
            description = `Here are all commands for the \`${category}\` category:`;
            filteredCommands = commands.filter(cmd => categories[category]?.includes(cmd.data.name));
            
            // Spezieller Fall für Admins
            if (category === 'admin' && !interaction.member.permissions.has('Administrator')) {
                return interaction.reply({ content: 'You do not have permission to view admin commands.', ephemeral: true });
            }
        } else {
            // Zeigt alle Nicht-Admin-Befehle an
            filteredCommands = commands.filter(cmd => !categories.admin.includes(cmd.data.name));
        }

        const helpEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(title)
            .setDescription(description);

        // Wir erstellen die Feld-Logik neu, um den 1024-Zeichen-Fehler zu vermeiden
        let currentField = "";
        const fields = [];

        filteredCommands.forEach(cmd => {
            const cmdString = `**/${cmd.data.name}**\n*${cmd.data.description}*\n`;
            if (currentField.length + cmdString.length > 1024) {
                fields.push({ name: 'Commands', value: currentField, inline: false });
                currentField = cmdString;
            } else {
                currentField += cmdString;
            }
        });
        
        if (currentField) {
            fields.push({ name: (fields.length > 0 ? 'Commands (cont.)' : 'Commands'), value: currentField, inline: false });
        }

        if (fields.length === 0) {
            helpEmbed.setDescription('No commands found for this category.');
        } else {
            helpEmbed.addFields(fields);
        }
        
        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    }
};