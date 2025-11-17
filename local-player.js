// local-player.js
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    entersState, 
    VoiceConnectionStatus 
} = require('@discordjs/voice');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { embedColor } = require('./config.json');
const fs = require('fs');

const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

// ... (formatDuration bleibt gleich)
function formatDuration(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Erstellt einen Opus-Stream direkt aus einer lokalen Datei mit ffmpeg.
 * @param {string} filePath Der Pfad zur MP3/WAV/etc. Datei
 * @returns {ReadableStream} Ein Opus-Stream
 */
function createLocalStream(filePath) {
    console.log(`[DEBUG] Starte FFmpeg Stream für Datei: ${filePath}`);
    
    const args = [
        '-i', filePath,
        '-analyzeduration', '0',
        '-loglevel', '0',
        '-f', 'opus',
        '-acodec', 'libopus',
        '-ar', '48000',
        '-ac', '2',
        'pipe:1'
    ];
    
    const process = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    // --- START DES STABILITÄTS-FIXES ---
    // Fängt Fehler wie EACCES ab, BEVOR sie den Bot killen
    process.on('error', (err) => {
        console.error(`[FFMPEG Process Error] Konnte ffmpeg-Prozess nicht starten: ${err.message}`);
        // (Wir müssen hier nichts weiter tun, der 'stderr'-Stream wird ebenfalls schließen
        // und der 'player.on('error')'-Handler wird den Rest erledigen)
    });
    // --- ENDE DES STABILITÄTS-FIXES ---

    process.stderr.on('data', data => console.error(`[FFMPEG STDERR] ${data}`));
    return process.stdout;
}


/**
 * Erstellt oder holt den Player-Status für eine Gilde.
 * (Bleibt unverändert)
 */
function getOrCreateLocalState(localPlayerMap, guildId, textChannel) {
    if (localPlayerMap.has(guildId)) {
        const state = localPlayerMap.get(guildId);
        state.textChannel = textChannel;
        return state;
    }

    const player = createAudioPlayer();
    const newState = {
        connection: null,
        player: player,
        queue: [],
        textChannel: textChannel,
        isPlaying: false,
        dashboard: null,
        lastSong: null,
        loop: false,
    };

    player.on(AudioPlayerStatus.Idle, () => {
        newState.isPlaying = false;
        newState.lastSong = newState.queue.shift(); 
        if (newState.loop && newState.lastSong) {
            newState.queue.push(newState.lastSong); 
        }
        playNextLocalSong(localPlayerMap, guildId);
    });

    player.on('error', (error) => {
        console.error(`[LocalPlayer Error] Gilde ${guildId}:`, error);
        newState.isPlaying = false;
        playNextLocalSong(localPlayerMap, guildId);
    });

    localPlayerMap.set(guildId, newState);
    return newState;
}

/**
 * Spielt den nächsten Song in der lokalen Warteschlange.
 * (Bleibt unverändert)
 */
async function playNextLocalSong(localPlayerMap, guildId) {
    const guildState = localPlayerMap.get(guildId);
    if (!guildState || guildState.isPlaying || guildState.queue.length === 0) {
        if (!guildState.loop && guildState.dashboard) {
            const finishedEmbed = new EmbedBuilder().setColor(embedColor).setTitle('Local queue finished.');
            await guildState.dashboard.edit({ embeds: [finishedEmbed], components: [] }).catch(console.error);
            guildState.dashboard = null;
        }
        if (guildState.queue.length === 0) {
             guildState.isPlaying = false;
             return;
        }
    }

    guildState.isPlaying = true;
    const song = guildState.queue[0]; 

    if (!fs.existsSync(song.file_path)) {
        console.error(`[LocalPlayer] Datei nicht gefunden: ${song.file_path}`);
        guildState.textChannel.send(`[!] Error: Could not find file for "${song.title}". Skipping.`);
        guildState.queue.shift(); 
        guildState.isPlaying = false;
        return playNextLocalSong(localPlayerMap, guildId);
    }

    try {
        const stream = createLocalStream(song.file_path);
        const resource = createAudioResource(stream); 
        
        guildState.player.play(resource);
        await entersState(guildState.player, AudioPlayerStatus.Playing, 5_000);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('local_stop').setLabel('[STOP]').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('local_skip').setLabel('>>-->').setStyle(ButtonStyle.Primary)
        );
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setAuthor({ name: 'Now Playing (Local File)' })
            .setTitle(song.title)
            .setDescription(`**Artist:** ${song.artist || 'Unknown'}\n**Album:** ${song.album || 'Unknown'}`)
            .setFooter({ text: `Duration: ${formatDuration(song.duration)}` });

        if (guildState.dashboard) {
            await guildState.dashboard.edit({ embeds: [embed], components: [row] });
        } else {
            guildState.dashboard = await guildState.textChannel.send({ embeds: [embed], components: [row] });
        }
        
    } catch (err) {
        // Der 'EACCES'-Fehler wird jetzt hier als 'err' ankommen,
        // anstatt den Bot abzustürzen.
        console.error(`[LocalPlayer] Playback Error für "${song.title}":`, err);
        guildState.textChannel?.send(`Error playing **${song.title}**. Skipping. (Reason: ${err.message})`);
        guildState.queue.shift();
        guildState.isPlaying = false;
        playNextLocalSong(localPlayerMap, guildId);
    }
}

module.exports = {
    getOrCreateLocalState,
    playNextLocalSong
};