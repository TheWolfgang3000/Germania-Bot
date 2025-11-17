// events/messageUpdate.js
const { Events, EmbedBuilder } = require('discord.js'); // EmbedBuilder hinzugefügt
const db = require('../db-manager.js');
const achievementsHandler = require('../achievements-handler.js');
const { sendLog } = require('../helpers/logHelper.js'); // <-- NEUER IMPORT

module.exports = {
    name: Events.MessageUpdate,
    once: false,
    async execute(oldMessage, newMessage) {
        
        // --- NEUE LOGGING-LOGIK (Plan 6) ---
        if (oldMessage.partial || oldMessage.author.bot || !oldMessage.guild || oldMessage.content === newMessage.content) {
            // (Wir loggen nicht, wenn der Inhalt gleich ist, z.B. nur ein Link-Embed geladen wurde)
        } else {
            const embed = new EmbedBuilder()
                .setAuthor({ name: oldMessage.author.tag, iconURL: oldMessage.author.displayAvatarURL() })
                .setDescription(`**Message edited in ${oldMessage.channel}** [Jump to Message](${newMessage.url})`)
                .addFields(
                    { name: 'Before', value: (oldMessage.content || 'N/A').substring(0, 1024) },
                    { name: 'After', value: (newMessage.content || 'N/A').substring(0, 1024) }
                )
                .setColor(0xFFA500); // Orange für Bearbeitung
            
            sendLog(newMessage.client, newMessage.guild, 'log_messages', embed);
        }
        // --- ENDE NEUE LOGIK ---
        
        // (Die Achievement-Logik von vorher bleibt unverändert)
        if (!newMessage.guild || !newMessage.author || newMessage.author.bot) return;
        if (oldMessage.content === newMessage.content) return;

        let member = newMessage.member;
        if (!member) {
            try {
                member = await newMessage.guild.members.fetch(newMessage.author.id);
            } catch (error) {
                console.error(`Could not fetch member for messageUpdate: ${newMessage.author.id}`);
                return;
            }
        }
        
        const userData = db.getUserData(newMessage.guild.id, newMessage.author.id);
        
        if (newMessage.editedTimestamp - newMessage.createdTimestamp < 10000 && !userData.achievements.EDIT1) {
            await achievementsHandler.unlockAchievement(member, 'EDIT1', userData);
        }
        userData.achievementCounters.editsMade = (userData.achievementCounters.editsMade || 0) + 1;
        if (userData.achievementCounters.editsMade >= 100 && !userData.achievements.EDIT100) {
            await achievementsHandler.unlockAchievement(member, 'EDIT100', userData);
        }
        db.setUserData(newMessage.guild.id, newMessage.author.id, userData);
    },
};