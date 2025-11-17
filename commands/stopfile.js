// commands/stopfile.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { embedColor } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stopfile')
        .setDescription('Stops the local file player and clears its queue.'),
    
    async execute(interaction) {
        const guildState = interaction.client.localPlayerMap.get(interaction.guild.id);
        if (!guildState) {
            return interaction.reply({ content: 'The local player is not active.', ephemeral: true });
        }

        guildState.queue = [];
        guildState.loop = false;
        guildState.player.stop();
        
        if (guildState.dashboard) {
            const stoppedEmbed = new EmbedBuilder().setColor(0x4F545C).setTitle('Local playback stopped and queue cleared.');
            guildState.dashboard.edit({ embeds: [stoppedEmbed], components: [] }).then(() => guildState.dashboard = null).catch(console.error);
        }
        
        if (guildState.connection) {
            guildState.connection.destroy();
        }
        
        interaction.client.localPlayerMap.delete(interaction.guild.id);
        await interaction.reply('Stopped the local file player.');
    }
};