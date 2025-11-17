// events/interactionCreate.js
const { Events, AudioPlayerStatus, EmbedBuilder, ActionRowBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const musicPlayer = require('../music-player.js');
const profileCommands = require('../profile-commands.js');
const inventoryCommands = require('../inventory-commands.js');
const shopCommands = require('../shop-commands.js');
const db = require('../db-manager.js');
const achievementsHandler = require('../achievements-handler.js');
const { addFavorite, removeFavorite, isFavorite } = require('../favorites-manager.js');
const { embedColor } = require('../config.json');

// Helper für "ephemeral"-Warnungs-Fix
const ephemeralReply = (content) => ({
    content: content,
    flags: [ MessageFlags.Ephemeral ]
});

module.exports = {
    name: Events.InteractionCreate, // 'interactionCreate'
    once: false,
    async execute(interaction) {
        const client = interaction.client;

        // --- Slash Command Handler ---
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}:`, error);

                // --- START DES CRASH-FIXES (10062) ---
                if (error.code === 10062) { // Unknown Interaction
                    console.warn(`[Interaction Error] Failed to reply to an expired interaction (${interaction.commandName}).`);
                    return; // Einfach aufhören, nicht abstürzen.
                }

                // Für alle anderen Fehler, versuche zu antworten.
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(ephemeralReply('There was an error while executing this command!'));
                    } else {
                        await interaction.reply(ephemeralReply('There was an error while executing this command!'));
                    }
                } catch (replyError) {
                    // Wenn das Antworten *erneut* fehlschlägt (z.B. 10062), fangen wir es hier ab.
                    console.error(`[Interaction Error] FAILED TO SEND ERROR REPLY:`, replyError);
                }
                // --- ENDE DES CRASH-FIXES ---
            }
            return; 
        }

        // --- Autocomplete Handler ---
        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            if (!command || !command.autocomplete) {
                console.warn(`No autocomplete logic found for command: ${interaction.commandName}`);
                return;
            }
            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(`Error in autocomplete for ${interaction.commandName}:`, error);
            }
            return;
        }

        // --- Button Handler ---
        if (interaction.isButton()) { 
            
            // --- CRASH-FIX (pause_play) ---
            if (interaction.customId === 'pause_play') {
                const guildState = client.guildsMap.get(interaction.guild.id);
                if (!guildState) return interaction.reply(ephemeralReply('This music player is no longer active.'));
                
                await interaction.deferUpdate();
                const isPaused = guildState.player.state.status === AudioPlayerStatus.Paused;
                if (isPaused) {
                    const pauseDuration = Date.now() - guildState.pausedAt;
                    guildState.songStart += pauseDuration;
                    guildState.player.unpause();
                    if (guildState.dashboard && guildState.dashboard.embeds.length > 0) {
                        musicPlayer.startProgressInterval(guildState, guildState.dashboard.embeds[0], guildState.lastSong);
                    }
                } else {
                    guildState.player.pause();
                    guildState.pausedAt = Date.now();
                    if (guildState.progressInterval) clearInterval(guildState.progressInterval);
                }
                try {
                    const newEmbed = new EmbedBuilder(interaction.message.embeds[0].data)
                        .setColor(isPaused ? embedColor : 0xFAA61A)
                        .setFooter({ text: `Status: ${isPaused ? 'Playing' : 'Paused'}`});
                    const newRow = new ActionRowBuilder(interaction.message.components[0].data);
                    if (newRow.components[1]) {
                        newRow.components[1].setLabel(isPaused ? '||' : '|>').setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary);
                    }
                    await interaction.message.edit({ embeds: [newEmbed], components: [newRow] });
                } catch (editError) {
                    console.error("Error editing 'pause_play' message:", editError);
                }
                return;
            }
            // --- ENDE CRASH-FIX ---

            // --- ACHIVEMENT BUTTONS ---
            if (interaction.customId.startsWith('achievements_')) {
                const collectorData = client.collectors.get(interaction.message.id);
                if (!collectorData || interaction.user.id !== collectorData.originalAuthorId) return interaction.reply(ephemeralReply("You cannot control this menu."));
                if (interaction.customId.includes('_next')) collectorData.currentPage++;
                else if (interaction.customId.includes('_prev')) collectorData.currentPage--;
                const newEmbed = collectorData.generateEmbed(collectorData.currentPage);
                const newComponents = [collectorData.generateButtons(collectorData.currentPage)];
                await interaction.update({ embeds: [newEmbed], components: newComponents });
                return;
            }

            // --- PROFILE NAVIGATION ---
            if (interaction.customId.startsWith('profile_')) {
                profileCommands.handleProfileInteraction(interaction, client);
                return;
            }

            // --- INVENTORY/SHOP NAVIGATION ---
            if (interaction.customId.startsWith('inventory_')) {
                const parts = interaction.customId.split('_');
                const action = parts[1];
                const targetUserId = parts[2];
                if (interaction.user.id !== targetUserId) {
                    return interaction.reply(ephemeralReply("You cannot control this menu."));
                }
                switch (action) {
                    case 'main':
                        const inventoryView = inventoryCommands.generateInventoryPage({ page: 1, user: interaction.user, guild: interaction.guild });
                        await interaction.update(inventoryView);
                        break;
                    case 'shop':
                        const shopView = shopCommands.generateShopPage({ page: 1, user: interaction.user, guild: interaction.guild });
                        await interaction.update(shopView);
                        const totalShopPages = Math.ceil(db.getShopItems().length / 5) || 1;
                        if (totalShopPages > 1) {
                            client.collectors.set(interaction.message.id, {
                                currentPage: 1, totalPages: totalShopPages, originalAuthorId: interaction.user.id,
                                generatePage: (page) => shopCommands.generateShopPage({ page, user: interaction.user, guild: interaction.guild })
                            });
                        }
                        break;
                }
                return;
            }

            // --- SHOP/INVENTORY PAGINATION & ACTIONS ---
            if (interaction.customId.startsWith('buy_') || interaction.customId.startsWith('equip_')) {
                // (buy/equip logic)
                console.log(`[DEBUG] Buy/Equip action triggered by ${interaction.user.tag}`);
                return;
            }
            if (interaction.customId.startsWith('shop_') || interaction.customId.startsWith('inv_')) {
                const collectorData = client.collectors.get(interaction.message.id);
                if (!collectorData || interaction.user.id !== collectorData.originalAuthorId) return interaction.reply(ephemeralReply("You cannot control this menu."));
                if (interaction.customId.includes('_next')) collectorData.currentPage++;
                else if (interaction.customId.includes('_prev')) collectorData.currentPage--;
                const newPage = collectorData.generatePage(collectorData.currentPage);
                await interaction.update(newPage);
                return;
            }
            if (interaction.customId.startsWith('fav_')) {
                 const collectorData = client.collectors.get(interaction.message.id);
                 if (!collectorData || interaction.user.id !== collectorData.originalAuthorId) return interaction.reply(ephemeralReply("You cannot control this menu."));
                 if (interaction.customId.includes('_next')) collectorData.currentPage++;
                 else if (interaction.customId.includes('_prev')) collectorData.currentPage--;
                 const newEmbed = collectorData.generateEmbed(collectorData.currentPage);
                 const newComponents = [collectorData.generateButtons(collectorData.currentPage)];
                 await interaction.update({ embeds: [newEmbed], components: newComponents });
                 return;
            }

            // --- MUSIC PLAYER BUTTONS ---
            const guildState = client.guildsMap.get(interaction.guild.id);
            if (!guildState) {
                return interaction.reply(ephemeralReply('This music player is no longer active.'));
            }
            const userData = db.getUserData(interaction.guild.id, interaction.user.id);
            if (interaction.customId !== 'favorite') {
                 await interaction.deferUpdate();
            }
            switch (interaction.customId) {
                case 'skip':
                    userData.achievementCounters.commandUsage.skip = (userData.achievementCounters.commandUsage.skip || 0) + 1;
                    if (userData.achievementCounters.commandUsage.skip >= 50 && !userData.achievements.SKIP_MASTER) await achievementsHandler.unlockAchievement(interaction.member, 'SKIP_MASTER', userData);
                    guildState.player.stop();
                    break;
                case 'stop':
                    userData.achievementCounters.commandUsage.stop = (userData.achievementCounters.commandUsage.stop || 0) + 1;
                    if (userData.achievementCounters.commandUsage.stop >= 50 && !userData.achievements.PARTY_STOPPER) await achievementsHandler.unlockAchievement(interaction.member, 'PARTY_STOPPER', userData);
                    musicPlayer.handleStopCommand({ guild: interaction.guild }, client.guildsMap);
                    break;
                case 'favorite':
                    await interaction.deferReply({ flags: [ MessageFlags.Ephemeral ] }); // Fix für 'ephemeral' Warnung
                    const song = guildState.lastSong;
                    const userId = interaction.user.id;
                    if (!song) return await interaction.editReply({ content: 'No song is currently playing.'});
                    if (isFavorite(userId, song.url)) {
                        removeFavorite(userId, song.url);
                        await interaction.editReply({ content: 'Song removed from your favorites.'});
                    } else {
                        addFavorite(userId, { title: song.title, url: song.url, duration: song.duration });
                        await interaction.editReply({ content: 'Song added to your favorites.'});
                    }
                    break;
                case 'back':
                    userData.achievementCounters.commandUsage.back = (userData.achievementCounters.commandUsage.back || 0) + 1;
                    if(userData.achievementCounters.commandUsage.back >= 20 && !userData.achievements.BACK_TRACKER) await achievementsHandler.unlockAchievement(interaction.member, 'BACK_TRACKER', userData);
                    if (guildState.songHistory.length > 0) {
                        const previousSong = guildState.songHistory.pop();
                        if (guildState.lastSong) guildState.queue.unshift(guildState.lastSong);
                        guildState.queue.unshift(previousSong);
                        guildState.player.stop();
                    }
                    break;
            }
            db.setUserData(interaction.guild.id, interaction.user.id, userData);
        }
    },
};