// achievement-commands.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('./db-manager.js');
const { achievements: allAchievements } = require('./achievements-handler.js');
const { embedColor } = require('./config.json');

/**
 * Kernfunktion, die das "Aussehen" (Embeds und Buttons) der Achievement-Liste generiert und zurückgibt.
 * @param {object} options - Ein Objekt mit den benötigten Daten.
 */
async function generateAchievementsView({ member, guild, client, author }) {
    const userData = db.getUserData(guild.id, member.id);
    const globalStats = db.getGlobalAchievementStats();

    // Die Logik zur Erstellung der Textzeilen bleibt dieselbe
    const unlocked = [];
    const locked = [];
    for (const id in allAchievements) {
        const achievement = allAchievements[id];
        const userAchievementTimestamp = userData.achievements[id];
        const globalInfo = globalStats[id] || { percentage: 0 };
        const namePart = `${achievement.icon} ${achievement.name}`;
        const percentPart = `[ ${globalInfo.percentage.toFixed(1)}% ]`;
        const secretPercentPart = `[ ??? ]`;
        const totalLength = 50;
        if (userAchievementTimestamp) {
            const dots = '.'.repeat(Math.max(0, totalLength - namePart.length - percentPart.length - 2));
            const line1 = `\`${namePart}${dots}${percentPart}\` 🏆`;
            const line2 = `\`  └── ${achievement.description} (${new Date(userAchievementTimestamp).toLocaleDateString('de-DE')})\``;
            unlocked.push(`${line1}\n${line2}`);
        } else if (achievement.secret) {
            const namePartSecret = `${achievement.icon} ${'█'.repeat(achievement.name.length)}`;
            const dots = '.'.repeat(Math.max(0, totalLength - namePartSecret.length - secretPercentPart.length - 2));
            const line1 = `\`${namePartSecret}${dots}${secretPercentPart}\` ❓`;
            const line2 = `\`  └── ???????????????????????????????\``;
            locked.push(`${line1}\n${line2}`);
        } else {
            const dots = '.'.repeat(Math.max(0, totalLength - namePart.length - percentPart.length - 2));
            const line1 = `\`${namePart}${dots}${percentPart}\` 💎`;
            let progressText = '';
            if (achievement.progress) {
                const progressData = achievement.progress(userData.achievementCounters);
                if (progressData.current !== undefined && progressData.total) {
                     progressText = `(${progressData.current}/${progressData.total})`;
                }
            }
            const line2 = `\`  └── ${achievement.description} ${progressText}\``;
            locked.push(`${line1}\n${line2}`);
        }
    }

    const allItems = [];
    if (unlocked.length > 0) { allItems.push('**--- Unlocked Achievements ---**'); allItems.push(...unlocked); }
    if (locked.length > 0) { if (unlocked.length > 0) allItems.push(''); allItems.push('**--- Locked Achievements ---**'); allItems.push(...locked); }
    
    const itemsPerPage = 7;
    const totalPages = allItems.length > 0 ? Math.ceil(allItems.length / itemsPerPage) : 1;
    let currentPage = 1;

    // Diese Funktionen erstellen jetzt das Aussehen für eine bestimmte Seite
    const generatePage = (page) => {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        let currentItems = allItems.slice(start, end);
        
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setAuthor({ name: `${member.user.username}'s Achievements`, iconURL: member.user.displayAvatarURL() })
            .setDescription(currentItems.join('\n\n') || '*No achievements to display.*')
            .setFooter({ text: `Seite ${page} von ${totalPages}` });

        const components = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`profile_main_${member.id}`).setLabel('⬅️ Zurück zum Profil').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`achievements_prev_${member.id}`).setLabel('<<').setStyle(ButtonStyle.Primary).setDisabled(page === 1),
            new ButtonBuilder().setCustomId(`achievements_next_${member.id}`).setLabel('>>').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages)
        );
        return { embeds: [embed], components: [components] };
    };

    // Collector für Paginierung (falls nötig)
    if (totalPages > 1) {
        // Hier muss der Collector-Teil noch angepasst werden, wenn wir die Interaktion bearbeiten
        // Fürs Erste geben wir nur die erste Seite zurück.
    }
    
    return generatePage(currentPage);
}

/**
 * Handler für den !achievements Befehl. Ruft die Kernfunktion auf und sendet das Ergebnis.
 */
async function handleShowAchievementsCommand(message, client) {
    const targetMember = message.mentions.members.first() || message.member;
    const achievementView = await generateAchievementsView({
        member: targetMember,
        guild: message.guild,
        author: message.author,
        client: client
    });
    await message.channel.send(achievementView);
}

module.exports = {
    handleShowAchievementsCommand,
    generateAchievementsView,
};