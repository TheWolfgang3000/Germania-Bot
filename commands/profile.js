// commands/profile.js
const { SlashCommandBuilder } = require('discord.js');
const profileCommands = require('../profile-commands.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription("Displays your or another user's profile.")
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose profile you want to see.')
                .setRequired(false)),
    
    async execute(interaction) {
        // Logik migriert aus 'case 'profile':'
        // Wir verwenden den "Shim", um profile-commands.js aufzurufen
        
        const fakeMessage = {
            // handleProfile braucht 'mentions' und 'member'
            mentions: {
                members: {
                    first: () => interaction.options.getMember('user')
                }
            },
            member: interaction.member,
            guild: interaction.guild,
            // 'channel.send' wird auf 'interaction.reply' umgeleitet
            channel: {
                send: async (options) => {
                    return interaction.reply(options);
                }
            }
        };

        // Rufe die alte, komplexe Logik auf
        await profileCommands.handleProfile(fakeMessage, interaction.client);
    }
};