// commands/video.js
const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Logik adaptiert von fun-commands.js
async function sendTempReply(interaction, text) {
    await interaction.reply({ content: text, ephemeral: true });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('video')
        .setDescription('Sends a random video meme.'),
        
    async execute(interaction) {
        // Logik von handleRandomFileCommand
        const directory = 'videomeme';
        const maxFileNumber = 2277; //
        const extension = 'mp4'; //
        
        const randomNumber = Math.floor(Math.random() * maxFileNumber) + 1;
        const filePath = path.join(__dirname, '..', 'resources', directory, `${randomNumber}.${extension}`); // Pfad korrigiert

        try {
            if (fs.existsSync(filePath)) {
                await interaction.deferReply();
                await interaction.editReply({ files: [filePath] });
            } else {
                console.error(`File not found: ${filePath}`);
                sendTempReply(interaction, `[ERROR] Could not find the file for number ${randomNumber}. Please check the resources folder.`);
            }
        } catch (error) {
            console.error(`Error sending file for /video:`, error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '[ERROR] An unexpected error occurred while sending the file.', ephemeral: true });
            } else {
                await interaction.reply({ content: '[ERROR] An unexpected error occurred while sending the file.', ephemeral: true });
            }
        }
    }
};