// leveling-system.js
const { EmbedBuilder } = require('discord.js');
const db = require('./db-manager.js');
const { embedColor } = require('./config.json');

// Das Cooldown-Problem ignorieren wir wie gewünscht
const XP_COOLDOWN = 60 * 1000;
const xpCooldowns = new Map();

function getXpForLevel(level) {
    return 5 * (level ** 2) + 50 * level + 100;
}

async function handleMessageXP(message, userData) {
    const guildId = message.guild.id;
    const userId = message.author.id;

    // --- ÄNDERUNG: STANDARD-CHECK ---
    // Liest 'levelingEnabled' aus der DB.
    // Dank unseres DB-Fixes ist der Standardwert jetzt 0 (false),
    // also ist das System standardmäßig AUS.
    if (!db.getServerSetting(guildId, 'levelingEnabled')) return;

    // (Cooldown-Logik bleibt, wie von dir gewünscht, im RAM)
    const cooldownKey = `${guildId}-${userId}`;
    if (xpCooldowns.has(cooldownKey) && Date.now() - xpCooldowns.get(cooldownKey) < XP_COOLDOWN) {
        return;
    }

    const randomXp = Math.floor(Math.random() * 11) + 15;
    
    userData.xp += randomXp;
    xpCooldowns.set(cooldownKey, Date.now());

    let xpNeeded = getXpForLevel(userData.level);
    let levelUpOccurred = false;

    // --- ÄNDERUNG: MULTI-LEVEL-UP FIX (IF zu WHILE) ---
    // (Wie von dir gewünscht)
    while (userData.xp >= xpNeeded) {
        levelUpOccurred = true;
        userData.level += 1;
        userData.xp -= xpNeeded;
        xpNeeded = getXpForLevel(userData.level); // XP für das NÄCHSTE Level berechnen

        // --- Logik zur Rollenvergabe (jetzt IN der Schleife) ---
        const levelRoles = db.getServerSetting(guildId, 'levelRoles') || {};
        const roleId = levelRoles[userData.level]; // Prüft das *neue* Level
        if (roleId) {
            try {
                const role = await message.guild.roles.fetch(roleId);
                if (role && message.member) {
                    await message.member.roles.add(role);
                    
                    // Wir senden die Rollen-Nachricht als separates Embed
                    const roleEmbed = new EmbedBuilder()
                        .setColor(embedColor)
                        .setDescription(`[ROLE] You have been awarded the **${role.name}** role for reaching Level ${userData.level}!`);
                    
                    // Sende an den konfigurierten Kanal oder den aktuellen
                    const levelUpChannelId = db.getServerSetting(guildId, 'levelingChannelId');
                    let targetChannel = message.channel;
                    if (levelUpChannelId) {
                        try {
                            const fetchedChannel = await message.guild.channels.fetch(levelUpChannelId);
                            if (fetchedChannel && fetchedChannel.isTextBased()) {
                                targetChannel = fetchedChannel;
                            }
                        } catch (error) { /* Ignorieren, im aktuellen Kanal posten */ }
                    }
                    targetChannel.send({ embeds: [roleEmbed] });
                }
            } catch (error) {
                console.error(`Error awarding level role on server ${guildId}:`, error);
            }
        }
    }
    // --- ENDE DER WHILE-SCHLEIFE ---

    // Sende die Level-Up-Nachricht NUR EINMAL, NACH allen Level-Ups
    if (levelUpOccurred) {
        const levelUpEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setDescription(`[LEVEL UP] Congratulations, ${message.author}! You reached **Level ${userData.level}**!`);

        const levelUpChannelId = db.getServerSetting(guildId, 'levelingChannelId');
        let targetChannel = message.channel;
        if (levelUpChannelId) {
            try {
                const fetchedChannel = await message.guild.channels.fetch(levelUpChannelId);
                if (fetchedChannel && fetchedChannel.isTextBased()) {
                    targetChannel = fetchedChannel;
                }
            } catch (error) {
                console.error("Could not fetch configured level-up channel.", error);
            }
        }
        targetChannel.send({ embeds: [levelUpEmbed] });
    }
}

module.exports = { handleMessageXP, getXpForLevel };