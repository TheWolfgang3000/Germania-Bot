// events/threadCreate.js
const { Events } = require('discord.js');
const db = require('../db-manager.js');
const achievementsHandler = require('../achievements-handler.js');

module.exports = {
    name: Events.ThreadCreate,
    once: false,
    async execute(thread) {
        // Logik 1:1 kopiert aus deiner index.js
        try {
            const owner = await thread.fetchOwner();
            if (owner && owner.user) {
                const userData = db.getUserData(thread.guild.id, owner.user.id);
                if (!userData.achievements.THREAD) {
                    const member = await thread.guild.members.fetch(owner.user.id);
                    if (member) {
                        await achievementsHandler.unlockAchievement(member, 'THREAD', userData);
                        db.setUserData(thread.guild.id, owner.user.id, userData);
                    }
                }
            }
        } catch(error) {
            console.error("Error fetching thread owner:", error);
        }
    },
};