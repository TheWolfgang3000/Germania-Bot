// events/messageReactionRemove.js
const { Events } = require('discord.js');
const db = require('../db-manager.js');

// Hilfsfunktion, um die Emoji-ID (Name oder ID) zu bekommen
function getEmojiId(reaction) {
    return reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
}

module.exports = {
    name: Events.MessageReactionRemove, // Das Event für "Reaktion entfernt"
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

        // --- REACTION ROLE LOGIK (Rückwärts) ---
        try {
            const rule = db.getReactionRole(guildId, messageId, emojiId);
            if (rule && rule.role_id) {
                const member = await reaction.message.guild.members.fetch(user.id);
                if (member) {
                    await member.roles.remove(rule.role_id);
                    console.log(`[Reaction Role] Role ${rule.role_id} removed from ${user.tag}.`);
                }
            }
        } catch (error) {
            console.error(`[Reaction Role] Failed to remove role:`, error);
        }
    },
};