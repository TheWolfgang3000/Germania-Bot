// events/messageCreate.js (STAND: FINAL V2)

const { Events } = require('discord.js');
const geminiHandler = require('../gemini-handler.js'); 
const levelingSystem = require('../leveling-system.js');
const crossMessageSystem = require('../cross-message.js');
const db = require('../db-manager.js');
const achievementsHandler = require('../achievements-handler.js');
const { prefix } = require('../config.json');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message) {
        
        if (message.author.bot || !message.guild) return;
        
        const client = message.client;

        // 1. Gemini-Handler (JETZT OHNE PRIORITÄTS-WEICHE)
        if (message.mentions.has(client.user) && !message.mentions.everyone) {
            
            const userPrompt = message.content.replace(/<@!?\d+>/, '').trim();

            if (!userPrompt) {
                message.reply("State your actual purpose. You are the Problem, stop annoying me!");
                return;
            }

            await message.channel.sendTyping();
            
            // --- STANDARD KI-ROUTER (FÜR ALLE USER) ---

            // 1. ANRUF: Der Router klassifiziert die Absicht
            const intent = await geminiHandler.classifyUserIntent(userPrompt);

            // 2. ANRUF: Die Weiche (switch) ruft die passende Funktion auf
            switch (intent) {
                case 'CONVERSATION':
                    // Ruft die Funktion auf, die JETZT intern die User-ID prüft
                    await geminiHandler.handleConversation(message, client);
                    break;
                
                case 'KNOWLEDGE':
                    // Ruft die "intelligente" Wissens-Funktion auf (Lore vs. Extern)
                    await geminiHandler.handleKnowledge(message, userPrompt);
                    break;
                
                case 'GROK':
                    // Ruft die Kanal-Analyse-Funktion auf
                    await geminiHandler.handleGrok(message, userPrompt);
                    break;
                
                default:
                    // Fallback
                    await geminiHandler.handleConversation(message, client);
                    break;
            }
            return; // Verhindert, dass XP für Mentions gegeben werden
        }

        // 2. Cross-Message, XP und Punkte-Logik (Unverändert)
        if (!message.content.startsWith(prefix)) {
            const userData = db.getUserData(message.guild.id, message.author.id);
            const linkedChannels = db.getServerSetting(message.guild.id, 'linkedChannels') || {};

            if (linkedChannels[message.channel.id]) {
                crossMessageSystem.relayMessage(client, message);
            } else {
                levelingSystem.handleMessageXP(message, userData);
                const basePoints = 1;
                const lengthBonus = Math.min(Math.floor(message.content.length / 25), 4);
                const randomBonus = Math.floor(Math.random() * 3);
                const pointsAwarded = basePoints + lengthBonus + randomBonus;
                userData.points = (userData.points || 0) + pointsAwarded;
                await achievementsHandler.checkMessageAchievements(message, client, userData);
            }
            db.setUserData(message.guild.id, message.author.id, userData);
            return;
        }
        
        // 3. Warnung für veraltete !-Befehle (Unverändert)
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        if (client.commands.has(commandName)) {
            const reply = await message.reply(`[!] This command is deprecated. Please use \`/${commandName}\` instead!`);
            setTimeout(() => reply.delete().catch(console.error), 7000);
        }
    },
};