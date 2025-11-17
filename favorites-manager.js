// favorites-manager.js
const db = require('./db-manager.js');

// Alle Funktionen rufen jetzt direkt die Datenbank-Funktionen auf.
// Kein manuelles Laden oder Speichern von JSON mehr.

function addFavorite(userId, song) {
    console.log(`[DEBUG] Adding favorite for ${userId}: ${song.title}`);
    return db.addFavorite(userId, song);
}

function removeFavorite(userId, songUrl) {
    console.log(`[DEBUG] Removing favorite for ${userId}: ${songUrl}`);
    return db.removeFavorite(userId, songUrl);
}

function getFavorites(userId) {
    console.log(`[DEBUG] Getting favorites for ${userId}`);
    return db.getFavorites(userId);
}

function isFavorite(userId, songUrl) {
    console.log(`[DEBUG] Checking if ${songUrl} is a favorite for ${userId}`);
    return db.isFavorite(userId, songUrl);
}

module.exports = {
    addFavorite,
    removeFavorite,
    getFavorites,
    isFavorite,
};