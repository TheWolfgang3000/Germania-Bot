// help-command.js
const { EmbedBuilder } = require('discord.js');
const { prefix, embedColor } = require('./config.json');

function createHelpEmbed(title, description, fields) {
    return new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(title)
        .setDescription(description)
        .addFields(fields)
        .setFooter({ text: `Use ${prefix}help <category> for more details.` });
}

function getMainHelp() {
    return createHelpEmbed(
        'HELP MENU:',
        'Here is a list of all available help categories.',
        [
            { name: 'Info Commands', value: `\`${prefix}help-info\``, inline: true },
            { name: 'Profile & Shop', value: `\`${prefix}help-profile\``, inline: true },
            { name: 'Music Commands', value: `\`${prefix}help-music\``, inline: true },
            { name: 'Radio Commands', value: `\`${prefix}help-radio\``, inline: true },
            { name: 'Achievement Commands', value: `\`${prefix}help-achievements\``, inline: true },
            { name: 'Admin Commands', value: `\`${prefix}help-admin\``, inline: true },
        ]
    );
}

function getProfileHelp() {
    const fields = [
        { name: `${prefix}profile [@user]`, value: 'Displays your or another user\'s profile.' },
        { name: `${prefix}shop`, value: 'Opens the points shop to buy items.' },
        { name: `${prefix}inventory`, value: 'Shows all items you own. Alias: `!inv`' },
    ];
    return createHelpEmbed('PROFILE & SHOP HELP', 'Commands for your profile, inventory, and the shop.', fields);
}

function getInfoHelp() {
    const fields = [
        { name: `${prefix}ping`, value: 'Shows the bot\'s current latency.' },
        { name: `${prefix}uptime`, value: 'Shows how long the bot has been online.' },
        { name: `${prefix}botinfo`, value: 'Displays some general information about the bot.' },
        { name: `${prefix}level / !rank`, value: 'Shows your current level and XP.' },
    ];
    return createHelpEmbed('INFO HELP', 'Commands to get information.', fields);
}

function getMusicHelp() {
    const fields = [
        { name: `${prefix}play <URL or Search>`, value: 'Plays a song or playlist from a URL or search query.' },
        { name: `${prefix}skip`, value: 'Skips the current song.' },
        { name: `${prefix}stop`, value: 'Stops playback and clears the queue.' },
        { name: `${prefix}pause`, value: 'Pauses the current song.' },
        { name: `${prefix}resume`, value: 'Resumes a paused song.' },
        { name: `${prefix}loop`, value: 'Toggles looping of the queue.' },
        { name: `${prefix}queue`, value: 'Displays the current song queue.' },
        { name: `${prefix}shuffle`, value: 'Shuffles the queue randomly.' },
        { name: `${prefix}np`, value: 'Shows the now playing message with controls. Alias: !nowplaying' },
        { name: `${prefix}lyrics`, value: 'Fetches the lyrics for the current song.' },
        { name: '--------------------', value: 'Favorite Commands' },
        { name: `${prefix}music-fav`, value: 'Displays your personal list of favorite songs.' },
        { name: `${prefix}fav-play <number|all>`, value: 'Plays a song or all songs from your favorites. Alias: !fp' },
    ];
    return createHelpEmbed('MUSIC HELP', 'Commands for controlling music playback.', fields);
}

function getRadioHelp() {
    const fields = [
        { name: `${prefix}radio <STREAMLINK>`, value: 'Plays a live audio stream from a direct URL.' },
        { name: `${prefix}radiostop`, value: 'Stops the radio stream.' },
    ];
    return createHelpEmbed('RADIO HELP', 'Commands for playing radio streams.', fields);
}

function getAchievementsHelp() {
    const fields = [
        { name: `${prefix}achievements [@user]`, value: 'Displays your or another user\'s achievements.' },
        { name: `${prefix}profile [@user]`, value: 'Shows a summary of a user\'s stats. (Alias for !achievements)' },
    ];
    return createHelpEmbed('ACHIEVEMENT HELP', 'Commands to view your progress.', fields);
}

function getAdminHelp() {
    const fields = [
        { name: 'General & Logging', value: '--------------------' },
        { name: `${prefix}set-log-channel <ID>`, value: 'Sets the channel for server logs.' },
        { name: `${prefix}say <message>`, value: 'Makes the bot say a message.' },
        { name: `${prefix}clear <amount>`, value: 'Deletes a specified number of messages (1-100).' },
        { name: `${prefix}set-command-channel <ID>`, value: 'Restricts bot commands to a specific channel.' },
        { name: `${prefix}clear-command-channel`, value: 'Allows bot commands in all channels again.' },
        { name: 'Welcome & Leave', value: '--------------------' },
        { name: `${prefix}set-welcome-channel <ID>`, value: 'Sets the channel for welcome/leave messages.' },
        { name: `${prefix}set-welcome-message <text>`, value: 'Sets the custom welcome message.' },
        { name: `${prefix}set-leave-message <text>`, value: 'Sets the custom leave message.' },
        { name: 'Leveling System', value: '--------------------' },
        { name: `${prefix}leveling <on|off>`, value: 'Enables or disables the leveling system.' },
        { name: `${prefix}set-level-channel <ID>`, value: 'Sets the channel for level up announcements.' },
        { name: `${prefix}add-level-role <level> <ID>`, value: 'Sets a role reward for a specific level.' },
        { name: `${prefix}remove-level-role <level>`, value: 'Removes a role reward from a level.' },
        { name: `${prefix}list-level-roles`, value: 'Lists all configured level roles.' },
        { name: 'Cross-Message System', value: '--------------------' },
        { name: `${prefix}private-link-create <name> <pass>`, value: 'Creates a new private cross-message link.' },
        { name: `${prefix}global-link <ID>`, value: 'Connects a channel to the global link.' },
        { name: `${prefix}private-link <ID> <name> <pass>`, value: 'Connects a channel to a private link.' },
        { name: `${prefix}unlink <ID>`, value: 'Disconnects a channel from any link.' },
        { name: 'Achievements System', value: '--------------------' },
        { name: `${prefix}achievements <on|off>`, value: 'Enables or disables the achievement system.' },
        { name: `${prefix}set-achievements-channel <ID>`, value: 'Sets the channel for achievement announcements.' },
    ];
    return createHelpEmbed('ADMIN HELP', 'Commands for server administration. Requires Administrator permissions.', fields);
}

module.exports = { 
    getMainHelp, 
    getInfoHelp, 
    getProfileHelp,
    getMusicHelp, 
    getAdminHelp, 
    getRadioHelp, 
    getAchievementsHelp 
};