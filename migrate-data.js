// migrate-data.js
const fs = require('fs');
const path = require('path');
const db = require('./db-manager.js');

console.log('Starte die vollständige Migration der alten JSON-Daten in die SQLite-Datenbank...');

// Initialisiere die Datenbankverbindung
db.initializeDatabase();

// Pfade zu den alten JSON-Dateien
const oldSettingsPath = path.join(__dirname, 'server-settings.json');
const oldFavoritesPath = path.join(__dirname, 'favorites.json');
const oldLinksPath = path.join(__dirname, 'cross-message-links.json');

// --- Funktion zum Migrieren von Servern und Benutzern ---
function migrateServersAndUsers() {
    console.log('\n--- Starte Migration von Server-Einstellungen und Benutzerdaten ---');
    if (!fs.existsSync(oldSettingsPath)) {
        console.log('[INFO] server-settings.json nicht gefunden. Überspringe.');
        return;
    }
    
    const oldData = JSON.parse(fs.readFileSync(oldSettingsPath, 'utf8'));
    let userCount = 0;

    for (const guildId in oldData) {
        if (!/^\d+$/.test(guildId)) continue; // Überspringe ungültige Schlüssel

        console.log(`\n-- Verarbeite Server: ${guildId} --`);
        const guildData = oldData[guildId];

        // Migriere Server-spezifische Einstellungen (Level-Rollen etc.)
        if (guildData.levelRoles) {
            db.setServerSetting(guildId, 'levelRoles', guildData.levelRoles);
            console.log(`[MIGRATE] Level-Rollen für Server ${guildId} migriert.`);
        }
        if (guildData.linkedChannels) {
            db.setServerSetting(guildId, 'linkedChannels', guildData.linkedChannels);
            console.log(`[MIGRATE] Channel-Links für Server ${guildId} migriert.`);
        }

        // Migriere Benutzerdaten
        for (const key in guildData) {
            if (key.startsWith('user-')) {
                const userId = key.substring(5);
                const userData = guildData[key];
                
                // Stelle sicher, dass die Elterneinträge existieren
                db.getUserData(guildId, userId);
                // Schreibe die alten Daten
                db.setUserData(guildId, userId, userData);
                userCount++;
                console.log(`[MIGRATE] Benutzerdaten für User ${userId} migriert.`);
            }
        }
    }
    console.log(`--- ${userCount} Benutzereinträge erfolgreich migriert. ---`);
}

// --- Funktion zum Migrieren von Favoriten ---
function migrateFavorites() {
    console.log('\n--- Starte Migration von Favoriten ---');
    if (!fs.existsSync(oldFavoritesPath)) {
        console.log('[INFO] favorites.json nicht gefunden. Überspringe.');
        return;
    }

    const favoritesData = JSON.parse(fs.readFileSync(oldFavoritesPath, 'utf8'));
    let favCount = 0;

    for (const userId in favoritesData) {
        const userFavorites = favoritesData[userId];
        console.log(`-- Verarbeite Favoriten für User: ${userId} --`);
        for (const song of userFavorites) {
            db.addFavorite(userId, song);
            favCount++;
        }
    }
    console.log(`--- ${favCount} Favoriten erfolgreich migriert. ---`);
}

// --- Funktion zum Migrieren von privaten Links ---
function migratePrivateLinks() {
    console.log('\n--- Starte Migration von privaten Cross-Message-Links ---');
    if (!fs.existsSync(oldLinksPath)) {
        console.log('[INFO] cross-message-links.json nicht gefunden. Überspringe.');
        return;
    }

    const linksData = JSON.parse(fs.readFileSync(oldLinksPath, 'utf8'));
    let linkCount = 0;

    for (const linkName in linksData) {
        const hashedPassword = linksData[linkName];
        db.savePrivateLink(linkName, hashedPassword);
        linkCount++;
        console.log(`[MIGRATE] Privaten Link '${linkName}' migriert.`);
    }
    console.log(`--- ${linkCount} private Links erfolgreich migriert. ---`);
}


// --- Hauptfunktion ausführen ---
try {
    migrateServersAndUsers();
    migrateFavorites();
    migratePrivateLinks();
    console.log('\n[FERTIG] Vollständige Migration erfolgreich abgeschlossen.');
    console.log('Du kannst diese Skriptdatei (migrate-data.js) jetzt löschen.');
} catch (error) {
    console.error('\n[FATAL] Ein Fehler ist während der Migration aufgetreten:', error);
}