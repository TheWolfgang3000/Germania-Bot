// radio-player.js
const { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus } = require('@discordjs/voice');
const { EmbedBuilder } = require('discord.js');
const { embedColor } = require('./config.json');

async function handleRadioCommand(message, args, radioConnections) {
    if (!message.member?.voice?.channel) {
        return message.channel.send('[!] You must be in a voice channel to start the radio.').then(m => setTimeout(() => m.delete().catch(console.error), 5000));
    }

    const streamUrl = args[0];
    if (!streamUrl) {
        return message.channel.send('[!] Please provide a valid audio stream URL.').then(m => setTimeout(() => m.delete().catch(console.error), 5000));
    }

    if (radioConnections.has(message.guild.id)) {
        return message.channel.send('[!] The radio is already playing. Use `!radiostop` first.').then(m => setTimeout(() => m.delete().catch(console.error), 5000));
    }

    const channel = message.member.voice.channel;
    const statusMessage = await message.channel.send(`[...] Connecting to radio stream...`);

    try {
        const player = createAudioPlayer();
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        player.on('error', error => {
            console.error(`Radio Player Error in guild ${message.guild.id}:`, error);
            connection.destroy();
        });

        connection.on(VoiceConnectionStatus.Destroyed, () => {
            radioConnections.delete(message.guild.id);
        });

        const resource = createAudioResource(streamUrl);
        player.play(resource);
        connection.subscribe(player);

        radioConnections.set(message.guild.id, { connection, player });
        
        // --- ÄNDERUNG 1: Embed angepasst (kein Emoji, korrekte Farbe) ---
        const radioEmbed = new EmbedBuilder()
            .setColor(embedColor) // Verwendet die Farbe aus deiner config.json
            .setTitle('[ RADIO ON AIR ]') // Text statt Emoji
            .setDescription(`Now playing the live stream in **${channel.name}**.`);
        
        await statusMessage.edit({ content: null, embeds: [radioEmbed] });

        // --- ÄNDERARUNG 2: Nachricht wird nach 15 Sekunden gelöscht ---
        setTimeout(() => {
            statusMessage.delete().catch(console.error);
        }, 15000); // 15 Sekunden

    } catch (error) {
        console.error("Radio command failed:", error);
        await statusMessage.edit('[ERROR] Could not connect to the radio stream. Please check the URL.');
    }
}

function handleRadioStopCommand(message, radioConnections) {
    const state = radioConnections.get(message.guild.id);

    if (!state) {
        return message.channel.send('[!] The radio is not currently playing.').then(m => setTimeout(() => m.delete().catch(console.error), 10000));
    }

    state.connection.destroy();
    // Die Bestätigungsnachricht wird nun auch nach 10 Sekunden gelöscht
    message.channel.send('[OK] Radio stopped and disconnected.').then(m => setTimeout(() => m.delete().catch(console.error), 10000));
}

module.exports = {
    handleRadioCommand,
    handleRadioStopCommand,
};