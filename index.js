// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

// --- Client erstellen ---
const client = new Client({
    intents: [ 
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});

// --- Globale Maps ---
client.guildsMap = new Map(); // Für den YouTube-Player
client.radioConnections = new Map(); // Für den Radio-Player
client.collectors = new Map();
client.channelState = new Map();
client.localPlayerMap = new Map(); // <-- NEU: Für den Offline-Player
client.geminiHistories = new Map(); // <-- NEU (PHASE 1): Für das Konversations-Gedächtnis

// ==========================================================
// MODULARER COMMAND-LADER
// ==========================================================
client.commands = new Collection(); 
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('[MODUL-LADER] Lade (/) Befehle...');
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNUNG] Der Befehl in ${filePath} hat kein "data" oder "execute" Property.`);
    }
}
console.log(`[MODUL-LADER] ${client.commands.size} Befehle erfolgreich geladen.`);

// ==========================================================
// NEUER MODULARER EVENT-LADER
// ==========================================================
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

console.log('[MODUL-LADER] Lade Events...');
for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}
console.log(`[MODUL-LADER] ${eventFiles.length} Events erfolgreich geladen.`);
// ==========================================================
// ENDE EVENT-LADER
// ==========================================================

// --- FINALE START- UND FEHLER-HANDLER ---
client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('Login failed:', err);
    process.exit(1);
});

process.on('unhandledRejection', err => console.error('Unhandled Rejection:', err));
process.on('uncaughtException', err => console.error('Uncaught Exception:', err));