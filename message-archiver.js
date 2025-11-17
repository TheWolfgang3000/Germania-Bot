// message-archiver.js
const fs = require('fs');
const path = require('path');
// db-manager wird hier nicht mehr benötigt

// Stellt sicher, dass ein Ordner existiert. Erstellt ihn, wenn nicht.
function ensureDirExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Formatiert das Datum und die Uhrzeit
function getTimestamp() {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(' ')[0]; // HH:MM:SS
    return `[${date} ${time}]`;
}

// Die Hauptfunktion zum Archivieren einer Nachricht
function archiveMessage(message) {
    // Die Überprüfung, ob das System aktiv ist, wurde entfernt. Es läuft jetzt immer.
    const baseLogDir = path.join(__dirname, 'message-logs');
    const serverDir = path.join(baseLogDir, message.guild.name.replace(/[^a-zA-Z0-9]/g, '_'));
    
    // Unterordner
    const dateDir = path.join(serverDir, 'by-date');
    const channelDir = path.join(serverDir, 'by-channel');
    const userDir = path.join(serverDir, 'by-user');

    // Sicherstellen, dass alle Ordner existieren
    ensureDirExists(dateDir);
    ensureDirExists(channelDir);
    ensureDirExists(userDir);

    // Dateinamen definieren
    const today = new Date().toISOString().split('T')[0];
    const dateLogFile = path.join(dateDir, `${today}.log`);
    const channelLogFile = path.join(channelDir, `${message.channel.name}.log`);
    const userLogFile = path.join(userDir, `${message.author.tag.replace(/#/, '_')}_${message.author.id}.log`);

    // Log-Formate erstellen
    const timestamp = getTimestamp();
    const dateLogEntry = `${timestamp} [#${message.channel.name}] [${message.author.tag}]: ${message.content}\n`;
    const channelLogEntry = `${timestamp} [${message.author.tag}]: ${message.content}\n`;
    const userLogEntry = `${timestamp} [#${message.channel.name}]: ${message.content}\n`;

    // Asynchrones Schreiben in die Dateien
    fs.appendFile(dateLogFile, dateLogEntry, (err) => {
        if (err) console.error("Error writing to date log:", err);
    });
    fs.appendFile(channelLogFile, channelLogEntry, (err) => {
        if (err) console.error("Error writing to channel log:", err);
    });
    fs.appendFile(userLogFile, userLogEntry, (err) => {
        if (err) console.error("Error writing to user log:", err);
    });
}

function initialize(client) {
    console.log("Message Archiver initializing (Always On)...");
    client.on('messageCreate', message => {
        if (message.author.bot || !message.guild) return;
        if (message.content.startsWith(require('./config.json').prefix)) return;
        
        archiveMessage(message);
    });
    console.log("Message Archiver initialized successfully.");
}

module.exports = { initialize };