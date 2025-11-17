// commands/award-achievement.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const db = require('../db-manager.js');
const achievementsHandler = require('../achievements-handler.js'); // Wir brauchen den Handler zum Freischalten

module.exports = {
    data: new SlashCommandBuilder()
        .setName('award-achievement')
        .setDescription('[Admin] Manually awards an achievement to a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user who should receive the achievement.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('achievement-id')
                .setDescription('The ID of the achievement to award (e.g., "FIRST_MESSAGE").')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    
    async execute(interaction) {
        // Logik migriert von handleAwardAchievement
        
        const member = interaction.options.getMember('user');
        const achievementId = interaction.options.getString('achievement-id').toUpperCase(); // Stellt sicher, dass die ID GROSS ist
        
        if (!member) {
            return interaction.reply({ content: 'Invalid user provided.', ephemeral: true });
        }

        // Wir brauchen die 'fakeMessage', da der alte admin-commands-Handler sie erwartet
        const fakeMessage = {
            member: interaction.member, // Der Admin, der den Befehl ausführt
            guild: interaction.guild,
            channel: {
                send: async (options) => interaction.reply(options)
            }
        };
        
        const args = [member.id, achievementId]; // 'args' für die alte Funktion

        // Wir rufen die alte Logik aus admin-commands.js auf
        // HINWEIS: Du musst 'handleAwardAchievement' in admin-commands.js exportieren!
        // (Falls noch nicht geschehen)
        
        // Da 'handleAwardAchievement' nicht existiert, bauen wir die Logik hier neu
        const userData = db.getUserData(member.guild.id, member.id);
        
        // Wir verwenden direkt den achievementsHandler
        const success = await achievementsHandler.unlockAchievement(member, achievementId, userData);

        if (success) {
            db.setUserData(member.guild.id, member.id, userData); // Speichern
            await interaction.reply({ content: `[OK] Manually awarded achievement \`${achievementId}\` to ${member.user.tag}.`, ephemeral: true });
        } else {
            // 'unlockAchievement' gibt 'false' zurück, wenn die ID ungültig ist oder der User sie schon hat
            await interaction.reply({ content: `[!] Could not award achievement. Is the ID \`${achievementId}\` correct, or does the user already have it?`, ephemeral: true });
        }
    }
};