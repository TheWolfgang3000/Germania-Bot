// commands/achievements.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js'); // PermissionsBitField hinzugefügt
const db = require('../db-manager.js');
const achievementCommands = require('../achievement-commands.js');
// const adminCommands = require('../admin-commands.js'); // <-- ENTFERNT (Das war der Fehler)

module.exports = {
    data: new SlashCommandBuilder()
        .setName('achievements')
        .setDescription('Shows achievements or toggles the system.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription("Shows your or another user's achievements.")
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to check.')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('[Admin] Turns the achievement system on or off.')
                .addStringOption(option =>
                    option.setName('status')
                        .setDescription('on or off')
                        .setRequired(true)
                        .addChoices(
                            { name: 'on', value: 'on' },
                            { name: 'off', value: 'off' }
                        )))
        // Wir setzen die Berechtigung für den GESAMTEN Befehl (beide Sub-Befehle)
        // 'show' ist für alle, 'toggle' ist für Admins. Wir prüfen 'toggle' manuell.
        ,
    
    async execute(interaction) {
        
        if (interaction.options.getSubcommand() === 'toggle') {
            
            // --- NEUE, DIREKTE LOGIK (ersetzt den alten Import) ---
            // Wir prüfen die Admin-Berechtigung manuell für diesen Sub-Befehl
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '[!] You need Administrator permissions for this subcommand.', ephemeral: true });
            }
            
            const choice = interaction.options.getString('status');
            const isEnabled = choice === 'on';
            db.setServerSetting(interaction.guild.id, 'achievementsEnabled', isEnabled);
            await interaction.reply({ content: `[OK] Achievement system has been **${isEnabled ? 'enabled' : 'disabled'}**.`, ephemeral: true });
            // --- ENDE NEUE LOGIK ---

        } else if (interaction.options.getSubcommand() === 'show') {
            // Dies war der 'achievementCommands'-Teil (bleibt unverändert)
            const fakeMessage = {
                mentions: {
                    members: {
                        first: () => interaction.options.getMember('user')
                    }
                },
                member: interaction.member,
                guild: interaction.guild,
                author: interaction.user,
                channel: {
                    send: async (options) => {
                        return interaction.reply(options);
                    }
                }
            };

            await achievementCommands.handleShowAchievementsCommand(fakeMessage, interaction.client);
        }
    }
};