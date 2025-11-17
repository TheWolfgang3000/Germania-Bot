// commands/rank.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db-manager.js');
const levelingSystem = require('../leveling-system.js');
const { embedColor } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Shows your or another member\'s level and XP.') // <-- War Deutsch
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose rank you want to see (optional)')
                .setRequired(false)),
    
    async execute(interaction) {
        const member = interaction.options.getMember('user') || interaction.member;
        const userDataRank = db.getUserData(interaction.guild.id, member.id);
        const xpNeeded = levelingSystem.getXpForLevel(userDataRank.level);
        
        const rankEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
            .setDescription(`**Level:** ${userDataRank.level}\n**XP:** ${userDataRank.xp} / ${xpNeeded}`);
        
        await interaction.reply({ embeds: [rankEmbed] });
    }
};