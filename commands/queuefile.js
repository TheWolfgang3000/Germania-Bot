// commands/queuefile.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { embedColor } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queuefile')
        .setDescription('Displays the current local file queue.'),
    
    async execute(interaction) {
        const guildState = interaction.client.localPlayerMap.get(interaction.guild.id);
        if (!guildState || guildState.queue.length === 0) {
            return interaction.reply({ content: 'The local queue is empty.', ephemeral: true });
        }

        let description = '';
        const queueToShow = guildState.queue.slice(0, 15);
        description = queueToShow.map((song, index) => `**${index + 1}.** ${song.title} (${song.artist || 'Unknown'})`).join('\n');
        
        if (guildState.queue.length > 15) {
            description += `\n\n... and ${guildState.queue.length - 15} more songs.`;
        }

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('Current Local Queue')
            .setDescription(description);
        
        await interaction.reply({ embeds: [embed] });
    }
};