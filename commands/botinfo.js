// commands/botinfo.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { embedColor } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Shows information about the bot.'), // <-- War Deutsch
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('Bot Information')
            .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })
            .addFields(
                { name: 'Version', value: '1.0.0', inline: true }, 
                { name: 'Creator', value: 'Germania AI v5.6.', inline: true }, 
                { name: 'Online Since', value: new Date(interaction.client.readyTimestamp).toUTCString(), inline: false }
            );

        await interaction.reply({ embeds: [embed] });
    }
};