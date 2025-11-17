// shop-commands.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('./db-manager.js');
const { embedColor } = require('./config.json');

function generateShopPage({ page, user, guild }) {
    const allItems = db.getShopItems();
    const itemsPerPage = 5;
    const totalPages = Math.ceil(allItems.length / itemsPerPage) || 1;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentItems = allItems.slice(start, end);

    const shopEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('🛒 Points Shop')
        .setDescription('Click the buttons below to purchase an item.')
        .setFooter({ text: `Page ${page} of ${totalPages} • Your Points: ${db.getUserData(guild.id, user.id).points}` });

    if (currentItems.length === 0) {
        shopEmbed.setDescription("There are no items on this page.");
    }

    for (const item of currentItems) {
        shopEmbed.addFields({
            name: `${item.name}`,
            value: `**Price:** ${item.price} Points\n*${item.description}*`,
            inline: true
        });
    }
    
    // Button-Reihe für Paginierung und Navigation
    const paginationRow = new ActionRowBuilder();
    
    // NEU: "Zurück zum Inventar" Button
    paginationRow.addComponents(
        new ButtonBuilder().setCustomId(`inventory_main_${user.id}`).setLabel('⬅️ Back to Inventory').setStyle(ButtonStyle.Secondary)
    );

    if (totalPages > 1) {
        paginationRow.addComponents(
            new ButtonBuilder().setCustomId(`shop_prev_${user.id}`).setLabel('<<').setStyle(ButtonStyle.Primary).setDisabled(page === 1),
            new ButtonBuilder().setCustomId(`shop_next_${user.id}`).setLabel('>>').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages)
        );
    }

    // Button-Reihe für Käufe
    const purchaseRow = new ActionRowBuilder();
    currentItems.forEach((item) => {
        const alreadyOwned = db.hasItem(user.id, item.item_id);
        purchaseRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`buy_${user.id}_${item.item_id}`)
                .setLabel(`Buy "${item.name}"`)
                .setStyle(alreadyOwned ? ButtonStyle.Secondary : ButtonStyle.Success)
                .setDisabled(alreadyOwned)
        );
    });

    const components = [paginationRow];
    if (purchaseRow.components.length > 0) {
        components.push(purchaseRow);
    }

    return { embeds: [shopEmbed], components };
};

// Handler für den !shop Befehl
async function handleShopCommand(message, client) {
    const user = message.author; // Der !shop Befehl ist immer für den Autor
    const allItems = db.getShopItems();
    if (!allItems || allItems.length === 0) {
        return message.channel.send({ content: "The shop is currently empty. Check back later!" });
    }

    const totalPages = Math.ceil(allItems.length / 5) || 1;
    const initialPage = generateShopPage({ page: 1, user, guild: message.guild });
    const shopMessage = await message.channel.send(initialPage);

    if (totalPages <= 1) return;

    client.collectors.set(shopMessage.id, {
        currentPage: 1,
        totalPages,
        originalAuthorId: user.id,
        generatePage: (page) => generateShopPage({ page, user, guild: message.guild })
    });
}

module.exports = {
    handleShopCommand,
    generateShopPage,
};