// events/guildMemberRemove.js
const { Events, EmbedBuilder } = require('discord.js');
const { sendWelcomeLeaveMessage } = require('../helpers/welcomeHelper.js');
const { sendLog } = require('../helpers/logHelper.js');

module.exports = {
    name: Events.GuildMemberRemove,
    once: false,
    async execute(member) {
        if (member.user.bot) return;

        // 1. Sende die ÖFFENTLICHE Abschiedsnachricht (Logik aus welcome-leave.js)
        sendWelcomeLeaveMessage(member.client, member, 'leave');

        // 2. Sende den ADMIN-Log (Logik aus Plan 6)
        const embed = new EmbedBuilder()
            .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
            .setDescription(`${member} left the server.`)
            .setColor(0xDC143C); // Karmesinrot
        
        sendLog(member.client, member.guild, 'log_members', embed);
    },
};