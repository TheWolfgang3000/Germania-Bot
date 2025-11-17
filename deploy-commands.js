// deploy-commands.js
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
// Pfad zum neuen 'commands'-Ordner
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('Lese Befehlsdateien für die Registrierung...');

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`[DEPLOY] Befehl ${command.data.name} wird registriert.`);
    } else {
        console.log(`[WARNUNG] Der Befehl in ${filePath} hat kein "data" oder "execute" Property.`);
    }
}

// REST-Modul instanziieren
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Befehle bei Discord registrieren
(async () => {
    try {
        console.log(`Starte Registrierung von ${commands.length} Application (/) Commands.`);

        // Die 'put'-Methode registriert alle Befehle global
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID), // CLIENT_ID muss in .env sein!
            { body: commands },
        );

        console.log(`Erfolgreich ${data.length} Application (/) Commands global registriert.`);
    } catch (error) {
        console.error(error);
    }
})();