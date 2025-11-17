// commands/shuffle.js
const { SlashCommandBuilder } = require('discord.js');
const musicPlayer = require('../music-player.js');
const db = require('../db-manager.js');
const achievementsHandler = require('../achievements-handler.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffles the current queue.'),
        
    async execute(interaction) {
        const guildState = interaction.client.guildsMap.get(interaction.guild.id);
        if (!guildState || guildState.queue.length < 2) {
            return interaction.reply({ content: 'Not enough songs in the queue to shuffle.', ephemeral: true });
        }
        
        // Defer, da handleShuffleCommand eine Antwort sendet
        await interaction.deferReply();

        const userData = db.getUserData(interaction.guild.id, interaction.user.id);
        
        const fakeMessage = {
            member: interaction.member,
            guild: interaction.guild,
            author: interaction.user,
            channel: {
                ...interaction.channel,
                send: async (options) => {
                    // fängt 'The queue has been shuffled.' ab
                    return interaction.editReply(options);
                }
            }
        };

        await musicPlayer.handleShuffleCommand(fakeMessage, interaction.client.guildsMap, userData);
    }
};