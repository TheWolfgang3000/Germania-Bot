// inventory-commands.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('./db-manager.js');
const { embedColor } = require('./config.json');

function generateInventoryPage({ page, user, guild }) {
    const inventory = db.getUserInventory(user.id);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(inventory.length / itemsPerPage) || 1;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentItems = inventory.slice(start, end);

    const invEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(`🎒 ${user.username}'s Inventory`)
        .setFooter({ text: `Page ${page} of ${totalPages}` });

    if (inventory.length === 0) {
        invEmbed.setDescription("Your inventory is empty.");
    }

    const components = [];
    
    // *** HIER WERDEN DIE BUTTONS NEU ZUSAMMENGESETZT ***
    const navigationRow = new ActionRowBuilder();
    // 1. Der "Zurück zum Profil" Button
    navigationRow.addComponents(
        new ButtonBuilder().setCustomId(`profile_main_${user.id}`).setLabel('⬅️ Back to Profile').setStyle(ButtonStyle.Secondary)
    );
    // 2. Paginierungs-Buttons (falls nötig)
    if (totalPages > 1) {
        navigationRow.addComponents(
            new ButtonBuilder().setCustomId(`inv_prev_${user.id}`).setLabel('<<').setStyle(ButtonStyle.Primary).setDisabled(page === 1),
            new ButtonBuilder().setCustomId(`inv_next_${user.id}`).setLabel('>>').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages)
        );
    }
    // 3. Der "Gehe zum Shop" Button
    navigationRow.addComponents(
        new ButtonBuilder().setCustomId(`inventory_shop_${user.id}`).setLabel('🛒 Go to Shop').setStyle(ButtonStyle.Success)
    );
    components.push(navigationRow);

    for (const item of currentItems) {
        invEmbed.addFields({
            name: `🎨 ${item.name}`,
            value: `*${item.description}*\nType: \`${item.type}\` | Purchased: <t:${Math.floor(item.purchase_date / 1000)}:R>`
        });
        if (item.type === 'THEME') {
            const equipRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`equip_${user.id}_${item.item_id}`).setLabel(`Equip "${item.name}"`).setStyle(ButtonStyle.Success)
            );
            components.push(equipRow);
        }
    }
    
    return { embeds: [invEmbed], components };
}

/**
 * Handler für den !inventory Befehl.
 */
async function handleInventoryCommand(message, client) {
    const user = message.mentions.users.first() || message.author;
    const inventory = db.getUserInventory(user.id);

    if (!inventory || inventory.length === 0) {
        return message.channel.send({ content: "Your inventory is empty. Visit the `!shop` to get some items!" });
    }
    
    const totalPages = Math.ceil(inventory.length / 5) || 1;
    const initialPage = generateInventoryPage({ page: 1, user, guild: message.guild });
    const invMessage = await message.channel.send(initialPage);

    if (totalPages <= 1) return;

    client.collectors.set(invMessage.id, {
        currentPage: 1,
        totalPages,
        originalAuthorId: message.author.id,
        generatePage: (page) => generateInventoryPage({ page, user, guild: message.guild })
    });
}

// DER WICHTIGSTE TEIL: Die Funktionen exportieren
module.exports = {
    handleInventoryCommand,
    generateInventoryPage, // Wichtig für das Profil-Modul
};