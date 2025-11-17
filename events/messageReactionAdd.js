// events/messageReactionAdd.js
const { Events } = require('discord.js');
const db = require('../db-manager.js');
const achievementsHandler = require('../achievements-handler.js');

// Hilfsfunktion, um die Emoji-ID (Name oder ID) zu bekommen
function getEmojiId(reaction) {
    return reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
}

module.exports = {
    name: Events.MessageReactionAdd,
    once: false,
    async execute(reaction, user) {
        if (user.bot) return;
        if (reaction.partial) {
            try { await reaction.fetch(); } 
            catch (error) { console.error('Something went wrong when fetching the message:', error); return; }
        }
        
        const guildId = reaction.message.guild.id;
        const messageId = reaction.message.id;
        const emojiId = getEmojiId(reaction);

        // --- NEUE REACTION ROLE LOGIK ---
        try {
            const rule = db.getReactionRole(guildId, messageId, emojiId);
            if (rule && rule.role_id) {
                const member = await reaction.message.guild.members.fetch(user.id);
                if (member) {
                    await member.roles.add(rule.role_id);
                    console.log(`[Reaction Role] Role ${rule.role_id} added to ${user.tag}.`);
                }
            }
        } catch (error) {
            console.error(`[Reaction Role] Failed to add role:`, error);
        }
        // --- ENDE NEUE LOGIK ---

        // (Die Achievement-Logik von vorher bleibt unverändert)
        const reactorUserData = db.getUserData(guildId, user.id);
        await achievementsHandler.checkReactionAchievements(reaction, user, reactorUserData);
        db.setUserData(guildId, user.id, reactorUserData);

        const authorId = reaction.message.author.id;
        if (authorId && authorId !== user.id) {
            const authorUserData = db.getUserData(guildId, authorId);
            
            if (reaction.emoji.name === '🤡' && !authorUserData.achievements.CLOWN) {
                const authorMember = await reaction.message.guild.members.fetch(authorId).catch(() => null);
                if (authorMember) await achievementsHandler.unlockAchievement(authorMember, 'CLOWN', authorUserData);
            }
            if (reaction.emoji.name === '💀') {
                authorUserData.achievementCounters.skullReactions = (authorUserData.achievementCounters.skullReactions || 0) + 1;
                if (authorUserData.achievementCounters.skullReactions >= 10 && !authorUserData.achievements.SKULL) {
                     const authorMember = await reaction.message.guild.members.fetch(authorId).catch(() => null);
                     if (authorMember) await achievementsHandler.unlockAchievement(authorMember, 'SKULL', authorUserData);
                }
            }
            db.setUserData(guildId, authorId, authorUserData);
        }
    },
};