// commands/loop.js
const { SlashCommandBuilder } = require('discord.js');
const musicPlayer = require('../music-player.js');
const db = require('../db-manager.js');
const achievementsHandler = require('../achievements-handler.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Toggles looping for the current song.'),
        
    async execute(interaction) {
        // Defer, da handleLoopCommand eine Antwort sendet
        await interaction.deferReply({ ephemeral: true });

        const fakeMessage = {
            member: interaction.member,
            guild: interaction.guild,
            channel: {
                ...interaction.channel,
                send: async (content) => {
                    // 'handleLoopCommand' sendet "Loop enabled/disabled"
                    return interaction.editReply({ content: content });
                }
            },
            author: interaction.user
        };
        
        const userData = db.getUserData(interaction.guild.id, interaction.user.id);
        await musicPlayer.handleLoopCommand(fakeMessage, interaction.client.guildsMap, userData);
    }
};