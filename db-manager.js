// db-manager.js
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.resolve(__dirname, 'germania.db');
let db;

// --- INITIALISIERUNG ---

function initializeDatabase() {
    try {
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        
        const schema = `
            CREATE TABLE IF NOT EXISTS servers (
                guildId TEXT PRIMARY KEY, 
                logChannelId TEXT, 
                welcomeChannelId TEXT, 
                achievementsChannelId TEXT, 
                levelingChannelId TEXT, 
                commandChannelId TEXT, 
                levelingEnabled INTEGER DEFAULT 0, 
                achievementsEnabled INTEGER DEFAULT 1, 
                linkedChannels TEXT, 
                levelRoles TEXT,
                stats_mode TEXT DEFAULT 'off',
                stats_member_channel_id TEXT,
                stats_online_channel_id TEXT,
                log_messages TEXT,
                log_members TEXT,
                log_voice TEXT,
                log_server TEXT,
                allow_bot_announcements INTEGER DEFAULT 1,
                stats_all_members_channel_id TEXT,
                stats_bots_channel_id TEXT,
                stats_time_channel_id TEXT,
                stats_date_channel_id TEXT,
                stats_dnd_channel_id TEXT,
                stats_idle_channel_id TEXT,
                stats_offline_channel_id TEXT,
                stats_compact_channel_id TEXT
            );
            
            CREATE TABLE IF NOT EXISTS users (userId TEXT PRIMARY KEY, motto TEXT, themeColor TEXT DEFAULT '#FF0000', bannerUrl TEXT, points INTEGER DEFAULT 0, equipped_theme TEXT, social_twitch TEXT, social_twitter TEXT);
            
            CREATE TABLE IF NOT EXISTS server_users (userId TEXT, guildId TEXT, xp INTEGER DEFAULT 0, level INTEGER DEFAULT 0, serverBio TEXT, featuredServerAchievement TEXT, achievements TEXT, achievementCounters TEXT, PRIMARY KEY (userId, guildId), FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE, FOREIGN KEY (guildId) REFERENCES servers(guildId) ON DELETE CASCADE);
            CREATE TABLE IF NOT EXISTS user_favorites (userId TEXT, songUrl TEXT, songTitle TEXT, songDuration INTEGER, PRIMARY KEY (userId, songUrl), FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE);
            CREATE TABLE IF NOT EXISTS private_links (linkName TEXT PRIMARY KEY, hashedPassword TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS shop_items (item_id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, price INTEGER NOT NULL, type TEXT NOT NULL, data TEXT);
            CREATE TABLE IF NOT EXISTS user_inventory (inventory_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, item_id TEXT NOT NULL, purchase_date INTEGER NOT NULL, FOREIGN KEY (user_id) REFERENCES users(userId) ON DELETE CASCADE, FOREIGN KEY (item_id) REFERENCES shop_items(item_id) ON DELETE CASCADE);
            CREATE TABLE IF NOT EXISTS reaction_roles (guild_id TEXT NOT NULL, message_id TEXT NOT NULL, emoji_id TEXT NOT NULL, role_id TEXT NOT NULL, PRIMARY KEY (guild_id, message_id, emoji_id));
            CREATE TABLE IF NOT EXISTS custom_commands (guild_id TEXT NOT NULL, command_name TEXT NOT NULL, command_response TEXT NOT NULL, PRIMARY KEY (guild_id, command_name));
            CREATE TABLE IF NOT EXISTS auto_roles (rule_id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL, role_id TEXT NOT NULL, parameter_type TEXT NOT NULL, required_value INTEGER NOT NULL);

            /* --- NEUE TABELLE FÜR LOKALE MUSIK (Plan 10) --- */
            CREATE TABLE IF NOT EXISTS local_files (
                file_id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_path TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL,
                artist TEXT,
                album TEXT, /* Dient als "Playlist" (Unterordner) */
                duration REAL /* in Sekunden */
            );
            /* --- ENDE NEUE TABELLE --- */
        `;
        
        db.exec(schema);

        // --- MIGRATIONS-CHECKS ---
        try { db.prepare("SELECT stats_mode FROM servers LIMIT 1").get(); } catch (e) {
            console.log("[DB-MIGRATION] Adding 'stats_mode' columns...");
            db.exec("ALTER TABLE servers ADD COLUMN stats_mode TEXT DEFAULT 'off'");
            db.exec("ALTER TABLE servers ADD COLUMN stats_member_channel_id TEXT");
            db.exec("ALTER TABLE servers ADD COLUMN stats_online_channel_id TEXT");
        }
        try { db.prepare("SELECT log_messages FROM servers LIMIT 1").get(); } catch (e) {
            console.log("[DB-MIGRATION] Adding advanced logging columns...");
            db.exec("ALTER TABLE servers ADD COLUMN log_messages TEXT");
            db.exec("ALTER TABLE servers ADD COLUMN log_members TEXT");
            db.exec("ALTER TABLE servers ADD COLUMN log_voice TEXT");
            db.exec("ALTER TABLE servers ADD COLUMN log_server TEXT");
        }
        try { db.prepare("SELECT command_name FROM custom_commands LIMIT 1").get(); } catch (e) {
            console.log("[DB-MIGRATION] Adding 'custom_commands' table...");
            db.exec(`CREATE TABLE IF NOT EXISTS custom_commands (guild_id TEXT NOT NULL, command_name TEXT NOT NULL, command_response TEXT NOT NULL, PRIMARY KEY (guild_id, command_name))`);
        }
        try { db.prepare("SELECT allow_bot_announcements FROM servers LIMIT 1").get(); } catch (e) {
            console.log("[DB-MIGRATION] Adding 'allow_bot_announcements' column...");
            db.exec("ALTER TABLE servers ADD COLUMN allow_bot_announcements INTEGER DEFAULT 1");
        }
        try { db.prepare("SELECT stats_all_members_channel_id FROM servers LIMIT 1").get(); } catch (e) {
            console.log("[DB-MIGRATION] Adding 'Advanced' theme columns...");
            db.exec("ALTER TABLE servers ADD COLUMN stats_all_members_channel_id TEXT");
            db.exec("ALTER TABLE servers ADD COLUMN stats_bots_channel_id TEXT");
            db.exec("ALTER TABLE servers ADD COLUMN stats_time_channel_id TEXT");
            db.exec("ALTER TABLE servers ADD COLUMN stats_date_channel_id TEXT");
        }
        try { db.prepare("SELECT stats_dnd_channel_id FROM servers LIMIT 1").get(); } catch (e) {
            console.log("[DB-MIGRATION] Adding 'Perfect' theme columns (dnd, idle, offline)...");
            db.exec("ALTER TABLE servers ADD COLUMN stats_dnd_channel_id TEXT");
            db.exec("ALTER TABLE servers ADD COLUMN stats_idle_channel_id TEXT");
            db.exec("ALTER TABLE servers ADD COLUMN stats_offline_channel_id TEXT");
        }
        try { db.prepare("SELECT stats_compact_channel_id FROM servers LIMIT 1").get(); } catch (e) {
            console.log("[DB-MIGRATION] Adding 'Compact' theme column...");
            db.exec("ALTER TABLE servers ADD COLUMN stats_compact_channel_id TEXT");
        }
        try { db.prepare("SELECT rule_id FROM auto_roles LIMIT 1").get(); } catch (e) {
            console.log("[DB-MIGRATION] Adding 'auto_roles' table...");
            db.exec(`CREATE TABLE IF NOT EXISTS auto_roles (rule_id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL, role_id TEXT NOT NULL, parameter_type TEXT NOT NULL, required_value INTEGER NOT NULL)`);
        }

        // --- NEUER MIGRATIONS-CHECK FÜR LOKALE MUSIK ---
        try {
            db.prepare("SELECT file_id FROM local_files LIMIT 1").get();
        } catch (e) {
            console.log("[DB-MIGRATION] Adding 'local_files' table...");
            db.exec(`
                CREATE TABLE IF NOT EXISTS local_files (
                    file_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    file_path TEXT NOT NULL UNIQUE,
                    title TEXT NOT NULL,
                    artist TEXT,
                    album TEXT,
                    duration REAL
                )
            `);
        }
        // --- ENDE NEUER CHECK ---

        console.log('[DEBUG] Datenbankschema erfolgreich initialisiert (CREATE TABLE IF NOT EXISTS).');

    } catch (error) {
        console.error('[FATAL] Konnte die Datenbank nicht initialisieren:', error);
        process.exit(1);
    }
}

function getUserGlobalStats(userId) {
    const stmt = db.prepare('SELECT achievementCounters FROM server_users WHERE userId = ?');
    const rows = stmt.all(userId);
    const globalStats = { messageCount: 0, questionsAsked: 0, totalVcTime: 0, vcJoins: 0, reactionsGiven: 0, linkCounter: 0, commandUsageTotal: 0, songsPlayed: 0 };
    if (!rows) return globalStats;
    for (const row of rows) {
        if (row.achievementCounters) {
            const counters = JSON.parse(row.achievementCounters);
            globalStats.messageCount += counters.messageCount || 0;
            globalStats.questionsAsked += counters.questionsAsked || 0;
            globalStats.totalVcTime += counters.totalVcTime || 0;
            globalStats.vcJoins += counters.vcJoins || 0;
            globalStats.reactionsGiven += counters.reactionsGiven || 0;
            globalStats.linkCounter += counters.linkCounter || 0;
            globalStats.commandUsageTotal += counters.commandUsage?.total || 0;
            globalStats.songsPlayed += counters.songsPlayed || 0;
        }
    }
    return globalStats;
}

function getGlobalAchievementStats() {
    const totalUsersStmt = db.prepare('SELECT COUNT(DISTINCT userId) as total FROM server_users');
    const totalUsers = totalUsersStmt.get().total;
    if (totalUsers === 0) return {};
    const statsStmt = db.prepare(` SELECT achievementId, COUNT(userId) as unlockCount FROM ( SELECT json_each.key as achievementId, userId FROM server_users, json_each(server_users.achievements) ) GROUP BY achievementId `);
    const rows = statsStmt.all();
    const stats = {};
    for (const row of rows) {
        stats[row.achievementId] = { count: row.unlockCount, percentage: (row.unlockCount / totalUsers) * 100 };
    }
    return stats;
}

function getServerSetting(guildId, key) {
    const settings = getServerSettings(guildId);
    if (key === 'linkedChannels' || key === 'levelRoles') {
        return settings[key] ? JSON.parse(settings[key]) : {};
    }
    const allowedKeys = [ 'logChannelId', 'welcomeChannelId', 'achievementsChannelId', 'levelingChannelId', 'commandChannelId', 'levelingEnabled', 'achievementsEnabled', 'linkedChannels', 'levelRoles', 'stats_mode', 'stats_member_channel_id', 'stats_online_channel_id', 'log_messages', 'log_members', 'log_voice', 'log_server', 'allow_bot_announcements', 'stats_all_members_channel_id', 'stats_bots_channel_id', 'stats_time_channel_id', 'stats_date_channel_id', 'stats_dnd_channel_id', 'stats_idle_channel_id', 'stats_offline_channel_id', 'stats_compact_channel_id' ];
    if (allowedKeys.includes(key)) {
        return settings[key];
    }
    return settings ? settings[key] : null;
}

function setServerSetting(guildId, key, value) {
    let valueToStore = value;
    if (typeof value === 'boolean') {
        valueToStore = value ? 1 : 0;
    }
    if (key === 'linkedChannels' || key === 'levelRoles') {
        valueToStore = JSON.stringify(value);
    }
    const allowedKeys = [ 'logChannelId', 'welcomeChannelId', 'achievementsChannelId', 'levelingChannelId', 'commandChannelId', 'levelingEnabled', 'achievementsEnabled', 'linkedChannels', 'levelRoles', 'stats_mode', 'stats_member_channel_id', 'stats_online_channel_id', 'log_messages', 'log_members', 'log_voice', 'log_server', 'allow_bot_announcements', 'stats_all_members_channel_id', 'stats_bots_channel_id', 'stats_time_channel_id', 'stats_date_channel_id', 'stats_dnd_channel_id', 'stats_idle_channel_id', 'stats_offline_channel_id', 'stats_compact_channel_id' ];
    if (!allowedKeys.includes(key)) return;
    const stmt = db.prepare(`INSERT INTO servers (guildId, ${key}) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET ${key} = excluded.${key}`);
    stmt.run(guildId, valueToStore);
}

function addShopItem({ itemId, name, description, price, type, data }) {
    try {
        const stmt = db.prepare(` INSERT INTO shop_items (item_id, name, description, price, type, data) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(item_id) DO UPDATE SET name = excluded.name, description = excluded.description, price = excluded.price, type = excluded.type, data = excluded.data `);
        stmt.run(itemId, name, description, price, type, data);
        return { success: true };
    } catch (error) {
        console.error("Fehler beim Hinzufügen des Shop-Items:", error);
        return { success: false, error: error.message };
    }
}

function getAllServerSettings() {
    const stmt = db.prepare('SELECT * FROM servers');
    return stmt.all();
}

function getShopItems() {
    try {
        const stmt = db.prepare('SELECT * FROM shop_items ORDER BY price ASC');
        return stmt.all();
    } catch (error) {
        console.error("Fehler beim Abrufen der Shop-Items:", error);
        return [];
    }
}

function equipTheme(userId, itemId) {
    try {
        const stmt = db.prepare('UPDATE users SET equipped_theme = ? WHERE userId = ?');
        stmt.run(itemId, userId);
        return { success: true };
    } catch (error) {
        console.error("Fehler beim Ausrüsten des Themes:", error);
        return { success: false, error: error.message };
    }
}

function getFavorites(userId) {
    const stmt = db.prepare('SELECT songTitle as title, songUrl as url, songDuration as duration FROM user_favorites WHERE userId = ?');
    return stmt.all(userId);
}

function addFavorite(userId, song) {
    const stmt = db.prepare('INSERT OR IGNORE INTO user_favorites (userId, songUrl, songTitle, songDuration) VALUES (?, ?, ?, ?)');
    const result = stmt.run(userId, song.url, song.title, song.duration);
    return result.changes > 0;
}

function removeFavorite(userId, songUrl) {
    const stmt = db.prepare('DELETE FROM user_favorites WHERE userId = ? AND songUrl = ?');
    const result = stmt.run(userId, songUrl);
    return result.changes > 0;
}

function isFavorite(userId, songUrl) {
    const stmt = db.prepare('SELECT 1 FROM user_favorites WHERE userId = ? AND songUrl = ?');
    return !!stmt.get(userId, songUrl);
}

function hasItem(userId, itemId) {
    const stmt = db.prepare('SELECT 1 FROM user_inventory WHERE user_id = ? AND item_id = ?');
    return !!stmt.get(userId, itemId);
}

function purchaseItem(userId, itemId) {
    const itemStmt = db.prepare('SELECT price FROM shop_items WHERE item_id = ?');
    const item = itemStmt.get(itemId);
    if (!item) {
        return { success: false, reason: 'Item not found.' };
    }
    const transaction = db.transaction(() => {
        const userStmt = db.prepare('SELECT points FROM users WHERE userId = ?');
        const user = userStmt.get(userId);
        if (user.points < item.price) {
            return { success: false, reason: 'Not enough points.' };
        }
        if (hasItem(userId, itemId)) {
            return { success: false, reason: 'You already own this item.' };
        }
        const newPoints = user.points - item.price;
        const updateUserStmt = db.prepare('UPDATE users SET points = ? WHERE userId = ?');
        updateUserStmt.run(newPoints, userId);
        const insertInventoryStmt = db.prepare('INSERT INTO user_inventory (user_id, item_id, purchase_date) VALUES (?, ?, ?)');
        insertInventoryStmt.run(userId, itemId, Date.now());
        return { success: true, newBalance: newPoints };
    });
    return transaction();
}

function getUserInventory(userId) {
    try {
        const stmt = db.prepare(` SELECT inv.item_id, inv.purchase_date, items.name, items.description, items.type, items.data FROM user_inventory AS inv JOIN shop_items AS items ON inv.item_id = items.item_id WHERE inv.user_id = ? `);
        return stmt.all(userId);
    } catch (error) {
        console.error("Fehler beim Abrufen des User-Inventars:", error);
        return [];
    }
}

function getPrivateLinks() {
    const stmt = db.prepare('SELECT linkName, hashedPassword FROM private_links');
    const rows = stmt.all();
    return rows.reduce((acc, row) => {
        acc[row.linkName] = row.hashedPassword;
        return acc;
    }, {});
}

function savePrivateLink(name, hashedPassword) {
    const stmt = db.prepare('INSERT INTO private_links (linkName, hashedPassword) VALUES (?, ?)');
    stmt.run(name, hashedPassword);
}

function getServerSettings(guildId) {
    const stmt = db.prepare('SELECT * FROM servers WHERE guildId = ?');
    let settings = stmt.get(guildId);
    if (!settings) {
        const insertStmt = db.prepare('INSERT INTO servers (guildId) VALUES (?)');
        insertStmt.run(guildId);
        settings = stmt.get(guildId);
    }
    return settings;
};

function getUserData(guildId, userId) {
    const userProfileStmt = db.prepare('SELECT * FROM users WHERE userId = ?');
    let userProfile = userProfileStmt.get(userId);
    if (!userProfile) {
        const insertUserStmt = db.prepare('INSERT INTO users (userId) VALUES (?)');
        insertUserStmt.run(userId);
        userProfile = userProfileStmt.get(userId);
    }
    getServerSettings(guildId);
    const serverUserStmt = db.prepare('SELECT * FROM server_users WHERE userId = ? AND guildId = ?');
    let serverUser = serverUserStmt.get(userId, guildId);
    if (!serverUser) {
        const defaultCounters = {
            messageCount: 0,
            questionsAsked: 0,
            dailyStreak: 0,
            lastMessageTimestamp: null,
            reactionsGiven: 0,
            vcJoinTime: null,
            totalVcTime: 0,
            longestVcSession: 0,
            consecutiveMessageCounter: 0,
            lastMessageTimestamps: [],
            coffeeCounter: 0,
            pingsGiven: 0,
            sexCounter: 0,
            commandUsage: {
                total: 0,
                ping: 0,
                np: 0,
                loop: 0,
                skip: 0,
                back: 0,
                stop: 0,
                shuffle: 0,
                meme: 0,
                resume: 0,
                seek: 0,
                volume: 0
            },
            playlistWordCounter: 0,
            linkCounter: 0,
            hiCounter: 0,
            winkCounter: 0,
            errorWordCounter: 0,
            dbmWordCounter: 0,
            testWordCounter: 0,
            botWordCounter: 0,
            songsPlayed: 0,
            vcJoins: 0,
            editsMade: 0,
            deletesMade: 0,
            consecutiveQuestion: 0,
            consecutiveExclamation: 0,
            consecutiveEllipsis: 0,
            shrugCounter: 0,
            selfMentionCounter: 0,
            botMentionCounter: 0,
            bruhCounter: 0,
            lolCounter: 0,
            codeBlockCounter: 0,
            spoilerCounter: 0,
            quoteCounter: 0,
            lastStreak: 0,
            lastActivityTimestamp: null,
            totalAloneVcTime: 0,
            totalMutedTime: 0,
            totalDeafenedTime: 0,
            lastVcChannelId: null,
            vcChannelHistory: [],
            lastJoinTimestamp: 0,
            commandFail: 0,
            badArgs: 0,
            cooldownHits: 0,
            skullReactions: 0,
            nicknameChanges: 0,
            achievementWordCounter: 0
        };

        const insertServerUserStmt = db.prepare('INSERT INTO server_users (userId, guildId, achievements, achievementCounters) VALUES (?, ?, ?, ?)');
        insertServerUserStmt.run(userId, guildId, JSON.stringify({}), JSON.stringify(defaultCounters));
        serverUser = serverUserStmt.get(userId, guildId);
    }
    
    const mergedData = { ...userProfile, ...serverUser };
    mergedData.achievements = serverUser.achievements ? JSON.parse(serverUser.achievements) : {};
    mergedData.achievementCounters = serverUser.achievementCounters ? JSON.parse(serverUser.achievementCounters) : {};
    return mergedData;
};

function setUserData(guildId, userId, userData) {
    const transaction = db.transaction(() => {
        const serverUserStmt = db.prepare(`
            INSERT INTO server_users (userId, guildId, xp, level, achievements, achievementCounters) 
            VALUES (?, ?, ?, ?, ?, ?) 
            ON CONFLICT(userId, guildId) DO UPDATE SET 
                xp = excluded.xp, level = excluded.level, achievements = excluded.achievements, achievementCounters = excluded.achievementCounters
        `);
        serverUserStmt.run(
            userId, guildId, userData.xp || 0, userData.level || 0, 
            JSON.stringify(userData.achievements || {}), 
            JSON.stringify(userData.achievementCounters || {})
        );

        const userProfileStmt = db.prepare(`
            INSERT INTO users (userId, motto, themeColor, bannerUrl, points) 
            VALUES (?, ?, ?, ?, ?) 
            ON CONFLICT(userId) DO UPDATE SET 
                motto = excluded.motto, themeColor = excluded.themeColor, bannerUrl = excluded.bannerUrl, points = excluded.points
        `);
        userProfileStmt.run(
            userId, userData.motto || null, userData.themeColor || '#FF0000', 
            userData.bannerUrl || null, userData.points || 0 
        );
    });
    try {
        transaction();
    } catch (error) {
        console.error(`[FEHLER] bei setUserData Transaktion für User ${userId}:`, error);
    }
};

/* --- REACTION ROLES FUNKTIONEN --- */
function addReactionRole(guildId, messageId, emojiId, roleId) {
    try {
        const stmt = db.prepare(`INSERT INTO reaction_roles (guild_id, message_id, emoji_id, role_id) VALUES (?, ?, ?, ?) ON CONFLICT(guild_id, message_id, emoji_id) DO UPDATE SET role_id = excluded.role_id`);
        stmt.run(guildId, messageId, emojiId, roleId);
        return { success: true };
    } catch (error) { console.error("Fehler beim Hinzufügen der Reaction Role:", error); return { success: false, error: error.message }; }
}
function getReactionRole(guildId, messageId, emojiId) {
    try {
        const stmt = db.prepare('SELECT role_id FROM reaction_roles WHERE guild_id = ? AND message_id = ? AND emoji_id = ?');
        return stmt.get(guildId, messageId, emojiId);
    } catch (error) { console.error("Fehler beim Abrufen der Reaction Role:", error); return null; }
}
function removeReactionRole(guildId, messageId, emojiId) {
    try {
        const stmt = db.prepare('DELETE FROM reaction_roles WHERE guild_id = ? AND message_id = ? AND emoji_id = ?');
        const result = stmt.run(guildId, messageId, emojiId);
        return { success: result.changes > 0 };
    } catch (error) { console.error("Fehler beim Entfernen der Reaction Role:", error); return { success: false, error: error.message }; }
}
function cleanupReactionRoles(guildId, messageId) {
    try {
        const stmt = db.prepare('DELETE FROM reaction_roles WHERE guild_id = ? AND message_id = ?');
        stmt.run(guildId, messageId);
        return { success: true };
    } catch (error) { console.error("Fehler beim Bereinigen der Reaction Roles:", error); return { success: false, error: error.message }; }
}
/* --- ENDE REACTION ROLES FUNKTIONEN --- */


/* --- CUSTOM COMMANDS FUNKTIONEN --- */
function addCustomCommand(guildId, commandName, commandResponse) {
    try {
        const stmt = db.prepare(`
            INSERT INTO custom_commands (guild_id, command_name, command_response) 
            VALUES (?, ?, ?)
            ON CONFLICT(guild_id, command_name) DO UPDATE SET
                command_response = excluded.command_response
        `);
        stmt.run(guildId, commandName.toLowerCase(), commandResponse);
        return { success: true };
    } catch (error) {
        console.error("Fehler beim Hinzufügen des Custom Command:", error);
        return { success: false, error: error.message };
    }
}
function getCustomCommand(guildId, commandName) {
    try {
        const stmt = db.prepare('SELECT command_response FROM custom_commands WHERE guild_id = ? AND command_name = ?');
        return stmt.get(guildId, commandName.toLowerCase());
    } catch (error) {
        console.error("Fehler beim Abrufen des Custom Command:", error);
        return null;
    }
}
function removeCustomCommand(guildId, commandName) {
    try {
        const stmt = db.prepare('DELETE FROM custom_commands WHERE guild_id = ? AND command_name = ?');
        const result = stmt.run(guildId, commandName.toLowerCase());
        return { success: result.changes > 0 };
    } catch (error) {
        console.error("Fehler beim Entfernen des Custom Command:", error);
        return { success: false, error: error.message };
    }
}
function listCustomCommands(guildId) {
    try {
        const stmt = db.prepare('SELECT command_name, command_response FROM custom_commands WHERE guild_id = ? ORDER BY command_name ASC');
        return stmt.all(guildId);
    } catch (error) {
        console.error("Fehler beim Auflisten der Custom Commands:", error);
        return [];
    }
}
/* --- ENDE CUSTOM COMMANDS FUNKTIONEN --- */


/* --- AUTO ROLES FUNKTIONEN --- */
function addAutoRole(guildId, roleId, parameter_type, required_value) {
    try {
        const existing = db.prepare('SELECT rule_id FROM auto_roles WHERE guild_id = ? AND role_id = ? AND parameter_type = ?').get(guildId, roleId, parameter_type);
        if (existing) {
            db.prepare('UPDATE auto_roles SET required_value = ? WHERE rule_id = ?').run(required_value, existing.rule_id);
        } else {
            db.prepare('INSERT INTO auto_roles (guild_id, role_id, parameter_type, required_value) VALUES (?, ?, ?, ?)').run(guildId, roleId, parameter_type, required_value);
        }
        return { success: true };
    } catch (error) {
        console.error("Fehler beim Hinzufügen der Auto Role:", error);
        return { success: false, error: error.message };
    }
}
function removeAutoRole(guildId, roleId, parameter_type) {
    try {
        const stmt = db.prepare('DELETE FROM auto_roles WHERE guild_id = ? AND role_id = ? AND parameter_type = ?');
        const result = stmt.run(guildId, roleId, parameter_type);
        return { success: result.changes > 0 };
    } catch (error) {
        console.error("Fehler beim Entfernen der Auto Role:", error);
        return { success: false, error: error.message };
    }
}
function listAutoRoles(guildId) {
    try {
        const stmt = db.prepare('SELECT role_id, parameter_type, required_value FROM auto_roles WHERE guild_id = ? ORDER BY role_id, parameter_type');
        return stmt.all(guildId);
    } catch (error) {
        console.error("Fehler beim Auflisten der Auto Roles:", error);
        return [];
    }
}
function getAllAutoRoles() {
    try {
        const stmt = db.prepare('SELECT guild_id, role_id, parameter_type, required_value FROM auto_roles');
        return stmt.all();
    } catch (error) {
        console.error("Fehler beim Abrufen aller Auto Roles:", error);
        return [];
    }
}
/* --- ENDE AUTO ROLES FUNKTIONEN --- */


/* --- NEUE FUNKTIONEN FÜR LOKALE MUSIK --- */

/**
 * Löscht alle Einträge aus der local_files-Tabelle.
 */
function clearLocalLibrary() {
    try {
        db.prepare('DELETE FROM local_files').run();
        db.prepare('VACUUM').run(); // Gibt den Speicherplatz in der DB-Datei frei
        return { success: true };
    } catch (error) {
        console.error("Fehler beim Leeren der lokalen Bibliothek:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Fügt eine einzelne Datei zur Bibliothek hinzu.
 * @param {object} fileData - { filePath, title, artist, album, duration }
 */
function addLocalFile(fileData) {
    try {
        const stmt = db.prepare(`
            INSERT INTO local_files (file_path, title, artist, album, duration) 
            VALUES (@filePath, @title, @artist, @album, @duration)
        `);
        stmt.run(fileData);
        return { success: true };
    } catch (error) {
        // Ignoriere 'UNIQUE constraint failed', falls der Song schon existiert
        if (error.code !== 'SQLITE_CONSTRAINT_UNIQUE') {
            console.error("Fehler beim Hinzufügen der lokalen Datei:", error);
            return { success: false, error: error.message };
        }
        return { success: true, reason: 'already_exists' };
    }
}

/**
 * Sucht Songs oder Alben (Playlists) in der Bibliothek.
 * @param {string} query - Der Suchbegriff
 * @returns {Array}
 */
function searchLocalFiles(query) {
    try {
        const stmt = db.prepare(`
            SELECT * FROM local_files 
            WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
            LIMIT 25
        `);
        // Fügt Wildcards (%) für die LIKE-Suche hinzu
        const searchQuery = `%${query}%`;
        return stmt.all(searchQuery, searchQuery, searchQuery);
    } catch (error) {
        console.error("Fehler beim Suchen in der lokalen Bibliothek:", error);
        return [];
    }
}

/**
 * Holt alle Songs, die zu einem Album (Playlist/Unterordner) gehören.
 * @param {string} albumName 
 * @returns {Array}
 */
function getLocalPlaylist(albumName) {
    try {
        const stmt = db.prepare('SELECT * FROM local_files WHERE album = ?');
        return stmt.all(albumName);
    } catch (error) {
        console.error("Fehler beim Abrufen der lokalen Playlist:", error);
        return [];
    }
}

/**
 * Holt eine Liste aller einzigartigen Alben (Playlists).
 * @returns {Array}
 */
function listLocalPlaylists() {
    try {
        const stmt = db.prepare('SELECT DISTINCT album FROM local_files WHERE album IS NOT NULL ORDER BY album ASC');
        return stmt.all();
    } catch (error) {
        console.error("Fehler beim Auflisten der lokalen Playlists:", error);
        return [];
    }
}

/* --- NEUE FUNKTION FÜR LOKALE MUSIK (FIX) --- */

/**
 * Holt einen einzelnen Song anhand seiner file_id.
 * @param {number} fileId 
 * @returns {object|null}
 */
function getLocalFileById(fileId) {
    try {
        const stmt = db.prepare('SELECT * FROM local_files WHERE file_id = ?');
        return stmt.get(fileId);
    } catch (error) {
        console.error("Fehler beim Abrufen der lokalen Datei per ID:", error);
        return null;
    }
}

/* --- ENDE NEUE FUNKTION --- */


module.exports = {
    initializeDatabase,
    getServerSettings,
    getAllServerSettings,
    getServerSetting,
    setServerSetting,
    getUserData,
    setUserData,
    getPrivateLinks,
    savePrivateLink,
    getFavorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    getGlobalAchievementStats,
    getUserGlobalStats,
    addShopItem,
    getShopItems,
    hasItem,
    purchaseItem,
    getUserInventory,
    equipTheme,
    addReactionRole,
    getReactionRole,
    removeReactionRole,
    cleanupReactionRoles,
    addCustomCommand,
    getCustomCommand,
    removeCustomCommand,
    listCustomCommands,
    addAutoRole,
    removeAutoRole,
    listAutoRoles,
    getAllAutoRoles,
    clearLocalLibrary,
    addLocalFile,
    searchLocalFiles,
    getLocalPlaylist,
    listLocalPlaylists,
    getLocalFileById
};