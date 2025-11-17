// events/voiceStateUpdate.js
const { Events, EmbedBuilder } = require('discord.js');
const db = require('../db-manager.js');
const achievementsHandler = require('../achievements-handler.js');
const { sendLog } = require('../helpers/logHelper.js');

module.exports = {
    name: Events.VoiceStateUpdate,
    once: false,
    async execute(oldState, newState) {
        const member = newState.member || oldState.member;

        // --- NEUE AUTO-CLEANUP LOGIK (für BEIDE Player) ---
        if (oldState.channelId && oldState.channel.members.size === 1 && oldState.channel.members.has(oldState.client.user.id)) {
            // Der Bot ist jetzt allein in einem Kanal, den jemand verlassen hat.
            
            // 1. Prüfe den YouTube-Player
            const ytState = oldState.client.guildsMap.get(oldState.guild.id);
            if (ytState && ytState.connection && ytState.connection.joinConfig.channelId === oldState.channelId) {
                console.log(`[AutoCleanup] Bot is alone in ${oldState.channel.name}, stopping YouTube player.`);
                ytState.connection.destroy();
                oldState.client.guildsMap.delete(oldState.guild.id);
            }

            // 2. Prüfe den Lokalen-Player
            const localState = oldState.client.localPlayerMap.get(oldState.guild.id);
            if (localState && localState.connection && localState.connection.joinConfig.channelId === oldState.channelId) {
                console.log(`[AutoCleanup] Bot is alone in ${oldState.channel.name}, stopping Local player.`);
                localState.connection.destroy();
                oldState.client.localPlayerMap.delete(oldState.guild.id);
            }
            
            // 3. Prüfe den Radio-Player
            const radioState = oldState.client.radioConnections.get(oldState.guild.id);
            if (radioState && radioState.connection && radioState.connection.joinConfig.channelId === oldState.channelId) {
                console.log(`[AutoCleanup] Bot is alone in ${oldState.channel.name}, stopping Radio player.`);
                radioState.connection.destroy();
                oldState.client.radioConnections.delete(oldState.guild.id);
            }
        }
        // --- ENDE AUTO-CLEANUP ---
        
        
        if (member.user.bot) return; // Restliche Logik ist nur für Menschen

        // --- LOGGING-LOGIK (Plan 6) ---
        let embed;
        if (!oldState.channelId && newState.channelId) {
            embed = new EmbedBuilder().setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() }).setDescription(`${member} **joined** voice channel ${newState.channel}`).setColor(0x32CD32);
        } else if (oldState.channelId && !newState.channelId) {
            embed = new EmbedBuilder().setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() }).setDescription(`${member} **left** voice channel ${oldState.channel}`).setColor(0xDC143C);
        } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            embed = new EmbedBuilder().setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() }).setDescription(`${member} **switched** voice channel`).addFields({ name: 'From', value: `${oldState.channel}` }, { name: 'To', value: `${newState.channel}` }).setColor(0xADD8E6);
        }
        if (embed) {
            sendLog(newState.client, newState.guild, 'log_voice', embed);
        }
        // --- ENDE LOGGING ---

        // --- ACHIEVEMENT-LOGIK ---
        const userData = db.getUserData(newState.guild.id, newState.id);
        await achievementsHandler.checkVoiceAchievements(oldState, newState, userData);
        db.setUserData(newState.guild.id, newState.id, userData);
    },
};