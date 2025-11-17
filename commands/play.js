// commands/play.js
const { SlashCommandBuilder } = require('discord.js');
const musicPlayer = require('../music-player.js'); 
const db = require('../db-manager.js');
const achievementsHandler = require('../achievements-handler.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song or playlist from YouTube/SoundCloud.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The YouTube link or search query.')
                .setRequired(true)),
    
    async execute(interaction) {
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
            return interaction.reply({ 
                content: 'You must be in a voice channel to use this command!', 
                ephemeral: true 
            });
        }
        
        await interaction.deferReply();

        const query = interaction.options.getString('query');
        const userData = db.getUserData(interaction.guild.id, interaction.user.id);

        // --- START DER KORREKTUR (V3 SHIM) ---
        const fakeMessage = {
            member: interaction.member,
            guild: interaction.guild,
            author: interaction.user,
            
            // 'channel' ist der SHIM für die *Antworten* ("Searching...", "Added...")
            // Er nutzt interaction.editReply()
            channel: {
                send: async (options) => {
                    try {
                        // Wir können die Interaktion nur bearbeiten (edit), nicht neu antworten
                        if (interaction.deferred || interaction.replied) {
                            return await interaction.editReply(options);
                        } else {
                            return await interaction.reply(options);
                        }
                    } catch (e) {
                        console.error("Fehler im 'channel.send' (reply) Shim:", e);
                    }
                }
            },
            
            // 'interactionChannel' ist der ECHTE Kanal
            // Diesen nutzen wir, um den GuildState zu erstellen,
            // damit zukünftige "Now Playing"-Nachrichten funktionieren.
            interactionChannel: interaction.channel 
        };
        // --- ENDE DER KORREKTUR ---

        try {
            await musicPlayer.handlePlayCommand(
                fakeMessage, 
                query.split(' '), 
                interaction.client.guildsMap, 
                userData
            );
            
            // handlePlayCommand sendet seine eigene "Added to queue"-Nachricht.
            // Wir sind hier fertig.

        } catch (error) {
            console.error("Error in /play command:", error);
            if (interaction.deferred || interaction.replied) {
                 await interaction.editReply({ content: `An error occurred: ${error.message}` });
            } else {
                await interaction.reply({ content: `An error occurred: ${error.message}` });
            }
        }
    }
};