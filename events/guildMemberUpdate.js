// events/guildMemberUpdate.js
const { Events, EmbedBuilder } = require('discord.js'); // EmbedBuilder hinzugefügt
const db = require('../db-manager.js');
const achievementsHandler = require('../achievements-handler.js');
const { sendLog } = require('../helpers/logHelper.js'); // <-- NEUER IMPORT

module.exports = {
    name: Events.GuildMemberUpdate,
    once: false,
    async execute(oldMember, newMember) {
        
        // --- NEUE LOGGING-LOGIK (Plan 6) ---
        // Nickname-Änderung
        if (oldMember.nickname !== newMember.nickname) {
            const embed = new EmbedBuilder()
                .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.displayAvatarURL() })
                .setDescription(`${newMember} changed their nickname.`)
                .addFields(
                    { name: 'Old Nickname', value: oldMember.nickname || 'None' },
                    { name: 'New Nickname', value: newMember.nickname || 'None' }
                )
                .setColor(0xADD8E6); // Hellblau
            sendLog(newMember.client, newMember.guild, 'log_members', embed);
        }

        // Rollen-Änderung
        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;
        if (oldRoles.size > newRoles.size) { // Rolle entfernt
            const removedRole = oldRoles.find(role => !newRoles.has(role.id));
            if (removedRole) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.displayAvatarURL() })
                    .setDescription(`**Role removed** from ${newMember}\n${removedRole}`)
                    .setColor(0xDC143C); // Karmesinrot
                sendLog(newMember.client, newMember.guild, 'log_members', embed);
            }
        }
        if (oldRoles.size < newRoles.size) { // Rolle hinzugefügt
            const addedRole = newRoles.find(role => !oldRoles.has(role.id));
            if (addedRole) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.displayAvatarURL() })
                    .setDescription(`**Role added** to ${newMember}\n${addedRole}`)
                    .setColor(0x32CD32); // Limettengrün
                sendLog(newMember.client, newMember.guild, 'log_members', embed);
            }
        }
        // --- ENDE NEUE LOGIK ---

        // (Achievement-Logik von vorher bleibt unverändert)
        const userData = db.getUserData(newMember.guild.id, newMember.id);
        if (oldMember.avatar !== newMember.avatar && !userData.achievements.AVATAR) {
            await achievementsHandler.unlockAchievement(newMember, 'AVATAR', userData);
        }
        if (oldMember.nickname !== newMember.nickname) {
            userData.achievementCounters.nicknameChanges = (userData.achievementCounters.nicknameChanges || 0) + 1;
            if(userData.achievementCounters.nicknameChanges >= 10 && !userData.achievements.NICKNAME) {
                await achievementsHandler.unlockAchievement(newMember, 'NICKNAME', userData);
            }
        }
        db.setUserData(newMember.guild.id, newMember.id, userData);
    },
};