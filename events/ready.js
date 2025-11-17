// events/ready.js
const { Events } = require('discord.js');
const db = require('../db-manager.js');
// --- KORRIGIERTER IMPORT ---
// Wir importieren die geteilten Funktionen, die in statsUpdater.js definiert sind
const { updateStats_Slow, updateStats_Fast } = require('../tasks/statsUpdater.js'); 
const { checkAutoRoles } = require('../tasks/autoRoleChecker.js'); 

module.exports = {
    name: Events.ClientReady, // 'ready'
    once: true,
    async execute(client) {
        db.initializeDatabase();
        client.unlocking = new Set();
        console.log(`Bot ready as ${client.user.tag}`);

        // --- STATISTIK-TIMER (JETZT AUFGETEILT) ---
        console.log("[Stats] Führe initiales Statistik-Update (Langsam) aus...");
        // --- KORRIGIERTER AUFRUF ---
        await updateStats_Slow(client); // 1. Einmal Langsam (Mitglieder)
        console.log("[Stats] Führe initiales Statistik-Update (Schnell) aus...");
        await updateStats_Fast(client); // 2. Einmal Schnell (Zeit)

        // 3. Wiederholende Timer
        // Langsam: Alle 15 Minuten (900000 ms)
        setInterval(() => {
            console.log("[Stats] Führe periodisches Statistik-Update (Langsam) aus...");
            updateStats_Slow(client);
        }, 900000); 
        // Schnell: Alle 5 min.
        setInterval(() => {
            console.log("[Stats] Führe periodisches Statistik-Update (Schnell) aus...");
            updateStats_Fast(client);
        }, 300000); 
        // --- ENDE STATISTIK-TIMER ---

        // --- AUTO-ROLE-TIMER ---
        console.log("[AutoRoles] Starte initialen Auto-Role-Check...");
        await checkAutoRoles(client);
        
        // Wiederhole den Check alle 1 Stunde (3600000 ms)
        setInterval(() => {
            console.log("[AutoRoles] Führe periodischen Auto-Role-Check aus...");
            checkAutoRoles(client);
        }, 3600000);
        // --- ENDE AUTO-ROLE-TIMER ---
    },
};