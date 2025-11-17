// commands/playfile.js
const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
const db = require('../db-manager.js');
const { getOrCreateLocalState, playNextLocalSong } = require('../local-player.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playfile')
        .setDescription('Plays a local file from the bot\'s library.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The song title or album (playlist) name to search for.')
                .setRequired(true)
                .setAutocomplete(true)), 
    
    async autocomplete(interaction) {
        try {
            const focusedValue = interaction.options.getFocused();
            if (focusedValue.length < 2) return interaction.respond([]); 

            const songs = db.searchLocalFiles(focusedValue);
            const playlists = db.listLocalPlaylists();

            // --- START DER KORREKTUR (Zeichenlimit) ---
            const songResults = songs.map(s => ({
                // Schneidet den Namen ab, um den 100-Zeichen-Limit der API zu entsprechen
                name: `🎵 ${s.title} (${s.artist || 'Unknown'})`.substring(0, 100),
                value: `song_${s.file_id}` 
            }));
            
            const playlistResults = playlists
                .filter(p => p.album.toLowerCase().includes(focusedValue.toLowerCase()))
                .map(p => ({
                    // Schneidet den Namen ab
                    name: `💿 Playlist: ${p.album}`.substring(0, 100),
                    value: `playlist_${p.album}`
                }));
            // --- ENDE DER KORREKTUR ---

            await interaction.respond([...playlistResults, ...songResults].slice(0, 25));
        } catch (error) {
            // Fängt Fehler ab, falls die Autocomplete-Antwort fehlschlägt
            console.error("Error in /playfile autocomplete:", error);
            await interaction.respond([]);
        }
    },
            
    async execute(interaction) {
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: 'You must be in a voice channel to use this command!', ephemeral: true });
        }
        
        if (interaction.client.guildsMap.has(interaction.guild.id)) {
            return interaction.reply({ content: '[!] The YouTube player is already active in this server. Use `/stop` first.', ephemeral: true });
        }

        await interaction.deferReply();

        const query = interaction.options.getString('query');
        const guildState = getOrCreateLocalState(interaction.client.localPlayerMap, interaction.guild.id, interaction.channel);

        if (!guildState.connection || guildState.connection.state.status === VoiceConnectionStatus.Destroyed) {
            guildState.connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
            guildState.connection.subscribe(guildState.player);
        }

        let addedCount = 0;
        let replyMessage = '';

        if (query.startsWith('song_')) {
            const fileId = parseInt(query.split('_')[1]);
            const song = db.getLocalFileById(fileId); 

            if (song) {
                guildState.queue.push(song);
                addedCount = 1;
                replyMessage = `Added **${song.title}** to the queue.`;
            }
        } else if (query.startsWith('playlist_')) {
            const albumName = query.substring(9);
            const songs = db.getLocalPlaylist(albumName);
            if (songs.length > 0) {
                guildState.queue.push(...songs);
                addedCount = songs.length;
                replyMessage = `Added **${songs.length}** songs from album \`${albumName}\` to the queue.`;
            }
        } else {
            // Fallback
            const songs = db.searchLocalFiles(query);
            if (songs.length > 0) {
                guildState.queue.push(songs[0]); 
                addedCount = 1;
                replyMessage = `Added best match **${songs[0].title}** to the queue.`;
            }
        }

        if (addedCount > 0) {
            await interaction.editReply(replyMessage);
            if (!guildState.isPlaying) {
                playNextLocalSong(interaction.client.localPlayerMap, interaction.guild.id);
            }
        } else {
            await interaction.editReply(`[!] Could not find any local songs or playlists matching \`${query}\`.`);
        }
    }
};