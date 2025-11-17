// events/messageDelete.js
const { Events, EmbedBuilder } = require('discord.js'); // EmbedBuilder hinzugefügt
const db = require('../db-manager.js');
const achievementsHandler = require('../achievements-handler.js');
const { sendLog } = require('../helpers/logHelper.js'); // <-- NEUER IMPORT

module.exports = {
    name: Events.MessageDelete,
    once: false,
    async execute(message) {
        
        // --- NEUE LOGGING-LOGIK (Plan 6) ---
        // Wir loggen, BEVOR wir die Achievement-Logik machen, 
        // falls die Nachricht 'partial' (alt) ist und keinen Autor hat.
        if (message.guild && !message.author?.bot) {
            const embed = new EmbedBuilder()
                .setAuthor({ name: message.author ? message.author.tag : 'Unknown User', iconURL: message.author ? message.author.displayAvatarURL() : undefined })
                .setDescription(`**Message deleted in ${message.channel}**\n${message.content || 'No text content (might be an embed/image).'}`)
                .setColor(0xFF0000); // Rot für Löschung
            
            sendLog(message.client, message.guild, 'log_messages', embed);
        }
        // --- ENDE NEUE LOGIK ---


        // (Die Achievement-Logik von vorher bleibt unverändert)
        if (!message.guild || !message.author || message.author.bot) return;

        let member = message.member;
        if (!member) {
            try {
                member = await message.guild.members.fetch(message.author.id);
            } catch (error) {
                console.error(`Could not fetch member for messageDelete: ${message.author.id}`);
                return;
            }
        }

        const userData = db.getUserData(message.guild.id, message.author.id);

        if (Date.now() - message.createdTimestamp < 10000 && !userData.achievements.DEL1) {
            await achievementsHandler.unlockAchievement(member, 'DEL1', userData);
        }
        userData.achievementCounters.deletesMade = (userData.achievementCounters.deletesMade || 0) + 1;
        if (userData.achievementCounters.deletesMade >= 100 && !userData.achievements.DEL100) {
            await achievementsHandler.unlockAchievement(member, 'DEL100', userData);
        }
        db.setUserData(message.guild.id, message.author.id, userData);
    },
};