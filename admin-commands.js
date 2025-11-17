// admin-commands.js
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const db = require('./db-manager.js');
const { embedColor } = require('./config.json');
const crypto = require('crypto');

async function sendTempReply(channel, text, duration = 10000) {
    const message = await channel.send(text);
    setTimeout(() => message.delete().catch(console.error), duration);
}

// ... (Andere Befehle bleiben gleich) ...

// --- LEVELING-SYSTEM COMMANDS (REAKTIVIERT) ---
async function handleLevelingToggle(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return sendTempReply(message.channel, '[!] You need Administrator permissions.');
    const choice = args[0]?.toLowerCase();
    if (choice !== 'on' && choice !== 'off') return sendTempReply(message.channel, '[!] Usage: `!leveling <on|off>`');
    const isEnabled = choice === 'on';
    db.setServerSetting(message.guild.id, 'levelingEnabled', isEnabled);
    sendTempReply(message.channel, `[OK] Leveling system has been **${isEnabled ? 'enabled' : 'disabled'}**.`);
}
async function handleSetLevelingChannel(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return sendTempReply(message.channel, '[!] You need Administrator permissions.');
    const channelId = args[0];
    if (!channelId) return sendTempReply(message.channel, '[!] Usage: `!set-level-channel <CHANNELID>`');
    const channel = message.guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) return sendTempReply(message.channel, '[!] Invalid Channel ID.');
    db.setServerSetting(message.guild.id, 'levelingChannelId', channelId);
    sendTempReply(message.channel, `[OK] The level-up announcement channel has been set to ${channel}.`);
}
async function handleAddLevelRole(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return sendTempReply(message.channel, '[!] You need Administrator permissions.');
    const level = parseInt(args[0]);
    const roleId = args[1]?.replace(/<@&|>/g, ''); // Bereinigt die Rollen-Erwähnung
    if (isNaN(level) || level <= 0 || !roleId) return sendTempReply(message.channel, '[!] Usage: `!add-level-role <level> <@role>`');
    const role = message.guild.roles.cache.get(roleId);
    if (!role) return sendTempReply(message.channel, '[!] Invalid Role.');
    
    const levelRoles = db.getServerSetting(message.guild.id, 'levelRoles') || {};
    levelRoles[level] = roleId;
    db.setServerSetting(message.guild.id, 'levelRoles', levelRoles);
    sendTempReply(message.channel, `[OK] Role **${role.name}** will now be awarded at **Level ${level}**.`);
}
async function handleAddShopItem(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return sendTempReply(message.channel, '[!] You need Administrator permissions.');
    }

    // Syntax: !additem <id> <price> <type> <name|description> <data>
    // Beispiel: !additem theme_blue 100 THEME Blaues Theme|Ein cooles blaues Design. #3498db
    const [itemId, priceStr, type, ...rest] = args;
    const price = parseInt(priceStr);
    
    if (!itemId || isNaN(price) || !type || rest.length === 0) {
        return sendTempReply(message.channel, '[!] Usage: `!additem <id> <price> <type> <name|description> [data]`');
    }

    const data = rest[rest.length - 1].startsWith('#') || rest[rest.length - 1].startsWith('http') ? rest.pop() : null;
    const nameAndDesc = rest.join(' ').split('|');
    const name = nameAndDesc[0].trim();
    const description = nameAndDesc[1]?.trim() || 'No description provided.';

    const result = db.addShopItem({ itemId, name, description, price, type: type.toUpperCase(), data });

    if (result.success) {
        sendTempReply(message.channel, `[OK] Shop item "${name}" was successfully added/updated.`);
    } else {
        sendTempReply(message.channel, `[ERROR] Could not add item to the shop. Check console for details.`);
    }
}
async function handleRemoveLevelRole(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return sendTempReply(message.channel, '[!] You need Administrator permissions.');
    const level = parseInt(args[0]);
    if (isNaN(level) || level <= 0) return sendTempReply(message.channel, '[!] Usage: `!remove-level-role <level>`');
    
    const levelRoles = db.getServerSetting(message.guild.id, 'levelRoles') || {};
    if (!levelRoles[level]) return sendTempReply(message.channel, `[!] No role is configured for Level ${level}.`);
    
    delete levelRoles[level];
    db.setServerSetting(message.guild.id, 'levelRoles', levelRoles);
    sendTempReply(message.channel, `[OK] The role reward for **Level ${level}** has been removed.`);
}
async function handleListLevelRoles(message) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return sendTempReply(message.channel, '[!] You need Administrator permissions.');
    const levelRoles = db.getServerSetting(message.guild.id, 'levelRoles') || {};
    const description = Object.entries(levelRoles)
        .sort((a, b) => a[0] - b[0]) // Sortiert nach Level
        .map(([level, roleId]) => `**Level ${level}**: <@&${roleId}>`)
        .join('\n') || 'No level roles configured.';
    const embed = new EmbedBuilder().setColor(embedColor).setTitle('Configured Level Roles').setDescription(description);
    message.channel.send({ embeds: [embed] });
}
// ... (Rest der Datei bleibt unverändert) ...
async function handleAchievementsToggle(message, args) { if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return sendTempReply(message.channel, '[!] You need Administrator permissions.'); const choice = args[0]?.toLowerCase(); if (choice !== 'on' && choice !== 'off') return sendTempReply(message.channel, '[!] Usage: `!achievements <on|off>`'); const isEnabled = choice === 'on'; db.setServerSetting(message.guild.id, 'achievementsEnabled', isEnabled); sendTempReply(message.channel, `[OK] Achievement system has been **${isEnabled ? 'enabled' : 'disabled'}**.`); }
async function handleSetAchievementsChannel(message, args) { if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return sendTempReply(message.channel, '[!] You need Administrator permissions.'); const channelId = args[0]; if (!channelId) return sendTempReply(message.channel, '[!] Usage: `!set-achievements-channel <CHANNELID>`'); const channel = message.guild.channels.cache.get(channelId); if (!channel || !channel.isTextBased()) return sendTempReply(message.channel, '[!] Invalid Channel ID.'); db.setServerSetting(message.guild.id, 'achievementsChannelId', channelId); sendTempReply(message.channel, `[OK] The achievement announcement channel has been set to ${channel}.`); }
async function handleSetLogChannel(message, args) { if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return sendTempReply(message.channel, '[!] You need Administrator permissions.'); const channelId = args[0]; if (!channelId) return sendTempReply(message.channel, '[!] Usage: `!set-log-channel <CHANNELID>`'); const channel = message.guild.channels.cache.get(channelId); if (!channel || !channel.isTextBased()) return sendTempReply(message.channel, '[!] Invalid Channel ID.'); db.setServerSetting(message.guild.id, 'logChannelId', channelId); sendTempReply(message.channel, `[OK] The log channel has been set to ${channel}.`); }
async function handleSetWelcomeChannel(message, args) { if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return sendTempReply(message.channel, '[!] You need Administrator permissions.'); const channelId = args[0]; if (!channelId) return sendTempReply(message.channel, '[!] Usage: `!set-welcome-channel <CHANNELID>`'); const channel = message.guild.channels.cache.get(channelId); if (!channel || !channel.isTextBased()) return sendTempReply(message.channel, '[!] Invalid Channel ID.'); db.setServerSetting(message.guild.id, 'welcomeChannelId', channelId); sendTempReply(message.channel, `[OK] The welcome/leave channel has been set to ${channel}.`); }
async function handleSetWelcomeMessage(message, args) { if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return sendTempReply(message.channel, '[!] You need Administrator permissions.'); const customMessage = args.join(' '); if (!customMessage) return sendTempReply(message.channel, '[!] Please provide a message. Placeholders: `{user}`, `{username}`, `{server}`'); sendTempReply(message.channel, `[OK] Welcome message set (Funktion wird noch angepasst).`); }
async function handleSetLeaveMessage(message, args) { if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return sendTempReply(message.channel, '[!] You need Administrator permissions.'); const customMessage = args.join(' '); if (!customMessage) return sendTempReply(message.channel, '[!] Please provide a message. Placeholders: `{user}`, `{username}`, `{server}`'); sendTempReply(message.channel, `[OK] Leave message set (Funktion wird noch angepasst).`); }
function hashPassword(password) { return crypto.createHash('sha256').update(password).digest('hex'); }
async function handlePrivateLinkCreate(message, args) { if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return sendTempReply(message.channel, '[!] You need Administrator permissions.'); const linkName = args[0]; const password = args[1]; if (!linkName || !password) return sendTempReply(message.channel, '[!] Usage: `!private-link-create <name> <password>`'); const privateLinks = db.getPrivateLinks(); if (privateLinks[linkName]) return sendTempReply(message.channel, `[!] A private link with the name \`${linkName}\` already exists.`); const hashedPassword = hashPassword(password); db.savePrivateLink(linkName, hashedPassword); sendTempReply(message.channel, `[OK] Private link \`${linkName}\` has been created.`); }
async function handleGlobalLink(message, args) { if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return sendTempReply(message.channel, '[!] You need Administrator permissions.'); const channelId = args[0]; if (!channelId) return sendTempReply(message.channel, '[!] Usage: `!global-link <CHANNELID>`'); const channel = message.guild.channels.cache.get(channelId); if (!channel || !channel.isTextBased()) return sendTempReply(message.channel, '[!] Invalid Channel ID.'); const linkedChannels = db.getServerSetting(message.guild.id, 'linkedChannels') || {}; linkedChannels[channelId] = { type: 'global' }; db.setServerSetting(message.guild.id, 'linkedChannels', linkedChannels); sendTempReply(message.channel, `[OK] Channel ${channel} is now connected to the **global** link.`); }
async function handlePrivateLink(message, args) { if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return sendTempReply(message.channel, '[!] You need Administrator permissions.'); const channelId = args[0]; const linkName = args[1]; const password = args[2]; if (!channelId || !linkName || !password) return sendTempReply(message.channel, '[!] Usage: `!private-link <CHANNELID> <name> <password>`'); const channel = message.guild.channels.cache.get(channelId); if (!channel || !channel.isTextBased()) return sendTempReply(message.channel, '[!] Invalid Channel ID.'); const privateLinks = db.getPrivateLinks(); const storedHash = privateLinks[linkName]; if (!storedHash) return sendTempReply(message.channel, `[!] Private link \`${linkName}\` does not exist.`); const hashedInputPassword = hashPassword(password); if (hashedInputPassword !== storedHash) return sendTempReply(message.channel, '[!] Incorrect password for this private link.'); const linkedChannels = db.getServerSetting(message.guild.id, 'linkedChannels') || {}; linkedChannels[channelId] = { type: 'private', linkName: linkName }; db.setServerSetting(message.guild.id, 'linkedChannels', linkedChannels); sendTempReply(message.channel, `[OK] Channel ${channel} is now connected to the private link \`${linkName}\`.`); }
async function handleUnlink(message, args) { if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return sendTempReply(message.channel, '[!] You need Administrator permissions.'); const channelId = args[0]; if (!channelId) return sendTempReply(message.channel, '[!] Usage: `!unlink <CHANNELID>`'); const linkedChannels = db.getServerSetting(message.guild.id, 'linkedChannels') || {}; if (!linkedChannels[channelId]) return sendTempReply(message.channel, '[!] This channel is not linked.'); delete linkedChannels[channelId]; db.setServerSetting(message.guild.id, 'linkedChannels', linkedChannels); sendTempReply(message.channel, `[OK] The link for channel <#${channelId}> has been removed.`); }
async function handleClear(message, args) { if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return sendTempReply(message.channel, '[!] You need "Manage Messages" permission.'); const amount = parseInt(args[0]); if (isNaN(amount) || amount <= 0 || amount > 100) return sendTempReply(message.channel, '[!] Please provide a number between 1 and 100.'); try { await message.channel.bulkDelete(amount, true); const reply = await message.channel.send(`[OK] Deleted ${amount} messages.`); setTimeout(() => reply.delete().catch(console.error), 5000); } catch (error) { console.error('Error during bulk delete:', error); sendTempReply(message.channel, '[ERROR] Could not delete messages. They might be older than 14 days.'); } }
async function handleSay(message, args) { if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return sendTempReply(message.channel, '[!] You need "Manage Messages" permission.'); const sayMessage = args.join(' '); if (!sayMessage) return sendTempReply(message.channel, '[!] Please provide a message for me to say.'); message.channel.send(sayMessage); }
async function handleSetCommandChannel(message, args) { if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return sendTempReply(message.channel, '[!] You need Administrator permissions.'); const channelId = args[0]; if (!channelId) return sendTempReply(message.channel, '[!] Usage: `!set-command-channel <CHANNELID>`'); const channel = message.guild.channels.cache.get(channelId); if (!channel || !channel.isTextBased()) return sendTempReply(message.channel, '[!] Invalid Channel ID.'); db.setServerSetting(message.guild.id, 'commandChannelId', channelId); sendTempReply(message.channel, `[OK] Bot commands are now restricted to ${channel}.`); }
async function handleClearCommandChannel(message) { if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return sendTempReply(message.channel, '[!] You need Administrator permissions.'); db.setServerSetting(message.guild.id, 'commandChannelId', null); sendTempReply(message.channel, '[OK] Bot commands can now be used in any channel.'); }

module.exports = { 
    handleSetLogChannel, handleSetWelcomeChannel, handleSetWelcomeMessage, handleSetLeaveMessage,
    handleLevelingToggle, handleSetLevelingChannel, handleAddLevelRole, handleRemoveLevelRole, handleListLevelRoles,
    handlePrivateLinkCreate, handleGlobalLink, handlePrivateLink, handleUnlink,
    handleClear, handleSay,
    handleSetCommandChannel, handleClearCommandChannel,
    handleAchievementsToggle, handleSetAchievementsChannel,
    handleAddShopItem
};