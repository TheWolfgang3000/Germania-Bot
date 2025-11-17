// fun-commands.js
const fs = require('fs');
const path = require('path');

async function sendTempReply(channel, text) {
    const message = await channel.send(text);
    setTimeout(() => message.delete().catch(console.error), 10000);
}

// Funktion, um eine zufällige Datei aus einem Ordner zu senden
async function handleRandomFileCommand(message, directory, maxFileNumber, extension) {
    const randomNumber = Math.floor(Math.random() * maxFileNumber) + 1;
    const filePath = path.join(__dirname, 'resources', directory, `${randomNumber}.${extension}`);

    try {
        if (fs.existsSync(filePath)) {
            await message.channel.send({ files: [filePath] });
        } else {
            console.error(`File not found: ${filePath}`);
            sendTempReply(message.channel, `[ERROR] Could not find the file for number ${randomNumber}. Please check the resources folder.`);
        }
    } catch (error) {
        console.error(`Error sending file for command !${directory}:`, error);
        sendTempReply(message.channel, '[ERROR] An unexpected error occurred while sending the file.');
    }
}

function handleMemeCommand(message) {
    // Würfelt eine Zahl von 1-602 und sendet die .jpg Datei
    handleRandomFileCommand(message, 'meme', 602, 'jpg');
}

function handleVideoCommand(message) {
    // Würfelt eine Zahl von 1-2277 und sendet die .mp4 Datei
    handleRandomFileCommand(message, 'videomeme', 2277, 'mp4');
}

module.exports = {
    handleMemeCommand,
    handleVideoCommand
};