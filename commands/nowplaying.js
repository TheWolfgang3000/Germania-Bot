// commands/nowplaying.js
const { SlashCommandBuilder } = require('discord.js');
const musicPlayer = require('../music-player.js');
const db = require('../db-manager.js');
const achievementsHandler = require('../achievements-handler.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Shows details about the currently playing song.')
        // Wir fügen Aliase hinzu, die Discord anzeigen kann
        .setNameLocalizations({
            'en-US': 'nowplaying',
            'de': 'nowplaying' 
        })
        .setDMPermission(false), // Befehl kann nicht in DMs verwendet werden
        // HINWEIS: Echte Aliase wie 'np' gibt es bei Slash-Befehlen nicht mehr.
        // 'nowplaying' ist der einzige Befehlsname.
        
    async execute(interaction) {
        // Logik migriert aus 'case 'np': case 'nowplaying':'
        const userData = db.getUserData(interaction.guild.id, interaction.user.id);
        userData.achievementCounters.commandUsage.np = (userData.achievementCounters.commandUsage.np || 0) + 1;
        if (!userData.achievements.NOW_PLAYING_USER) {
            await achievementsHandler.unlockAchievement(interaction.member, 'NOW_PLAYING_USER', userData);
        }
        db.setUserData(interaction.guild.id, interaction.user.id, userData);

        // 'handleNowPlayingCommand' sendet das Dashboard.
        const fakeMessage = {
            member: interaction.member,
            guild: interaction.guild,
            author: interaction.user,
            channel: {
                send: async (options) => {
                    // fängt das Dashboard-Embed ab
                    return interaction.reply(options);
                }
            },
            // 'delete' wird nicht benötigt, da Slash-Befehle nicht gelöscht werden
            delete: () => {} 
        };

        await musicPlayer.handleNowPlayingCommand(fakeMessage, interaction.client.guildsMap);
    }
};