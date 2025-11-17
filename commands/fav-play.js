// commands/fav-play.js
const { SlashCommandBuilder } = require('discord.js');
const musicPlayer = require('../music-player.js');
const db = require('../db-manager.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fav-play')
        .setDescription('Plays your favorite songs.')
        .addStringOption(option =>
            option.setName('number_or_all')
                .setDescription('The number of the song from /favorites, or "all".')
                .setRequired(true)),
        
    async execute(interaction) {
        // 'handleFavoritePlayCommand' ist komplex.
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
            return interaction.reply({ 
                content: 'You must be in a voice channel to use this command!', 
                ephemeral: true 
            });
        }

        const query = interaction.options.getString('number_or_all');
        const userData = db.getUserData(interaction.guild.id, interaction.user.id);

        const fakeMessage = {
            member: interaction.member,
            guild: interaction.guild,
            author: interaction.user,
            channel: {
                send: async (options) => {
                    // fängt 'Added song...' oder 'Invalid number...' ab
                    return interaction.reply(options);
                }
            }
        };

        // 'args' ist jetzt ein Array, das die Query enthält
        await musicPlayer.handleFavoritePlayCommand(
            fakeMessage, 
            [query], // erwartet 'args' als Array
            interaction.client.guildsMap, 
            userData
        );
    }
};