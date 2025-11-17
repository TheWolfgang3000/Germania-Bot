// commands/meme.js
const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Logik adaptiert von fun-commands.js
async function sendTempReply(interaction, text) {
    await interaction.reply({ content: text, ephemeral: true });
    // Ephemeral-Nachrichten müssen nicht manuell gelöscht werden
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Sends a random meme.'),
        
    async execute(interaction) {
        // Logik von handleRandomFileCommand
        const directory = 'meme';
        const maxFileNumber = 602; //
        const extension = 'jpg'; //
        
        const randomNumber = Math.floor(Math.random() * maxFileNumber) + 1;
        const filePath = path.join(__dirname, '..', 'resources', directory, `${randomNumber}.${extension}`); // Pfad korrigiert (eine Ebene hoch)

        try {
            if (fs.existsSync(filePath)) {
                // DeferReply ist gut für Datei-Uploads
                await interaction.deferReply(); 
                await interaction.editReply({ files: [filePath] });
            } else {
                console.error(`File not found: ${filePath}`);
                sendTempReply(interaction, `[ERROR] Could not find the file for number ${randomNumber}. Please check the resources folder.`);
            }
        } catch (error) {
            console.error(`Error sending file for /meme:`, error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '[ERROR] An unexpected error occurred while sending the file.', ephemeral: true });
            } else {
                await interaction.reply({ content: '[ERROR] An unexpected error occurred while sending the file.', ephemeral: true });
            }
        }
    }
};