// profile-commands.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('./db-manager.js');
const levelingSystem = require('./leveling-system.js');
const { achievements: allAchievements } = require('./achievements-handler.js');
const shopCommands = require('./shop-commands.js');
const inventoryCommands = require('./inventory-commands.js');

// Hilfsfunktion für die Dauer (bleibt gleich)
function formatDuration(ms) {
    if (ms < 0) ms = -ms;
    const time = {
        d: Math.floor(ms / 86400000),
        h: Math.floor(ms / 3600000) % 24,
        m: Math.floor(ms / 60000) % 60,
    };
    const parts = Object.entries(time)
        .filter(val => val[1] !== 0)
        .map(([key, val]) => `${val}${key}`);
    return parts.length > 0 ? parts.join(', ') : '0m';
}

// Generiert das Haupt-Profil (bleibt gleich)
function generateProfileView(member, userData) {
    const xpForNextLevel = levelingSystem.getXpForLevel(userData.level);
    
    // --- NEW LOGIC START ---
    let activeColor = userData.themeColor || '#0099ff'; // Default color
    
    // Check if a theme is equipped in the global user data
    if (userData.equipped_theme) {
        // Find the item details in the user's inventory
        const inventory = db.getUserInventory(member.id);
        const equippedItem = inventory.find(item => item.item_id === userData.equipped_theme);
        
        // If the item exists and has color data, use it
        if (equippedItem && equippedItem.type === 'THEME' && equippedItem.data) {
            activeColor = equippedItem.data;
        }
    }
    // --- NEW LOGIC END ---

    const profileEmbed = new EmbedBuilder()
        .setColor(activeColor) // Use the active color
        .setAuthor({ name: `${member.user.username}'s Profile`, iconURL: member.user.displayAvatarURL() })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
            { name: '📜 Motto', value: userData.motto || '*No motto set.*' },
            { name: '⭐ Level', value: `**${userData.level}**`, inline: true },
            { name: '✨ XP', value: `${userData.xp} / ${xpForNextLevel}`, inline: true },
            { name: '💰 Points', value: `**${userData.points || 0}**`, inline: true }
        )
        .setFooter({ text: `Member since: ${member.joinedAt.toLocaleDateString('en-US')}` });
        
    if (userData.bannerUrl) { profileEmbed.setImage(userData.bannerUrl); }
    
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`profile_achievements_${member.id}`).setLabel('🏆 Achievements').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`profile_stats_${member.id}`).setLabel('📊 Stats').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`profile_inventory_${member.id}`).setLabel('🎒 Inventory').setStyle(ButtonStyle.Success)
        );
        
    return { embeds: [profileEmbed], components: [row] };
}

// *** AKTUALISIERTE FUNKTION ***
// Generiert die neue, kombinierte Statistik-Seite
function generateStatsView(member, userData) {
    const serverCounters = userData.achievementCounters;
    // Rufe die neue Funktion für globale Daten auf
    const globalCounters = db.getUserGlobalStats(member.id);

    // Bereite die Werte vor
    const serverVoiceTime = formatDuration(serverCounters.totalVcTime || 0);
    const globalVoiceTime = formatDuration(globalCounters.totalVcTime || 0);

    const statsEmbed = new EmbedBuilder()
        .setColor('#4b5b75')
        .setAuthor({ name: `${member.user.username}'s Statistics`, iconURL: member.user.displayAvatarURL() })
        .setDescription('Here you can see your statistics for this server compared to your global values.')
        .addFields(
            { 
                name: '💬 Chat-Activity', 
                value: `\`\`\`ansi\nMessages:    [2;34m${serverCounters.messageCount || 0} (Server) | ${globalCounters.messageCount || 0} (Global) \nQuestions:         [2;34m${serverCounters.questionsAsked || 0} (Server) | ${globalCounters.questionsAsked || 0} (Global) \nChat-Streak:    [2;34m${serverCounters.dailyStreak || 0} Tage (Server)[0m\n\`\`\`` 
            },
            { 
                name: '🎙️ Voice-Akctivity', 
                value: `\`\`\`ansi\nTime in Voice:  [2;34m${serverVoiceTime} (Server) | ${globalVoiceTime} (Global) \nVC-Joins:   [2;34m${serverCounters.vcJoins || 0} (Server) | ${globalCounters.vcJoins || 0} (Global)[0m\n\`\`\`` 
            },
            { 
                name: '🤖 Bot-Interaction', 
                value: `\`\`\`ansi\nCommands used: [2;34m${serverCounters.commandUsage?.total || 0} (Server) | ${globalCounters.commandUsageTotal || 0} (Global) \nSongs played: [2;34m${serverCounters.songsPlayed || 0} (Server) | ${globalCounters.songsPlayed || 0} (Global)[0m\n\`\`\`` 
            }
        )
        .setFooter({ text: 'Global values are the sum of your activities on all servers.' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`profile_main_${member.id}`).setLabel('⬅️ Back to Profile').setStyle(ButtonStyle.Secondary)
        );
    
    return { embeds: [statsEmbed], components: [row] };
}


// Handler für den !profile Befehl (bleibt gleich)
async function handleProfile(message, client) {
    const member = message.mentions.members.first() || message.member;
    const userData = db.getUserData(member.guild.id, member.id);
    const profileView = generateProfileView(member, userData);
    await message.channel.send(profileView);
}

// Handler für Button-Klicks (bleibt von der Logik her gleich)
async function handleProfileInteraction(interaction, client) {
    // ... (Logik zum Parsen der ID und zum Checken des Users bleibt gleich)
    const parts = interaction.customId.split('_');
    const action = parts[1];
    const targetUserId = parts[2];

    if (interaction.user.id !== targetUserId) {
        return interaction.reply({ content: "You can only use your own profile menu.", ephemeral: true });
    }

    const targetMember = await interaction.guild.members.fetch(targetUserId);
    const userData = db.getUserData(interaction.guild.id, targetUserId);

    switch (action) {
        case 'achievements': {
            // ... (Dieser Block bleibt unverändert)
            const globalStats = db.getGlobalAchievementStats();
            const unlocked = []; const locked = [];
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
                        if (progressData.current !== undefined && progressData.total) { progressText = `(${progressData.current}/${progressData.total})`; }
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
            const generateEmbed = (page) => {
                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                let currentItems = allItems.slice(start, end);
                return new EmbedBuilder().setColor('#0099ff').setAuthor({ name: `${targetMember.user.username}'s Achievements`, iconURL: targetMember.user.displayAvatarURL() }).setDescription(currentItems.join('\n\n') || '*Keine Erfolge zum Anzeigen.*').setFooter({ text: `Seite ${page} von ${totalPages}` });
            };
            const generateButtons = (page) => {
                return new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`profile_main_${targetUserId}`).setLabel('⬅️ Zurück').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`achievements_prev_${targetUserId}`).setLabel('<<').setStyle(ButtonStyle.Primary).setDisabled(page === 1),
                    new ButtonBuilder().setCustomId(`achievements_next_${targetUserId}`).setLabel('>>').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages)
                );
            };
            const initialEmbed = generateEmbed(currentPage);
            const initialComponents = [generateButtons(currentPage)];
            await interaction.update({ embeds: [initialEmbed], components: initialComponents });
            client.collectors.set(interaction.message.id, { currentPage, totalPages, generateEmbed, generateButtons, originalAuthorId: interaction.user.id });
            break;
        }

        case 'main': {
            const profileView = generateProfileView(targetMember, userData);
            await interaction.update(profileView);
            client.collectors.delete(interaction.message.id);
            break;
        }

        case 'stats': {
            const statsView = generateStatsView(targetMember, userData);
            await interaction.update(statsView);
            client.collectors.delete(interaction.message.id);
            break;
        }

        // *** KORRIGIERTER/HINZUGEFÜGTER BLOCK ***
        case 'inventory': {
            const inventoryView = inventoryCommands.generateInventoryPage({ page: 1, user: interaction.user, guild: interaction.guild });
            await interaction.update(inventoryView);

            const inventory = db.getUserInventory(interaction.user.id);
            const totalPages = Math.ceil(inventory.length / 5) || 1;
            if (totalPages > 1) {
                client.collectors.set(interaction.message.id, {
                    currentPage: 1,
                    totalPages,
                    originalAuthorId: interaction.user.id,
                    generatePage: (page) => inventoryCommands.generateInventoryPage({ page, user: interaction.user, guild: interaction.guild })
                });
            }
            break;
        }

        case 'shop': { // Dieser Fall wird nicht mehr vom Profil aufgerufen, kann aber für andere Dinge nützlich sein
            const shopView = shopCommands.generateShopPage({ page: 1, user: interaction.user, guild: interaction.guild });
            await interaction.update(shopView);

            const totalPages = Math.ceil(db.getShopItems().length / 5) || 1;
            if (totalPages > 1) {
                client.collectors.set(interaction.message.id, {
                    currentPage: 1, totalPages, originalAuthorId: interaction.user.id,
                    generatePage: (page) => shopCommands.generateShopPage({ page, user: interaction.user, guild: interaction.guild })
                });
            }
            break;
        }
    }
}

module.exports = {
    handleProfile,
    handleProfileInteraction,
};