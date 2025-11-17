// music-player.js
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const Genius = require('genius-lyrics');
const geniusClient = new Genius.Client();
const { getFavorites } = require('./favorites-manager.js');
const { embedColor } = require('./config.json');
const achievementsHandler = require('./achievements-handler.js');
const db = require('./db-manager.js');

const YOUTUBE_COOKIES = 'youtube_cookies.txt';

// --- START DER KORREKTUR (V8 - Python-Pfad) ---
// Wir rufen nicht mehr 'yt-dlp' direkt auf (was Py 3.8 verwenden würde),
// sondern zwingen die Ausführung über 'python3.10'.
const YTDLP_COMMAND = 'python3.10';
// --- ENDE DER KORREKTUR ---

function formatDuration(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function createProgressBar(current, total) {
    const totalSecs = total;
    const currentSecs = Math.floor(current / 1000);

    if (totalSecs === null || totalSecs === undefined || isNaN(totalSecs) || totalSecs <= 0 || isNaN(currentSecs)) {
        return '[▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬] Metadata unavailable';
    }
    const safeCurrentSecs = Math.max(0, Math.min(currentSecs, totalSecs));
    const percentage = Math.floor((safeCurrentSecs / totalSecs) * 100);
    const barLength = 20;
    const filledLength = Math.round(barLength * (percentage / 100));
    
    const safeFilledLength = Math.max(0, filledLength);
    const safeEmptyLength = Math.max(0, barLength - safeFilledLength);

    const bar = '█'.repeat(safeFilledLength) + '░'.repeat(safeEmptyLength);
    return `[${bar}] ${formatDuration(safeCurrentSecs)} / ${formatDuration(totalSecs)}`;
}


function createStream(url) {
    console.log(`[DEBUG] Starte yt-dlp Stream für URL: ${url}`);
    
    // V8-KORREKTUR: Expliziter Python 3.10 Aufruf
    const baseArgs = [
        '-m', 'yt_dlp', // '-m yt_dlp' statt 'yt-dlp'
        url, 
        '-f', 'bestaudio/best', 
        '-o', '-', 
        '--no-playlist', 
        '--buffer-size', '5M', 
        '--quiet',
        '--extractor-args', 'youtube:player_client=mweb'
    ];

    if (fs.existsSync(YOUTUBE_COOKIES)) baseArgs.push('--cookies', YOUTUBE_COOKIES);
    if (ffmpegPath) baseArgs.push('--ffmpeg-location', ffmpegPath);
    
    const process = spawn(YTDLP_COMMAND, baseArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    process.stderr.on('data', data => console.error(`[YTDLP STDERR] ${data}`));
    return process.stdout;
}


async function getSingleTrackDetails(url) {
    try {
        // V8-KORREKTUR: Expliziter Python 3.10 Aufruf
        const args = [
            '-m', 'yt_dlp',
            url, 
            '--dump-single-json', 
            '--no-playlist', 
            '--quiet',
            '--extractor-args', 'youtube:player_client=mweb'
        ];
        if (fs.existsSync(YOUTUBE_COOKIES)) args.push('--cookies', YOUTUBE_COOKIES);
        
        const process = spawn(YTDLP_COMMAND, args);
        let output = '';
        for await (const chunk of process.stdout) output += chunk;
        
        if (!output) {
            throw new Error('yt-dlp returned no data for this URL.');
        }
        
        const info = JSON.parse(output);
        if (!info) { 
            throw new Error('yt-dlp returned null JSON.');
        }

        const title = info.title || 'Title not found';
        const duration = info.duration || 0;
        const finalUrl = info.webpage_url || (info.id ? `https://www.youtube.com/watch?v=${info.id}` : url);

        return { title: title, url: finalUrl, duration: duration };
    } catch (err) {
        console.error(`[FEHLER] getSingleTrackDetails für URL ${url}:`, err.message);
        return { title: 'Fehler beim Abrufen des Titels', url: url, duration: 0 };
    }
}

async function searchAsFallback(query) {
    try {
        console.log(`[DEBUG] Fallback-Suche für: ${query}`);
        // V8-KORREKTUR: Expliziter Python 3.10 Aufruf
        const args = [
            '-m', 'yt_dlp',
            `ytsearch1:${query}`, 
            '--dump-single-json', 
            '--quiet',
            '--extractor-args', 'youtube:player_client=mweb'
        ];
        if (fs.existsSync(YOUTUBE_COOKIES)) args.push('--cookies', YOUTUBE_COOKIES);

        const process = spawn(YTDLP_COMMAND, args);

        let output = '';
        for await (const chunk of process.stdout) output += chunk;

        if (!output) {
            throw new Error('Fallback-Suche hat keine Ausgabe geliefert (nicht gefunden).');
        }
        
        const info = JSON.parse(output);
        if (!info || !info.entries || info.entries.length === 0) {
            throw new Error('Fallback-Suche hat keine Ergebnisse (entries) gefunden.');
        }
        
        const video = info.entries[0];
        
        if (!video || !video.id) {
             throw new Error('Fallback-Suche fand ein Video, aber ohne ID.');
        }

        const title = video.title || 'Title not found';
        const url = video.webpage_url || `https://www.youtube.com/watch?v=${video.id}`; 
        const duration = video.duration || 0;

        return { type: 'video', title: title, url: url, duration: duration };
    } catch (searchErr) {
        console.error(`[FEHLER] Fallback-Suche für "${query}":`, searchErr.message);
        throw new Error('Konnte kein Video oder Playlist finden.'); 
    }
}

async function getTrackInfo(query) {
    const isUrl = query.startsWith('http');
            
    try {
        // V8-KORREKTUR: Expliziter Python 3.10 Aufruf
        const args = [
            '-m', 'yt_dlp',
            query, 
            isUrl ? '--no-playlist' : '--flat-playlist', 
            '--quiet',
            '--extractor-args', 'youtube:player_client=mweb'
        ];
        if (fs.existsSync(YOUTUBE_COOKIES)) args.push('--cookies', YOUTUBE_COOKIES);
        
        const process = spawn(YTDLP_COMMAND, args);
        let output = '';
        for await (const chunk of process.stdout) output += chunk;

        if (!output) {
            if (isUrl) {
                throw new Error('yt-dlp returned no data for this URL.');
            }
            console.log(`[DEBUG] Kein direktes Ergebnis für die Anfrage, versuche Fallback-Suche.`);
            return await searchAsFallback(query);
        }
        
        const info = JSON.parse(output);
        if (!info) { 
            throw new Error('yt-dlp returned null JSON.');
        }
        
        if (info._type === 'playlist') {
            const songs = info.entries
                .filter(entry => entry && (entry.url || entry.id)) 
                .map(entry => ({
                    title: entry.title || 'Unbenannt',
                    url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
                    duration: null 
                }));
            return { type: 'playlist', title: info.title || 'Untitled Playlist', songs: songs };
        } 
        
        else {
            const title = info.title || 'Title not found';
            const url = info.webpage_url || (info.id ? `https://www.youtube.com/watch?v=${info.id}` : query);
            const duration = info.duration || 0;
            
            if (!info.id) {
                 if (!isUrl) throw new Error('Video-Info gefunden, aber die ID fehlt.');
            }
            
            return { type: 'video', title: title, url: url, duration: duration };
        }
    } catch (err) {
        console.log(`[DEBUG] Hauptfunktion getTrackInfo fehlgeschlagen. Grund: ${err.message}`);
        
        if (isUrl) {
            throw new Error(`Konnte die URL nicht analysieren: ${err.message}`);
        }
        
        return await searchAsFallback(query);
    }
}


function getOrCreateGuildState(guildsMap, guildId, textChannel) {
    if (guildsMap.has(guildId)) {
        const state = guildsMap.get(guildId);
        state.textChannel = textChannel;
        return state;
    }
    const player = createAudioPlayer();
    const newState = {
        connection: null, player, queue: [], textChannel, loop: false, lastSong: null,
        isPlaying: false, dashboard: null, progressInterval: null, songStart: 0,
        songHistory: [], pausedAt: 0,
    };
    player.on(AudioPlayerStatus.Idle, () => {
        if (newState.lastSong) {
            newState.songHistory.push(newState.lastSong);
            if (newState.songHistory.length > 10) newState.songHistory.shift();
        }
        newState.isPlaying = false;
        if (newState.progressInterval) clearInterval(newState.progressInterval);
        playNextSong(guildsMap, guildId);
    });
    player.on('error', (error) => {
        console.error(`[FEHLER] Player Error in Gilde ${guildId}:`, error);
        if (newState.progressInterval) clearInterval(newState.progressInterval);
        newState.isPlaying = false;
        playNextSong(guildsMap, guildId);
    });
    guildsMap.set(guildId, newState);
    return newState;
}

function startProgressInterval(guildState, embed, song) {
    if (guildState.progressInterval) clearInterval(guildState.progressInterval);
    guildState.progressInterval = setInterval(async () => {
        if (guildState.player.state.status !== AudioPlayerStatus.Playing || !guildState.dashboard) {
            clearInterval(guildState.progressInterval);
            return;
        }
        const playbackTime = Date.now() - guildState.songStart;
        
        const progressBar = createProgressBar(playbackTime, song.duration);
        const updatedEmbed = new EmbedBuilder(embed.data).setDescription(progressBar);
        
        await guildState.dashboard.edit({ embeds: [updatedEmbed] }).catch(() => {
            clearInterval(guildState.progressInterval);
            guildState.dashboard = null; 
        });
    }, 5000);
}

async function playNextSong(guildsMap, guildId) {
    const guildState = guildsMap.get(guildId);
    if (!guildState || guildState.isPlaying) return;
    if (guildState.progressInterval) clearInterval(guildState.progressInterval);
    if (guildState.queue.length === 0) {
        if (guildState.loop && guildState.lastSong) {
            guildState.queue.push(guildState.lastSong);
        } else {
            if (guildState.dashboard) {
                 const finishedEmbed = new EmbedBuilder().setColor(embedColor).setTitle('Queue finished.');
                 await guildState.dashboard.edit({ embeds: [finishedEmbed], components: [] }).catch(() => {});
                 guildState.dashboard = null;
            }
            setTimeout(() => {
                const state = guildsMap.get(guildId);
                if (state && !state.isPlaying) {
                    state.connection?.destroy();
                    guildsMap.delete(guildId);
                }
            }, 30000);
            return;
        }
    }
    guildState.isPlaying = true;
    let song = guildState.queue.shift();
    
    if (song.duration === null) {
        console.log(`[DEBUG] Lazy Loading: Lade Details für: ${song.title}`);
        try {
            const fullDetails = await getSingleTrackDetails(song.url);
            song = { ...song, ...fullDetails };
        } catch (e) {
            console.error(`[FEHLER] Lazy Loading für ${song.title} fehlgeschlagen`, e);
            guildState.textChannel.send(`Could not fetch details for **${song.title}**. Skipping.`).catch(console.error);
            guildState.isPlaying = false;
            playNextSong(guildsMap, guildId);
            return;
        }
    }

    guildState.lastSong = song;
    guildState.songStart = Date.now();
    try {
        const stream = createStream(song.url);
        const resource = createAudioResource(stream);
        guildState.player.play(resource);
        await entersState(guildState.player, AudioPlayerStatus.Playing, 15_000);
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('back').setLabel('<--<<').setStyle(ButtonStyle.Primary).setDisabled(guildState.songHistory.length === 0),
            new ButtonBuilder().setCustomId('pause_play').setLabel('||').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('stop').setLabel('[STOP]').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('skip').setLabel('>>-->').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('favorite').setLabel('<3').setStyle(ButtonStyle.Secondary)
        );

        const progressBar = createProgressBar(0, song.duration);
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setAuthor({ name: 'Now Playing' })
            .setTitle(song.title)
            .setURL(song.url)
            .setDescription(progressBar)
            .setFooter({ text: 'Status: Playing' });

        if (guildState.dashboard) {
            await guildState.dashboard.edit({ embeds: [embed], components: [row] }).catch(() => {
                guildState.dashboard = null; 
            });
        } 
        
        if (!guildState.dashboard) {
            guildState.dashboard = await guildState.textChannel.send({ embeds: [embed], components: [row] });
        }
        
        startProgressInterval(guildState, embed, song);
    } catch (err) {
        console.error(`[FEHLER] Playback Error für "${song.title}":`, err);
        guildState.textChannel?.send(`Error playing **${song.title}**. Skipping.`).catch(console.error);
        if (guildState.progressInterval) clearInterval(guildState.progressInterval);
        guildState.isPlaying = false;
        playNextSong(guildsMap, guildId);
    }
}

async function handlePlayCommand(message, args, guildsMap, userData) {
    if (!message.member?.voice?.channel) {
        const reply = await message.channel.send('You must be in a voice channel to use this command!');
        setTimeout(() => reply.delete().catch(console.error), 5000);
        return;
    }
    const query = args.join(' ');
    if (!query) {
        const reply = await message.channel.send('Please provide a YouTube/SoundCloud URL or a search query.');
        setTimeout(() => reply.delete().catch(console.error), 5000);
        return;
    }

    const realChannel = message.interactionChannel || message.channel;
    const guildState = getOrCreateGuildState(guildsMap, message.guild.id, realChannel);

    if (!guildState.connection || guildState.connection.state.status === VoiceConnectionStatus.Destroyed) {
        guildState.connection = joinVoiceChannel({ channelId: message.member.voice.channel.id, guildId: message.guild.id, adapterCreator: message.guild.voiceAdapterCreator });
        guildState.connection.subscribe(guildState.player);
    }
    
    const processingMessage = await message.channel.send('Searching...');
    
    try {
        const mediaInfo = await getTrackInfo(query);
        let songsAdded = 0;
        let replyContent = ''; 

        if (mediaInfo.type === 'playlist') {
            guildState.queue.push(...mediaInfo.songs);
            songsAdded = mediaInfo.songs.length;
            replyContent = `Added playlist **${mediaInfo.title}** (${songsAdded} songs) to the queue.`;
            if (songsAdded > 20 && !userData.achievements.PLAYLIST_PRO) await achievementsHandler.unlockAchievement(message.member, 'PLAYLIST_PRO', userData);
        } else {
            guildState.queue.push(mediaInfo);
            songsAdded = 1;
            replyContent = `Added **${mediaInfo.title}** to the queue.`;
        }

        await processingMessage.edit(replyContent);

        if (guildState.queue.length >= 5 && !userData.achievements.QUEUE_STARTER) await achievementsHandler.unlockAchievement(message.member, 'QUEUE_STARTER', userData);
        if (guildState.queue.length >= 20 && !userData.achievements.QUEUE_MASTER) await achievementsHandler.unlockAchievement(message.member, 'QUEUE_MASTER', userData);

        userData.achievementCounters.songsPlayed = (userData.achievementCounters.songsPlayed || 0) + songsAdded;
        if (!userData.achievements.FIRST_SONG) await achievementsHandler.unlockAchievement(message.member, 'FIRST_SONG', userData);
        if (userData.achievementCounters.songsPlayed >= 100 && !userData.achievements.HIT_MASTER) await achievementsHandler.unlockAchievement(message.member, 'HIT_MASTER', userData);
        
        setTimeout(() => processingMessage.delete().catch(console.error), 5000);
        
        if (!guildState.isPlaying) {
            playNextSong(guildsMap, message.guild.id);
        }
    } catch (error) {
        await processingMessage.edit(`Error: ${error.message}`);
    }
}

async function handleSkipCommand(message, guildsMap, userData) {
    const guildState = guildsMap.get(message.guild.id);
    if (!guildState || !guildState.isPlaying) return;
    
    userData.achievementCounters.commandUsage.skip = (userData.achievementCounters.commandUsage.skip || 0) + 1;
    if (userData.achievementCounters.commandUsage.skip >= 50 && !userData.achievements.SKIP_MASTER) await achievementsHandler.unlockAchievement(message.member, 'SKIP_MASTER', userData);
    
    guildState.player.stop(); 
}

function handleStopCommand(message, guildsMap) {
    const guildState = guildsMap.get(message.guild.id);
    if (!guildState) return;
    
    if (guildState.progressInterval) clearInterval(guildState.progressInterval);
    guildState.queue = [];
    guildState.loop = false;
    if (guildState.dashboard) {
        const stoppedEmbed = new EmbedBuilder().setColor(0x4F545C).setTitle('Playback stopped and queue cleared.');
        guildState.dashboard.edit({ embeds: [stoppedEmbed], components: [] }).then(() => guildState.dashboard = null).catch(console.error);
    }
    guildState.player.stop();
    guildState.connection?.destroy();
    guildsMap.delete(message.guild.id);
}

function handlePauseCommand(message, guildsMap) {
    const guildState = guildsMap.get(message.guild.id);
    if (!guildState || !guildState.isPlaying || guildState.player.state.status === AudioPlayerStatus.Paused) return;
    guildState.player.pause();
}
function handleResumeCommand(message, guildsMap) {
    const guildState = guildsMap.get(message.guild.id);
    if (!guildState || guildState.player.state.status !== AudioPlayerStatus.Paused) return;
    guildState.player.unpause();
}
async function handleLoopCommand(message, guildsMap, userData) {
    const guildState = getOrCreateGuildState(guildsMap, message.guild.id, message.channel);
    guildState.loop = !guildState.loop;
    
    userData.achievementCounters.commandUsage.loop = (userData.achievementCounters.commandUsage.loop || 0) + 1;
    if(userData.achievementCounters.commandUsage.loop >= 10 && !userData.achievements.LOOP_LOVER) await achievementsHandler.unlockAchievement(message.member, 'LOOP_LOVER', userData);

    const reply = `Loop ${guildState.loop ? 'enabled' : 'disabled'}.`;
    message.channel.send({ content: reply });
}
function handleQueueCommand(message, guildsMap) {
    const guildState = guildsMap.get(message.guild.id);
    if (!guildState || (guildState.queue.length === 0 && !guildState.isPlaying)) {
        return message.channel.send('The queue is empty.').then(msg => setTimeout(() => msg.delete(), 5000));
    }
    let description = '';
    if (guildState.lastSong) {
        description += `**Now Playing:** [${guildState.lastSong.title}](${guildState.lastSong.url})\n\n`;
    }
    if (guildState.queue.length > 0) {
        const queueToShow = guildState.queue.slice(0, 10);
        description += queueToShow.map((song, index) => `**${index + 1}.** ${song.title}`).join('\n');
        if (guildState.queue.length > 10) {
            description += `\n\n... and ${guildState.queue.length - 10} more songs.`;
        }
    } else {
        description += 'No more songs in the queue.';
    }
    const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('Current Queue')
        .setDescription(description);
    message.channel.send({ embeds: [embed] });
}
async function handleShuffleCommand(message, guildsMap, userData) {
    const guildState = guildsMap.get(message.guild.id);
    if (!guildState || guildState.queue.length < 2) {
        return message.channel.send({ content: 'Not enough songs in the queue to shuffle.' });
    }
    
    userData.achievementCounters.commandUsage.shuffle = (userData.achievementCounters.commandUsage.shuffle || 0) + 1;
    if(userData.achievementCounters.commandUsage.shuffle >= 10 && !userData.achievements.SHUFFLE_KING) await achievementsHandler.unlockAchievement(message.member, 'SHUFFLE_KING', userData);
    
    for (let i = guildState.queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [guildState.queue[i], guildState.queue[j]] = [guildState.queue[j], guildState.queue[i]];
    }
    message.channel.send({ content: 'The queue has been shuffled.' });
}
async function handleNowPlayingCommand(message, guildsMap) {
    const guildState = guildsMap.get(message.guild.id);
    if (!guildState || !guildState.isPlaying || !guildState.lastSong) {
        const reply = await message.channel.send('Nothing is currently playing.');
        setTimeout(() => reply.delete().catch(console.error), 5000);
        return;
    }
    if (guildState.dashboard) {
        await guildState.dashboard.delete().catch(console.error);
    }
    const song = guildState.lastSong;
    const isPaused = guildState.player.state.status === AudioPlayerStatus.Paused;
    const playbackTime = isPaused ? (guildState.pausedAt - guildState.songStart) : (Date.now() - guildState.songStart);
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('back').setLabel('<--<<').setStyle(ButtonStyle.Primary).setDisabled(guildState.songHistory.length === 0),
        new ButtonBuilder().setCustomId('pause_play').setLabel(isPaused ? '|>' : '||').setStyle(isPaused ? ButtonStyle.Primary : ButtonStyle.Success),
        new ButtonBuilder().setCustomId('stop').setLabel('[STOP]').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('skip').setLabel('>>-->').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('favorite').setLabel('<3').setStyle(ButtonStyle.Secondary)
    );
    
    const progressBar = createProgressBar(playbackTime, song.duration);
    const embed = new EmbedBuilder()
        .setColor(isPaused ? 0xFAA61A : embedColor)
        .setAuthor({ name: 'Now Playing' })
        .setTitle(song.title)
        .setURL(song.url)
        .setDescription(progressBar)
        .setFooter({ text: `Status: ${isPaused ? 'Paused' : 'Playing'}` });
    guildState.dashboard = await message.channel.send({ embeds: [embed], components: [row] });
}
async function handleLyricsCommand(message, guildsMap) {
    const guildState = guildsMap.get(message.guild.id);
    if (!guildState || !guildState.isPlaying || !guildState.lastSong) {
        return message.channel.send('Nothing is currently playing.').then(msg => setTimeout(() => msg.delete(), 5000));
    }
    const waitingMsg = await message.channel.send(`Searching lyrics for **${guildState.lastSong.title}**...`);
    try {
        const searches = await geniusClient.songs.search(guildState.lastSong.title);
        const firstSong = searches[0];
        if (!firstSong) {
            return waitingMsg.edit(`Could not find lyrics for **${guildState.lastSong.title}**.`);
        }
        const lyrics = await firstSong.lyrics();
        if (!lyrics) {
            return waitingMsg.edit(`No lyrics available for **${guildState.lastSong.title}**.`);
        }
        const trimmedLyrics = lyrics.length > 4000 ? lyrics.substring(0, 4000) + "\n..." : lyrics;
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setAuthor({ name: `Lyrics for ${firstSong.artist.name}`})
            .setTitle(firstSong.title)
            .setURL(firstSong.url)
            .setThumbnail(firstSong.image)
            .setDescription(trimmedLyrics);
        await waitingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
        console.error("Lyrics command error:", error);
        await waitingMsg.edit('An unexpected error occurred while fetching lyrics.');
    }
}
async function handleFavoritesCommand(message, guildsMap) {
    const userId = message.author.id;
    const favorites = getFavorites(userId);
    if (favorites.length === 0) {
        return message.channel.send("You don't have any favorite songs yet. Use the <3 button on a playing song to add one.").then(msg => setTimeout(() => msg.delete().catch(console.error), 10000));
    }
    const itemsPerPage = 10;
    const totalPages = Math.ceil(favorites.length / itemsPerPage);
    let currentPage = 1;
    const generateEmbed = (page) => {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const currentItems = favorites.slice(start, end);
        const description = currentItems.map((song, index) => `**${start + index + 1}.** [${song.title}](${song.url})`).join('\n');
        return new EmbedBuilder().setColor(embedColor).setTitle(`${message.author.username}'s Favorites`).setDescription(description).setFooter({ text: `Page ${page} of ${totalPages}` });
    };
    const generateButtons = (page) => {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`fav_prev_${message.author.id}`).setLabel('<<').setStyle(ButtonStyle.Primary).setDisabled(page === 1),
            new ButtonBuilder().setCustomId(`fav_next_${message.author.id}`).setLabel('>>').setStyle(ButtonStyle.Primary).setDisabled(page === totalPages)
        );
    };
    const embed = generateEmbed(currentPage);
    const components = totalPages > 1 ? [generateButtons(currentPage)] : [];
    const favMessage = await message.channel.send({ embeds: [embed], components: components });
    if (totalPages > 1) {
        const client = message.client;
         client.collectors.set(favMessage.id, {
            originalAuthorId: message.author.id,
            currentPage: currentPage,
            totalPages: totalPages,
            items: favorites,
            generateEmbed: generateEmbed,
            generateButtons: generateButtons,
        });
    }
}
async function handleFavoritePlayCommand(message, args, guildsMap, userData) {
    const userId = message.author.id;
    const favorites = getFavorites(userId);
    if (favorites.length === 0) {
        return message.channel.send("You don't have any favorites to play.").then(msg => setTimeout(() => msg.delete(), 5000));
    }
    if (!message.member?.voice?.channel) {
        return message.channel.send("You must be in a voice channel to play your favorites.").then(msg => setTimeout(() => msg.delete(), 5000));
    }
    const guildState = getOrCreateGuildState(guildsMap, message.guild.id, message.channel);
    if (!guildState.connection || guildState.connection.state.status === VoiceConnectionStatus.Destroyed) {
        guildState.connection = joinVoiceChannel({ channelId: message.member.voice.channel.id, guildId: message.guild.id, adapterCreator: message.guild.voiceAdapterCreator });
        guildState.connection.subscribe(guildState.player);
    }
    let songsAdded = 0;
    if (args[0] && args[0].toLowerCase() === 'all') {
        guildState.queue.push(...favorites);
        songsAdded = favorites.length;
        await message.channel.send(`Added all ${songsAdded} of your favorite songs to the queue.`);
    } 
    else {
        const songNumber = parseInt(args[0], 10);
        if (isNaN(songNumber) || songNumber < 1 || songNumber > favorites.length) {
            return message.channel.send(`Invalid number. Please use a number between 1 and ${favorites.length}, or use 'all'.`).then(msg => setTimeout(() => msg.delete(), 7000));
        }
        const song = favorites[songNumber - 1];
        guildState.queue.push(song);
        songsAdded = 1;
        await message.channel.send(`Added **${song.title}** to the queue from your favorites.`);
    }

    userData.achievementCounters.songsPlayed = (userData.achievementCounters.songsPlayed || 0) + songsAdded;
    if (!userData.achievements.FIRST_SONG) await achievementsHandler.unlockAchievement(message.member, 'FIRST_SONG', userData);
    if (userData.achievementCounters.songsPlayed >= 100 && !userData.achievements.HIT_MASTER) await achievementsHandler.unlockAchievement(message.member, 'HIT_MASTER', userData);

    if (!guildState.isPlaying) {
        playNextSong(guildsMap, message.guild.id);
    }
}

module.exports = {
    handlePlayCommand, handleSkipCommand, handleStopCommand, handlePauseCommand,
    handleResumeCommand, handleLoopCommand, handleQueueCommand, handleShuffleCommand,
    handleNowPlayingCommand, handleLyricsCommand, handleFavoritesCommand,
    handleFavoritePlayCommand, startProgressInterval, getOrCreateGuildState
};