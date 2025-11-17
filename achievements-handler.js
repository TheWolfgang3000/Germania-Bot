// achievements-handler.js
const { EmbedBuilder } = require('discord.js');
const db = require('./db-manager.js');
const { embedColor } = require('./config.json');

const achievements = {
    // Chat & Text
    FIRST_MESSAGE: { name: 'Icebreaker', description: 'You sent your first message!', icon: '[MSG1]', secret: false },
    MSG_1000: { name: 'Conversationalist', description: 'Send 1,000 messages.', icon: '[MSG1K]', secret: false, progress: (counters) => ({ current: counters.messageCount, total: 1000 }) },
    MSG_5000: { name: 'Server Pillar', description: 'Send 5,000 messages.', icon: '[MSG5K]', secret: false, progress: (counters) => ({ current: counters.messageCount, total: 5000 }) },
    WALL_OF_TEXT: { name: 'Wall of Text', description: 'Send a message longer than 500 characters.', icon: '[TXTWALL]', secret: true },
    NIGHT_OWL: { name: 'Night Owl', description: 'Send a message between 2 AM and 4 AM.', icon: '[NIGHT]', secret: true },
    EARLY_BIRD: { name: 'Early Bird', description: 'Send a message between 5 AM and 7 AM.', icon: '[EARLY]', secret: true },
    QUESTION_MASTER_2: { name: 'Master Inquisitive', description: 'Ask 250 questions.', icon: '[Q250]', secret: false, progress: (counters) => ({ current: counters.questionsAsked, total: 250 }) },
    LONE_WOLF: { name: 'The Solo Entertainer', description: 'Send 50 messages in a row without anyone answering.', icon: '[SOLO]', secret: true }, // Progress für diesen ist komplexer
    RAPID_FIRE: { name: 'Rapid Fire', description: 'Send 10 messages in under 1 minute.', icon: '[SPAM1]', secret: false },
    ECHO_CHAMBER: { name: 'Echo Chamber', description: 'Send 10 messages in under 10 seconds.', icon: '[SPAM2]', secret: true },
    GHOST_HOUR: { name: 'Ghost Hour', description: 'Send a message while being the only user online.', icon: '[GHOST]', secret: true },
    SELF_REPLY: { name: 'Are You Talking To Me?', description: 'Reply to your own message.', icon: '[REPLY]', secret: true },
    COFFEE_LOVER: { name: 'Coffee Lover', description: 'Mention "coffee" 50 times.', icon: '[COFFEE]', secret: false, progress: (counters) => ({ current: counters.coffeeCounter, total: 50 }) },
    HUMAN_INSTINCT: { name: 'Human Instinct', description: 'Mention "sex" 10 times.', icon: '[SEX]', secret: true, progress: (counters) => ({ current: counters.sexCounter, total: 10 }) },
    PLAYLIST_CURATOR_WORD: { name: 'Playlist Curator', description: 'Mention "playlist" 50 times.', icon: '[PLAYLIST]', secret: false, progress: (counters) => ({ current: counters.playlistWordCounter, total: 50 }) },
    LINK_SHARER: { name: 'The Source', description: 'Share 10 links.', icon: '[LINK]', secret: false, progress: (counters) => ({ current: counters.linkCounter, total: 10 }) },
    SIMPLE_GREETING: { name: 'Simple Greeting', description: 'Say "Hi" 10 times as a whole message.', icon: '[HI]', secret: true, progress: (counters) => ({ current: counters.hiCounter, total: 10 }) },
    WINKER: { name: 'Winker', description: 'Use the wink emoji 😉 100 times.', icon: '[WINK]', secret: false, progress: (counters) => ({ current: counters.winkCounter, total: 100 }) },
    BOT_WHISPERER: { name: 'Bot Whisperer', description: 'Mention the word "bot" 50 times.', icon: '[BOT]', secret: false, progress: (counters) => ({ current: counters.botWordCounter, total: 50 }) },
    THE_ACCUSER: { name: 'The Accuser', description: 'Mention the word "Fehler" (error) 10 times.', icon: '[BUG]', secret: true, progress: (counters) => ({ current: counters.errorWordCounter, total: 10 }) },
    NOSTALGIC: { name: 'Nostalgic', description: 'Mention "DBM" 10 times.', icon: '[DBM]', secret: true, progress: (counters) => ({ current: counters.dbmWordCounter, total: 10 }) },
    TESTER: { name: 'Tester', description: 'Send the message "Test" 100 times.', icon: '[TEST]', secret: true, progress: (counters) => ({ current: counters.testWordCounter, total: 100 }) },
    IDENTITY_CRISIS: { name: 'Identity Crisis', description: 'Send a message that consists only of your username.', icon: '[WHOAMI]', secret: true },
    KRIEGSVERBRECHER: { name: 'War Criminal', description: 'What is wrong with you?', icon: '[FR]', secret: true },
    MSG10K: { name: 'True Conversationalist', description: 'Send 10,000 messages.', icon: '[MSG10K]', secret: false, progress: (counters) => ({ current: counters.messageCount, total: 10000 }) },
    MSG50K: { name: 'Server Legend', description: 'Send 50,000 messages.', icon: '[MSG50K]', secret: false, progress: (counters) => ({ current: counters.messageCount, total: 50000 }) },
    MSG100K: { name: 'Has No Life', description: 'Send 100,000 messages.', icon: '[MSG100K]', secret: true, progress: (counters) => ({ current: counters.messageCount, total: 100000 }) },
    TXTWALL2: { name: 'The Novelist', description: 'Send a message that hits the 2000 character limit.', icon: '[TXTWALL2]', secret: true },
    PANGRAM: { name: 'The Quick Brown Fox', description: 'Send a message containing every letter of the alphabet.', icon: '[PANGRAM]', secret: true },
    EDIT1: { name: 'The Corrector', description: 'Edit a message within 10 seconds of sending it.', icon: '[EDIT1]', secret: false },
    EDIT100: { name: 'Perfectionist', description: 'Edit messages 100 times.', icon: '[EDIT100]', secret: false, progress: (counters) => ({ current: counters.editsMade, total: 100 }) },
    DEL1: { name: 'Second Thoughts', description: 'Delete your own message within 10 seconds of sending it.', icon: '[DEL1]', secret: true },
    DEL100: { name: 'The Redactor', description: 'Delete your own messages 100 times.', icon: '[DEL100]', secret: false, progress: (counters) => ({ current: counters.deletesMade, total: 100 }) },
    NECRO: { name: 'Necromancer', description: 'Reply to a message that is older than 1 month.', icon: '[NECRO]', secret: true },
    CAPS: { name: 'CRUISE CONTROL FOR COOL', description: 'Send a message with over 50 characters, all in uppercase.', icon: '[CAPS]', secret: false },
    K: { name: 'Conversation Killer', description: 'Send a message that just says "k".', icon: '[K]', secret: true },
    QUESTION: { name: 'The Interrogator', description: 'End 10 consecutive messages with a question mark.', icon: '[QUESTION]', secret: false, progress: (counters) => ({ current: counters.consecutiveQuestion, total: 10 }) },
    EXCLAMATION: { name: 'The Announcer', description: 'End 10 consecutive messages with an exlamation mark.', icon: '[EXCLAMATION]', secret: false, progress: (counters) => ({ current: counters.consecutiveExclamation, total: 10 }) },
    DOTDOTDOT: { name: 'The Dramatist', description: 'End 10 consecutive messages with an ellipsis (...).', icon: '[DOTDOTDOT]', secret: false, progress: (counters) => ({ current: counters.consecutiveEllipsis, total: 10 }) },
    TYPO: { name: 'It\'s "You\'re"*', description: 'Correct someone else\'s spelling/grammar.', icon: '[TYPO]', secret: false },
    SHRUG: { name: 'I Dunno', description: 'Send the shrug emoticon ¯\\_(ツ)_/¯ 25 times.', icon: '[SHRUG]', secret: false, progress: (counters) => ({ current: counters.shrugCounter, total: 25 }) },
    MENTIONME: { name: 'Narcissist', description: 'Mention yourself 10 times.', icon: '[MENTIONME]', secret: true, progress: (counters) => ({ current: counters.selfMentionCounter, total: 10 }) },
    MENTIONBOT: { name: 'Skynet Enthusiast', description: 'Mention the bot 250 times.', icon: '[MENTIONBOT]', secret: false, progress: (counters) => ({ current: counters.botMentionCounter, total: 250 }) },
    MENTIONALL: { name: 'Agent of Chaos', description: 'Use @everyone or @here.', icon: '[MENTIONALL]', secret: true },
    EMPTY: { name: 'Empty Words', description: 'Send a message containing only invisible characters.', icon: '[EMPTY]', secret: true },
    BRUH: { name: 'Bruh Moment', description: 'Say "bruh" 100 times.', icon: '[BRUH]', secret: false, progress: (counters) => ({ current: counters.bruhCounter, total: 100 }) },
    LOL: { name: 'Easily Amused', description: 'Say "lol" or "lmao" 500 times.', icon: '[LOL]', secret: false, progress: (counters) => ({ current: counters.lolCounter, total: 500 }) },
    CODE1: { name: 'The Programmer', description: 'Send a message using a code block.', icon: '[CODE1]', secret: false },
    CODE50: { name: 'Senior Developer', description: 'Send 50 messages using code blocks.', icon: '[CODE50]', secret: false, progress: (counters) => ({ current: counters.codeBlockCounter, total: 50 }) },
    SPOILER: { name: 'The Secret Keeper', description: 'Use the spoiler tag ||like this|| 50 times.', icon: '[SPOILER]', secret: false, progress: (counters) => ({ current: counters.spoilerCounter, total: 50 }) },
    QUOTE: { name: 'The Quoter', description: 'Use the quote feature > like this 25 times.', icon: '[QUOTE]', secret: false, progress: (counters) => ({ current: counters.quoteCounter, total: 25 }) },
    // Streak
    STREAK_3: { name: 'Consistency', description: 'Maintain a 3-day chat streak.', icon: '[S3]', secret: false, progress: (counters) => ({ current: counters.dailyStreak, total: 3 }) },
    STREAK_7: { name: 'Habitual Poster', description: 'Maintain a 7-day chat streak.', icon: '[S7]', secret: false, progress: (counters) => ({ current: counters.dailyStreak, total: 7 }) },
    STREAK_30: { name: 'Part of the Furniture', description: 'Maintain a 30-day chat streak.', icon: '[S30]', secret: false, progress: (counters) => ({ current: counters.dailyStreak, total: 30 }) },
    STREAK_365: { name: 'One Year Club', description: 'Maintain a 365-day chat streak.', icon: '[S365]', secret: false, progress: (counters) => ({ current: counters.dailyStreak, total: 365 }) },
    S14: { name: 'Fortnightly Regular', description: 'Maintain a 14-day chat streak.', icon: '[S14]', secret: false, progress: (counters) => ({ current: counters.dailyStreak, total: 14 }) },
    S60: { name: 'Diamond Poster', description: 'Maintain a 60-day chat streak.', icon: '[S60]', secret: false, progress: (counters) => ({ current: counters.dailyStreak, total: 60 }) },
    S180: { name: 'Server Fixture', description: 'Maintain a 180-day chat streak.', icon: '[S180]', secret: false, progress: (counters) => ({ current: counters.dailyStreak, total: 180 }) },
    WAGON: { name: 'Fell Off The Wagon', description: 'Break a chat streak of 30 days or more.', icon: '[WAGON]', secret: true },
    COMEBACK: { name: 'The Return', description: 'Send a message after being inactive for over 30 days.', icon: '[COMEBACK]', secret: false },
    // Voice
    VC_FIRST_JOIN: { name: 'Hello, is this thing on?', description: 'Join a voice channel for the first time.', icon: '[VC1]', secret: false },
    VC_TIME_1H: { name: 'Chatterbox', description: 'Spend a total of 1 hour in voice channels.', icon: '[VT1H]', secret: false },
    VC_TIME_10H: { name: 'Resident Speaker', description: 'Spend a total of 10 hours in voice channels.', icon: '[VT10H]', secret: false },
    VC_TIME_50H: { name: 'True Speaker', description: 'Spend a total of 50 hours in voice channels.', icon: '[VT50H]', secret: false },
    VC_MARATHON_2H: { name: 'Marathon Session', description: 'Stay in a voice channel for 2 hours straight.', icon: '[VTS2H]', secret: false },
    VC_MARATHON_4H: { name: 'Endurance Session', description: 'Stay in a voice channel for 4 hours straight.', icon: '[VTS4H]', secret: false },
    CONSTANT_COMPANION: { name: 'Constant Companion', description: 'Join a voice channel 100 times.', icon: '[VC100]', secret: false, progress: (counters) => ({ current: counters.vcJoins, total: 100 }) },
    LAST_ONE_OUT: { name: 'Last One Out', description: 'Be the last person to leave a voice channel.', icon: '[LASTOUT]', secret: true },
    VT100H: { name: 'Voice Channel Addict', description: 'Spend a total of 100 hours in voice channels.', icon: '[VT100H]', secret: false },
    VT500H: { name: 'Lives in Voice', description: 'Spend a total of 500 hours in voice channels.', icon: '[VT500H]', secret: false },
    VTS8H: { name: 'All-Nighter', description: 'Stay in a voice channel for 8 hours straight.', icon: '[VTS8H]', secret: false },
    VTS12H: { name: 'Is This My Home Now?', description: 'Stay in a voice channel for 12 hours straight.', icon: '[VTS12H]', secret: true },
    ALONE1H: { name: 'Echoes in the Void', description: 'Be alone in a voice channel for a total of 1 hour.', icon: '[ALONE1H]', secret: true },
    MUTE1H: { name: 'The Silent Observer', description: 'Be muted in a voice channel for a total of 1 hour.', icon: '[MUTE1H]', secret: false },
    DEAF1H: { name: 'Selective Hearing', description: 'Be deafened in a voice channel for a total of 1 hour.', icon: '[DEAF1H]', secret: false },
    QUICKIE: { name: 'Knock Knock', description: 'Join and leave a voice channel within 5 seconds.', icon: '[QUICKIE]', secret: true },
    SURFER: { name: 'Channel Surfer', description: 'Join 5 different voice channels in under 2 minutes.', icon: '[SURFER]', secret: false },
    FIRSTIN: { name: 'The Instigator', description: 'Be the first person to join any voice channel for the day.', icon: '[FIRSTIN]', secret: false },
    EVICTION: { name: 'Evicted', description: 'Get moved out of a voice channel by an admin.', icon: '[EVICTION]', secret: true },
    SILENCED: { name: 'You Have No Power Here', description: 'Get server-muted by an admin.', icon: '[SILENCED]', secret: true },
    // Community & Befehle
    FIRST_REACTION: { name: 'First Click', description: 'React to a message for the first time.', icon: '[REACT1]', secret: false },
    REACTIONS_GIVEN_50: { name: 'Emotive', description: 'Give 50 reactions to messages.', icon: '[RG50]', secret: false, progress: (counters) => ({ current: counters.reactionsGiven, total: 50 }) },
    REACTIONS_GIVEN_250: { name: 'Reaction Enthusiast', description: 'Give 250 reactions to messages.', icon: '[RG250]', secret: false, progress: (counters) => ({ current: counters.reactionsGiven, total: 250 }) },
    REACTIONS_RECEIVED_25: { name: 'Fan Favorite', description: 'Receive 25 reactions on a single message.', icon: '[RR25]', secret: false },
    SELF_LOVE: { name: 'Self-Love', description: 'React to your own message.', icon: '[<3SELF]', secret: true },
    PIONEER: { name: 'Pioneer', description: 'Be the first person on the server to use !ping.', icon: '[PIONEER]', secret: true },
    PING_PONG_MASTER: { name: 'Ping Pong Master', description: 'Use the !ping command 100 times.', icon: '[PING100]', secret: false, progress: (counters) => ({ current: counters.commandUsage?.ping || 0, total: 100 }) },
    BOT_USER: { name: 'Bot User', description: 'Use 50 bot commands.', icon: '[CMD50]', secret: false, progress: (counters) => ({ current: counters.commandUsage?.total || 0, total: 50 }) },
    NOW_PLAYING_USER: { name: 'What\'s Playing?', description: 'Use the !np command for the first time.', icon: '[NP]', secret: false },
    RG1K: { name: 'Reaction King', description: 'Give 1,000 reactions.', icon: '[RG1K]', secret: false, progress: (counters) => ({ current: counters.reactionsGiven, total: 1000 }) },
    RR100: { name: 'God-Tier Post', description: 'Receive 100 reactions on a single message.', icon: '[RR100]', secret: false },
    CMD1K: { name: 'Command Line Hero', description: 'Use 1,000 bot commands.', icon: '[CMD1K]', secret: false, progress: (counters) => ({ current: counters.commandUsage?.total || 0, total: 1000 }) },
    CMDFAIL: { name: 'Does Not Compute', description: 'Use a command that doesn\'t exist 10 times.', icon: '[CMDFAIL]', secret: true, progress: (counters) => ({ current: counters.commandFail, total: 10 }) },
    BADARGS: { name: 'Syntax Error', description: 'Use a command with the wrong arguments 25 times.', icon: '[BADARGS]', secret: false, progress: (counters) => ({ current: counters.badArgs, total: 25 }) },
    COOLDOWN: { name: 'Impatient', description: 'Try to use a command while it\'s on cooldown 10 times.', icon: '[COOLDOWN]', secret: true, progress: (counters) => ({ current: counters.cooldownHits, total: 10 }) },
    REMOJI: { name: 'The Taker', description: 'Remove someone else\'s reaction from a message.', icon: '[REMOJI]', secret: true },
    CLOWN: { name: 'You\'re the whole circus', description: 'Get the 🤡 reaction on one of your messages.', icon: '[CLOWN]', secret: true },
    SKULL: { name: 'Certified Dead', description: 'Get the 💀 reaction 10 times on your messages.', icon: '[SKULL]', secret: false, progress: (counters) => ({ current: counters.skullReactions, total: 10 }) },
    AVATAR: { name: 'New Look', description: 'Change your server avatar.', icon: '[AVATAR]', secret: false },
    NICKNAME: { name: 'Identity Thief', description: 'Change your server nickname 10 times.', icon: '[NICKNAME]', secret: true, progress: (counters) => ({ current: counters.nicknameChanges, total: 10 }) },
    THREAD: { name: 'The Weaver', description: 'Create a thread.', icon: '[THREAD]', secret: false },
    HELP: { name: 'I Need Help!', description: 'Use the bot\'s help command.', icon: '[HELP]', secret: false },
    // Musik
    FIRST_SONG: { name: 'First Beat', description: 'Play a song for the first time.', icon: '[PLAY1]', secret: false },
    HIT_MASTER: { name: 'Hit Master', description: 'Play 100 songs in total.', icon: '[PLAY100]', secret: false, progress: (counters) => ({ current: counters.songsPlayed, total: 100 }) },
    QUEUE_STARTER: { name: 'Queue Starter', description: 'Add 5 songs to the queue at once.', icon: '[Q5]', secret: false },
    QUEUE_MASTER: { name: 'Queue Master', description: 'Fill the queue with 20 songs at once.', icon: '[Q20]', secret: false },
    PLAYLIST_PRO: { name: 'Playlist Pro', description: 'Queue a playlist with more than 20 songs.', icon: '[PL20]', secret: false },
    LOOP_LOVER: { name: 'Endless Loop', description: 'Use the !loop command 10 times.', icon: '[LOOP10]', secret: false, progress: (counters) => ({ current: counters.commandUsage?.loop || 0, total: 10 }) },
    SKIP_MASTER: { name: 'Skip Master', description: 'Use the !skip command 50 times.', icon: '[SKIP50]', secret: false, progress: (counters) => ({ current: counters.commandUsage?.skip || 0, total: 50 }) },
    BACK_TRACKER: { name: 'Back Tracker', description: 'Use the !back command 20 times.', icon: '[BACK20]', secret: false, progress: (counters) => ({ current: counters.commandUsage?.back || 0, total: 20 }) },
    PARTY_STOPPER: { name: 'Party Stopper', description: 'Use the !stop command 50 times.', icon: '[STOP50]', secret: false, progress: (counters) => ({ current: counters.commandUsage?.stop || 0, total: 50 }) },
    SHUFFLE_KING: { name: 'Shuffle King', description: 'Use the !shuffle command 10 times.', icon: '[SHUFFLE10]', secret: false, progress: (counters) => ({ current: counters.commandUsage?.shuffle || 0, total: 10 }) },
    PLAY1K: { name: 'DJ Extraordinaire', description: 'Play 1,000 songs in total.', icon: '[PLAY1K]', secret: false, progress: (counters) => ({ current: counters.songsPlayed, total: 1000 }) },
    PLAY5K: { name: 'God of the Decks', description: 'Play 5,000 songs in total.', icon: '[PLAY5K]', secret: false, progress: (counters) => ({ current: counters.songsPlayed, total: 5000 }) },
    Q100: { name: 'The Concert Organizer', description: 'Fill the queue with 100 songs at once.', icon: '[Q100]', secret: false },
    LONGSONG: { name: 'Epic Saga', description: 'Play a song that is longer than 10 minutes.', icon: '[LONGSONG]', secret: false },
    SHORTSONG: { name: 'ADHD Kick', description: 'Play a song that is shorter than 30 seconds.', icon: '[SHORTSONG]', secret: true },
    OBSESSED: { name: 'Broken Record', description: 'Manually queue the same song 3 times in a row.', icon: '[OBSESSED]', secret: true },
    REGRET: { name: 'Nevermind', description: 'Skip a song that you yourself queued.', icon: '[REGRET]', secret: true },
    SABOTAGE: { name: 'The Saboteur', description: 'Clear a queue that has more than 10 songs added by other people.', icon: '[SABOTAGE]', secret: true },
    RICKROLL: { name: 'Never Gonna Give You Up', description: 'Play the classic Rick Astley song.', icon: '[RICKROLL]', secret: true },
    DEJA_VU: { name: 'Déjà Vu', description: 'Use the !back command 5 times in a row.', icon: '[DEJA_VU]', secret: false },
    PAUSE: { name: 'Dramatic Pause', description: 'Pause the music for more than 5 minutes.', icon: '[PAUSE]', secret: false },
    RESUME: { name: 'The Show Must Go On', description: 'Use the !resume command.', icon: '[RESUME]', secret: false },
    SEEK: { name: 'Time Traveler', description: 'Use the !seek command to jump to a specific part of a song.', icon: '[SEEK]', secret: false },
    NOWPLAYING: { name: 'Captain Obvious', description: 'Use the !np command for a song you just queued.', icon: '[NOWPLAYING]', secret: true },
    VOLUME: { name: 'EAR RAPE', description: 'Set the bot\'s volume to its maximum.', icon: '[VOLUME]', secret: true },
    EMPTYQ_SKIP: { name: 'Skipping Silence', description: 'Try to skip when the queue is empty.', icon: '[EMPTYQ_SKIP]', secret: true },
    // Server-Zugehörigkeit
    ONE_YEAR_VETERAN: { name: 'One Year Veteran', description: 'Be a member of the server for 1 year.', icon: '[1Y]', secret: false },
    FIVE_YEAR_VETERAN: { name: 'Server Cornerstone', description: 'Be a member of the server for 5 years.', icon: '[5Y]', secret: false },
    "2Y": { name: 'Two Year Veteran', description: 'Be a member of the server for 2 years.', icon: '[2Y]', secret: false },
    "3Y": { name: 'Three Year Veteran', description: 'Be a member of the server for 3 years.', icon: '[3Y]', secret: false },
    "4Y": { name: 'Four Year Veteran', description: 'Be a member of the server for 4 years.', icon: '[4Y]', secret: false },
    "10Y": { name: 'Server Fossil', description: 'Be a member of the server for 10 years.', icon: '[10Y]', secret: true },
    ANNIVERSARY: { name: 'Happy Serverversary!', description: 'Send a message on the anniversary of you joining the server.', icon: '[ANNIVERSARY]', secret: true },
    //Zufall & Meta (Neue Kategorie)
    LUCKY: { name: 'Feeling Lucky', description: 'Receive an achievement by pure random chance.', icon: '[LUCKY]', secret: true },
    UNLUCKY: { name: 'Unlucky', description: 'The opposite of lucky, a "negative" achievement.', icon: '[UNLUCKY]', secret: true },
    FIRST: { name: 'First of the Day', description: 'Be the first person to send a message on the server after midnight.', icon: '[FIRST]', secret: false },
    MIDNIGHT: { name: 'The Midnight Hour', description: 'Send a message at exactly 00:00.', icon: '[MIDNIGHT]', secret: true },
    NOON: { name: 'High Noon', description: 'Send a message at exactly 12:00.', icon: '[NOON]', secret: true },
    "1337": { name: 'Leet Speak', description: 'Send a message at exactly 13:37.', icon: '[1337]', secret: true },
    ACHIEVEMENT: { name: 'Meta-Gamer', description: 'Mention "Achievement" or "Erfolg" 10 times.', icon: '[ACHIEVEMENT]', secret: false, progress: (counters) => ({ current: counters.achievementWordCounter, total: 10 }) },
    BUGHUNTER: { name: 'Bug Hunter', description: 'Be the first person to report a genuine, new bug with the bot.', icon: '[BUGHUNTER]', secret: false },
    BETA: { name: 'Beta Tester', description: 'Participate in testing new bot features before public release.', icon: '[BETA]', secret: false },
    ALL: { name: 'The Completionist', description: 'Unlock all non-secret achievements.', icon: '[ALL]', secret: false },
    ALLSECRET: { name: 'The True Completionist', description: 'Unlock ALL achievements, including secret ones.', icon: '[ALLSECRET]', secret: true },
};

async function sendAnnouncement(guild, user, achievement) {
    const channelId = db.getServerSetting(guild.id, 'achievementsChannelId');
    if (!channelId) return;
    try {
        const channel = await guild.channels.fetch(channelId);
        if (channel && channel.isTextBased()) {
            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({ name: `${user.username} unlocked an achievement!`, iconURL: user.displayAvatarURL() })
                .setTitle(`${achievement.icon} ${achievement.name}`)
                .setDescription(`*${achievement.description}*`);
            await channel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error(`[FEHLER] Konnte Achievement-Ankündigung nicht senden in Gilde ${guild.name}:`, error);
    }
}

/**
 * Schaltet einen Erfolg für einen Benutzer frei.
 * Speichert den Erfolg mit einem Timestamp in der Datenbank.
 * @param {GuildMember} member - Das Gildenmitglied, das den Erfolg freischaltet.
 * @param {string} achievementId - Die ID des Erfolgs aus dem 'achievements'-Objekt.
 * @param {object} userData - Das aktuelle Datenobjekt des Benutzers.
 */
async function unlockAchievement(member, achievementId, userData) {
    // --- NEUE, FINALE PRÜFUNG ---
    // Wir holen uns die absolut aktuellsten Daten direkt aus der DB, um 100% sicher zu sein.
    const freshUserData = db.getUserData(member.guild.id, member.id);
    if (freshUserData.achievements[achievementId]) {
        // Wenn die DB sagt, der Erfolg existiert, brechen wir hier endgültig ab.
        return;
    }

    // Das Schloss-System für sofortige Doppelvergaben behalten wir als erste, schnelle Abwehr.
    const lockId = `${member.id}_${achievementId}`;
    if (member.client.unlocking.has(lockId)) return;
    member.client.unlocking.add(lockId);

    // Jetzt, wo wir sicher sind, wird der Erfolg im übergebenen userData-Objekt gesetzt,
    // das am Ende des Events in index.js gespeichert wird.
    userData.achievements[achievementId] = Date.now();

    const achievement = achievements[achievementId];
    console.log(`[ACHIEVEMENT] ${member.user.tag} unlocked in ${member.guild.name}: ${achievement.name}`);
    
    await sendAnnouncement(member.guild, member.user, achievement);

    setTimeout(() => {
        member.client.unlocking.delete(lockId);
    }, 5000);
}


// --- Der Rest der Datei bleibt unverändert ---
// Alle `check...` Funktionen funktionieren weiterhin wie bisher.
// Sie modifizieren `userData`, welches dann am Ende des messageCreate-Events in der `index.js` gespeichert wird.

async function sendStreakLostMessage(channel, user, oldStreak) {
    try {
        const embed = new EmbedBuilder()
            .setColor(0xFF4500)
            .setDescription(`Oh no, ${user}! Your chat streak of **${oldStreak} days** has been lost. Send a message every day to build it back up!`);
        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[FEHLER] Konnte Streak-Verlust-Nachricht nicht senden:`, error);
    }
}

async function checkStreakAchievements(member, streak, userData) {
    const unlocked = userData.achievements;
    if (streak >= 3 && !unlocked.STREAK_3) await unlockAchievement(member, 'STREAK_3', userData);
    if (streak >= 7 && !unlocked.STREAK_7) await unlockAchievement(member, 'STREAK_7', userData);
    if (streak >= 30 && !unlocked.STREAK_30) await unlockAchievement(member, 'STREAK_30', userData);
    if (streak >= 365 && !unlocked.STREAK_365) await unlockAchievement(member, 'STREAK_365', userData);
}

async function checkVcTimeAchievements(member, userData) {
    const totalVcTime = userData.achievementCounters.totalVcTime || 0;
    const oneHour = 3600000;
    if (totalVcTime >= oneHour && !userData.achievements.VC_TIME_1H) await unlockAchievement(member, 'VC_TIME_1H', userData);
    if (totalVcTime >= oneHour * 10 && !userData.achievements.VC_TIME_10H) await unlockAchievement(member, 'VC_TIME_10H', userData);
    if (totalVcTime >= oneHour * 50 && !userData.achievements.VC_TIME_50H) await unlockAchievement(member, 'VC_TIME_50H', userData);
}

async function checkMessageAchievements(message, client, userData) {
    if (!db.getServerSetting(message.guild.id, 'achievementsEnabled')) return;
    
    const member = message.member;
    const lowerCaseContent = message.content.toLowerCase();
    const now = new Date();

    userData.achievementCounters.messageCount = (userData.achievementCounters.messageCount || 0) + 1;
    if (lowerCaseContent.includes('kaffee')) userData.achievementCounters.coffeeCounter = (userData.achievementCounters.coffeeCounter || 0) + 1;
    if (lowerCaseContent.includes('sex')) userData.achievementCounters.sexCounter = (userData.achievementCounters.sexCounter || 0) + 1;
    if (lowerCaseContent.includes('playlist')) userData.achievementCounters.playlistWordCounter = (userData.achievementCounters.playlistWordCounter || 0) + 1;
    if (message.content.includes('😉')) userData.achievementCounters.winkCounter = (userData.achievementCounters.winkCounter || 0) + 1;
    if (lowerCaseContent.includes('bot')) userData.achievementCounters.botWordCounter = (userData.achievementCounters.botWordCounter || 0) + 1;
    if (lowerCaseContent.includes('fehler')) userData.achievementCounters.errorWordCounter = (userData.achievementCounters.errorWordCounter || 0) + 1;
    if (lowerCaseContent.includes('dbm')) userData.achievementCounters.dbmWordCounter = (userData.achievementCounters.dbmWordCounter || 0) + 1;
    if (message.content === 'Test') userData.achievementCounters.testWordCounter = (userData.achievementCounters.testWordCounter || 0) + 1;
    if (message.content === 'Hi') userData.achievementCounters.hiCounter = (userData.achievementCounters.hiCounter || 0) + 1;
    if (message.content.match(/https?:\/\/[^\s]+/g)) userData.achievementCounters.linkCounter = (userData.achievementCounters.linkCounter || 0) + (message.content.match(/https?:\/\/[^\s]+/g) || []).length;
    if (message.content.endsWith('?')) userData.achievementCounters.questionsAsked = (userData.achievementCounters.questionsAsked || 0) + 1;

    if (!userData.achievements.FIRST_MESSAGE) await unlockAchievement(member, 'FIRST_MESSAGE', userData);
    if (userData.achievementCounters.messageCount >= 1000 && !userData.achievements.MSG_1000) await unlockAchievement(member, 'MSG_1000', userData);
    if (userData.achievementCounters.messageCount >= 5000 && !userData.achievements.MSG_5000) await unlockAchievement(member, 'MSG_5000', userData);
    if (message.content.length > 500 && !userData.achievements.WALL_OF_TEXT) await unlockAchievement(member, 'WALL_OF_TEXT', userData);
    
    const hour = now.getHours();
    if ((hour >= 2 && hour < 4) && !userData.achievements.NIGHT_OWL) await unlockAchievement(member, 'NIGHT_OWL', userData);
    if ((hour >= 5 && hour < 7) && !userData.achievements.EARLY_BIRD) await unlockAchievement(member, 'EARLY_BIRD', userData);
    
    if (userData.achievementCounters.questionsAsked >= 250 && !userData.achievements.QUESTION_MASTER_2) await unlockAchievement(member, 'QUESTION_MASTER_2', userData);
    if (userData.achievementCounters.coffeeCounter >= 50 && !userData.achievements.COFFEE_LOVER) await unlockAchievement(member, 'COFFEE_LOVER', userData);
    if (userData.achievementCounters.sexCounter >= 10 && !userData.achievements.HUMAN_INSTINCT) await unlockAchievement(member, 'HUMAN_INSTINCT', userData);
    if (userData.achievementCounters.playlistWordCounter >= 50 && !userData.achievements.PLAYLIST_CURATOR_WORD) await unlockAchievement(member, 'PLAYLIST_CURATOR_WORD', userData);
    if (userData.achievementCounters.linkCounter >= 10 && !userData.achievements.LINK_SHARER) await unlockAchievement(member, 'LINK_SHARER', userData);
    if (userData.achievementCounters.hiCounter >= 10 && !userData.achievements.SIMPLE_GREETING) await unlockAchievement(member, 'SIMPLE_GREETING', userData);
    if (userData.achievementCounters.winkCounter >= 100 && !userData.achievements.WINKER) await unlockAchievement(member, 'WINKER', userData);
    if (userData.achievementCounters.botWordCounter >= 50 && !userData.achievements.BOT_WHISPERER) await unlockAchievement(member, 'BOT_WHISPERER', userData);
    if (userData.achievementCounters.errorWordCounter >= 10 && !userData.achievements.THE_ACCUSER) await unlockAchievement(member, 'THE_ACCUSER', userData);
    if (userData.achievementCounters.dbmWordCounter >= 10 && !userData.achievements.NOSTALGIC) await unlockAchievement(member, 'NOSTALGIC', userData);
    if (userData.achievementCounters.testWordCounter >= 100 && !userData.achievements.TESTER) await unlockAchievement(member, 'TESTER', userData);
    if (message.content === member.user.username && !userData.achievements.IDENTITY_CRISIS) await unlockAchievement(member, 'IDENTITY_CRISIS', userData);
    if (message.reference) {
        const repliedTo = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
        if (repliedTo && repliedTo.author.id === message.author.id && !userData.achievements.SELF_REPLY) await unlockAchievement(member, 'SELF_REPLY', userData);
    }
    const frenchWords = ['bonjour', 'merci', 'croissant', 'baguette', 'oui'];
    if (frenchWords.some(word => lowerCaseContent.includes(word)) && !userData.achievements.KRIEGSVERBRECHER) await unlockAchievement(member, 'KRIEGSVERBRECHER', userData);
    
    await message.guild.members.fetch(); 
    const onlineMembers = message.guild.members.cache.filter(m => !m.user.bot && (m.presence?.status === 'online' || m.presence?.status === 'dnd' || m.presence?.status === 'idle')).size;
    if (onlineMembers <= 1 && !userData.achievements.GHOST_HOUR) await unlockAchievement(member, 'GHOST_HOUR', userData);
    
    const oneYear = 31536000000;
    const fiveYears = oneYear * 5;
    if (Date.now() - member.joinedTimestamp > oneYear && !userData.achievements.ONE_YEAR_VETERAN) await unlockAchievement(member, 'ONE_YEAR_VETERAN', userData);
    if (Date.now() - member.joinedTimestamp > fiveYears && !userData.achievements.FIVE_YEAR_VETERAN) await unlockAchievement(member, 'FIVE_YEAR_VETERAN', userData);

    const channelState = client.channelState.get(message.channel.id) || { lastAuthor: null, count: 0 };
    if (channelState.lastAuthor === message.author.id) {
        channelState.count++;
    } else {
        channelState.lastAuthor = message.author.id;
        channelState.count = 1;
    }
    client.channelState.set(message.channel.id, channelState);
    if (channelState.count >= 50 && !userData.achievements.LONE_WOLF) await unlockAchievement(member, 'LONE_WOLF', userData);
    
    const currentTime = Date.now();
    if (!userData.achievementCounters.lastMessageTimestamps) userData.achievementCounters.lastMessageTimestamps = [];
    userData.achievementCounters.lastMessageTimestamps.push(currentTime);
    while (userData.achievementCounters.lastMessageTimestamps.length > 10) {
        userData.achievementCounters.lastMessageTimestamps.shift();
    }
    if (userData.achievementCounters.lastMessageTimestamps.length === 10) {
        if ((currentTime - userData.achievementCounters.lastMessageTimestamps[0]) < 60000 && !userData.achievements.RAPID_FIRE) await unlockAchievement(member, 'RAPID_FIRE', userData);
        if ((currentTime - userData.achievementCounters.lastMessageTimestamps[0]) < 10000 && !userData.achievements.ECHO_CHAMBER) await unlockAchievement(member, 'ECHO_CHAMBER', userData);
    }

    const lastMessageDate = userData.achievementCounters.lastMessageTimestamp ? new Date(userData.achievementCounters.lastMessageTimestamp) : null;
    if (!lastMessageDate || now.toDateString() !== lastMessageDate.toDateString()) {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        if (lastMessageDate && lastMessageDate.toDateString() === yesterday.toDateString()) {
            userData.achievementCounters.dailyStreak = (userData.achievementCounters.dailyStreak || 0) + 1;
        } else {
            if (userData.achievementCounters.dailyStreak > 1) sendStreakLostMessage(message.channel, message.author, userData.achievementCounters.dailyStreak);
            userData.achievementCounters.dailyStreak = 1;
        }
        userData.achievementCounters.lastMessageTimestamp = now.getTime();
        await checkStreakAchievements(member, userData.achievementCounters.dailyStreak, userData);
    }
}

async function checkReactionAchievements(reaction, user, userData) {
    if (!db.getServerSetting(reaction.message.guild.id, 'achievementsEnabled')) return;
    const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    if (!userData.achievements.FIRST_REACTION) await unlockAchievement(member, 'FIRST_REACTION', userData);

    if (user.id === reaction.message.author.id) {
        if (!userData.achievements.SELF_LOVE) await unlockAchievement(member, 'SELF_LOVE', userData);
    }

    userData.achievementCounters.reactionsGiven = (userData.achievementCounters.reactionsGiven || 0) + 1;
    if (userData.achievementCounters.reactionsGiven >= 50 && !userData.achievements.REACTIONS_GIVEN_50) await unlockAchievement(member, 'REACTIONS_GIVEN_50', userData);
    if (userData.achievementCounters.reactionsGiven >= 250 && !userData.achievements.REACTIONS_GIVEN_250) await unlockAchievement(member, 'REACTIONS_GIVEN_250', userData);
    
    const authorId = reaction.message.author.id;
    if (authorId && authorId !== user.id) {
        const authorData = db.getUserData(reaction.message.guild.id, authorId);
        if (!authorData.achievements.REACTIONS_RECEIVED_25 && reaction.count >= 25) {
            const authorMember = await reaction.message.guild.members.fetch(authorId).catch(() => null);
            if (authorMember) {
                await unlockAchievement(authorMember, 'REACTIONS_RECEIVED_25', authorData);
                db.setUserData(reaction.message.guild.id, authorId, authorData);
            }
        }
    }
}

async function checkVoiceAchievements(oldState, newState, userData) {
    const member = newState.member;
    if (member.user.bot || !db.getServerSetting(newState.guild.id, 'achievementsEnabled')) return;

    const wasInVc = oldState.channel && oldState.channel.id !== null;
    const isInVc = newState.channel && newState.channel.id !== null;

    if (!wasInVc && isInVc) {
        userData.achievementCounters.vcJoinTime = Date.now();
        userData.achievementCounters.vcJoins = (userData.achievementCounters.vcJoins || 0) + 1;
        if (!userData.achievements.VC_FIRST_JOIN) await unlockAchievement(member, 'VC_FIRST_JOIN', userData);
        if (userData.achievementCounters.vcJoins >= 100 && !userData.achievements.CONSTANT_COMPANION) await unlockAchievement(member, 'CONSTANT_COMPANION', userData);

    } else if (wasInVc && !isInVc) {
        if (oldState.channel.members.filter(m => !m.user.bot).size === 0) {
            if (!userData.achievements.LAST_ONE_OUT) await unlockAchievement(member, 'LAST_ONE_OUT', userData);
        }

        if (userData.achievementCounters.vcJoinTime) {
            const sessionDuration = Date.now() - userData.achievementCounters.vcJoinTime;
            userData.achievementCounters.totalVcTime = (userData.achievementCounters.totalVcTime || 0) + sessionDuration;
            
            if (sessionDuration >= 7200000 && !userData.achievements.VC_MARATHON_2H) await unlockAchievement(member, 'VC_MARATHON_2H', userData);
            if (sessionDuration >= 14400000 && !userData.achievements.VC_MARATHON_4H) await unlockAchievement(member, 'VC_MARATHON_4H', userData);
            
            await checkVcTimeAchievements(member, userData);
        }
    }
}

module.exports = {
    checkMessageAchievements,
    checkVoiceAchievements,
    checkReactionAchievements,
    achievements,
    unlockAchievement
};