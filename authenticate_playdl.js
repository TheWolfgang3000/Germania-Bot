const play = require('play-dl');
const fs = require('node:fs/promises'); // Für Dateizugriff

async function authenticatePlayDL() {
    console.log('Starte play-dl YouTube-Authentifizierung...');
    console.log('Bitte folge den Anweisungen in der Konsole.');

    try {
        // Starte den Authentifizierungsprozess.
        // Dies öffnet eine URL im Browser und wartet auf Input in der Konsole.
        const credentials = await play.getAuth(); // Dies ist die korrekte Methode für play-dl Authentifizierung
        
        // play.getAuth() gibt oft ein Objekt mit Token-Informationen zurück.
        // Wir speichern dieses Objekt direkt, oder wir setzen das Token, wenn play-dl es intern verwalten soll.
        
        // play-dl speichert die Authentifizierungsdaten normalerweise selbst
        // nach erfolgreichem getAuth() in einem internen Cache oder einer Datei.
        // Wir brauchen die Rückgabe von getAuth() hier nicht direkt zu speichern,
        // da play-dl dies intern handhabt.
        
        console.log('✅ play-dl YouTube-Authentifizierung erfolgreich! (Intern gespeichert)');
        console.log('Du kannst diese Datei (authenticate_playdl.js) jetzt löschen.');
        console.log('Starte deinen Bot (node index.js) neu und versuche den !play Befehl.');

    } catch (error) {
        console.error('❌ FEHLER bei play-dl YouTube-Authentifizierung:', error);
        console.error('Stelle sicher, dass du den Authentifizierungsprozess im Browser abgeschlossen und den Bestätigungscode in die Konsole eingefügt hast.');
        process.exit(1); // Beende den Prozess bei Fehler
    }
}

authenticatePlayDL();