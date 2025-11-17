// commands/setup-reaction-role.js
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ChannelType } = require('discord.js');
const db = require('../db-manager.js');
const { embedColor } = require('../config.json');

// Hilfsfunktion, um Emoji-Daten zu parsen
function parseEmoji(emoji) {
    // Standard-Unicode-Emoji (z.B. 👍)
    if (!emoji.startsWith('<')) {
        return emoji;
    }
    // Custom Discord Emoji (z.B. <_name:ID>)
    const match = emoji.match(/<a?:.+:(\d+)>$/);
    return match ? match[1] : emoji; // Gibt ID oder original (falls ungültig) zurück
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-reaction-role')
        .setDescription('[Admin] Manages reaction roles on the server.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator) // Nur Admins
        .addSubcommand(subcommand =>
            subcommand
                .setName('create-panel')
                .setDescription('Creates a new message panel for users to react to.')
                .addChannelOption(option => 
                    option.setName('channel')
                        .setDescription('The channel where the panel will be posted.')
                        .addChannelTypes(ChannelType.GuildText) // Nur Textkanäle
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('title')
                        .setDescription('The title of the reaction role embed.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('The text inside the panel (e.g., "React to get your roles!").')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Links a message, emoji, and role together.')
                .addStringOption(option =>
                    option.setName('message-id')
                        .setDescription('The ID of the message (panel) you want to use.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('The emoji that users will click on.')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to grant.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes a reaction role from a message.')
                .addStringOption(option =>
                    option.setName('message-id')
                        .setDescription('The ID of the message (panel).')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('The emoji of the rule to remove.')
                        .setRequired(true))),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        await interaction.deferReply({ ephemeral: true }); // Admin-Befehle sollten diskret sein

        try {
            if (subcommand === 'create-panel') {
                const channel = interaction.options.getChannel('channel');
                const title = interaction.options.getString('title');
                const description = interaction.options.getString('description');

                const panelEmbed = new EmbedBuilder()
                    .setColor(embedColor)
                    .setTitle(title)
                    .setDescription(description);

                // Sende das Panel in den Zielkanal
                const panelMessage = await channel.send({ embeds: [panelEmbed] });

                // Antworte dem Admin mit der ID
                await interaction.editReply({
                    content: `[OK] Reaction role panel successfully created in ${channel}.\n` +
                             `The Message ID is: \`${panelMessage.id}\`\n` +
                             `Now use \`/setup-reaction-role add\` to link roles to this message.`
                });
            
            } else if (subcommand === 'add') {
                const messageId = interaction.options.getString('message-id');
                const emoji = interaction.options.getString('emoji');
                const role = interaction.options.getRole('role');
                const emojiId = parseEmoji(emoji); // Unicode oder ID

                // Finde die Nachricht, um sicherzustellen, dass sie existiert
                let targetMessage;
                try {
                    // Wir müssen durch alle Kanäle suchen, da der Admin den Befehl überall ausführen kann
                    const channels = await interaction.guild.channels.fetch();
                    for (const [_, channel] of channels) {
                        if (channel.isTextBased()) {
                            targetMessage = await channel.messages.fetch(messageId).catch(() => null);
                            if (targetMessage) break;
                        }
                    }
                    if (!targetMessage) throw new Error('Message not found.');
                } catch (e) {
                    return interaction.editReply({ content: `[!] Error: Could not find a message with the ID \`${messageId}\` on this server.` });
                }

                // 1. Speichere die Regel in der DB
                db.addReactionRole(interaction.guild.id, messageId, emojiId, role.id);

                // 2. Erfülle deinen Wunsch: Der Bot reagiert selbst auf die Nachricht
                try {
                    await targetMessage.react(emoji);
                } catch (reactError) {
                    console.error("Bot could not react to message:", reactError);
                    return interaction.editReply({ content: `[!] Rule saved, but I failed to react with the emoji. Is the emoji correct or am I blocked in that channel?` });
                }

                await interaction.editReply({ content: `[OK] Rule added. I have reacted with ${emoji} on message \`${messageId}\`. Users clicking it will now get the \`${role.name}\` role.` });

            } else if (subcommand === 'remove') {
                const messageId = interaction.options.getString('message-id');
                const emoji = interaction.options.getString('emoji');
                const emojiId = parseEmoji(emoji);

                // 1. Entferne die Regel aus der DB
                const result = db.removeReactionRole(interaction.guild.id, messageId, emojiId);
                if (!result.success) {
                    return interaction.editReply({ content: `[!] Could not delete rule from database. (Error: ${result.error})` });
                }
                if (result.success && result.changes === 0) {
                     return interaction.editReply({ content: `[!] No rule found for that message/emoji combination.` });
                }

                // 2. Entferne die Reaktion des Bots von der Nachricht
                try {
                    let targetMessage;
                    const channels = await interaction.guild.channels.fetch();
                    for (const [_, channel] of channels) {
                        if (channel.isTextBased()) {
                            targetMessage = await channel.messages.fetch(messageId).catch(() => null);
                            if (targetMessage) break;
                        }
                    }
                    if (targetMessage) {
                        const botReaction = targetMessage.reactions.cache.get(emojiId);
                        if (botReaction && botReaction.me) {
                            await botReaction.users.remove(interaction.client.user.id);
                        }
                    }
                } catch (reactError) {
                    console.warn("Could not remove bot's reaction:", reactError);
                }

                await interaction.editReply({ content: `[OK] The rule (and my reaction) for ${emoji} on message \`${messageId}\` has been removed.` });
            }
        } catch (error) {
            console.error("Error in setup-reaction-role:", error);
            await interaction.editReply({ content: "[!] A fatal error occurred. Please check the console." });
        }
    }
};