// commands/library.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs').promises; // Wichtig: 'promises' für async/await
const path = require('path');
const db = require('../db-manager.js');
const mm = require('music-metadata'); // Das Modul, das wir installiert haben

const MUSIC_DIR = path.resolve(__dirname, '..', 'music'); // Der Ordner muss 'music' heißen und im Bot-Hauptverzeichnis liegen
const OWNER_ID = process.env.OWNER_ID; // Aus deiner .env-Datei

// Scannt rekursiv Ordner
async function scanDirectory(directory, albumName = null) {
    let filesAdded = 0;
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        
        if (entry.isDirectory()) {
            // Wenn wir in einem Unterordner sind, wird sein Name zum Album-Namen
            filesAdded += await scanDirectory(fullPath, entry.name);
        } else if (entry.isFile() && (entry.name.endsWith('.mp3') || entry.name.endsWith('.wav'))) {
            try {
                // Lese die MP3-Tags
                const metadata = await mm.parseFile(fullPath);
                const tags = metadata.common;

                const fileData = {
                    filePath: fullPath,
                    title: tags.title || path.parse(entry.name).name, // Nimm Titel aus Tags, oder Dateinamen
                    artist: tags.artist || null,
                    album: albumName || tags.album || null, // Nimm Unterordner-Namen, dann Album-Tag
                    duration: metadata.format.duration || 0
                };
                
                db.addLocalFile(fileData);
                filesAdded++;

            } catch (err) {
                console.warn(`[Library] Konnte Datei nicht parsen: ${fullPath}`, err.message);
            }
        }
    }
    return filesAdded;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('library')
        .setDescription('[Bot Owner] Manages the local music library.')
        .setDefaultMemberPermissions(0) // Nur Owner (wird unten geprüft)
        .addSubcommand(subcommand =>
            subcommand
                .setName('scan')
                .setDescription('Scans the "music" folder and adds all songs to the database.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Completely clears the local library database.')),
    
    async execute(interaction) {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: 'This command can only be used by the Bot Owner.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        if (interaction.options.getSubcommand() === 'scan') {
            await interaction.editReply('Starting library scan... This may take a while.');
            try {
                // Stelle sicher, dass der 'music'-Ordner existiert
                await fs.mkdir(MUSIC_DIR, { recursive: true }); 
                
                const filesAdded = await scanDirectory(MUSIC_DIR);
                await interaction.editReply(`[OK] Library scan complete. Added/updated **${filesAdded}** songs.`);
            } catch (e) {
                console.error("[Library Scan Error]", e);
                await interaction.editReply(`[ERROR] An error occurred during the scan: ${e.message}`);
            }
        } 
        else if (interaction.options.getSubcommand() === 'clear') {
            db.clearLocalLibrary();
            await interaction.editReply('[OK] The local music library has been completely cleared.');
        }
    }
};