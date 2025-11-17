// commands/setup-shop.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const db = require('../db-manager.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-shop')
        .setDescription('[Admin] Adds an item to the shop.')
        .addStringOption(option => option.setName('item-id').setDescription('A unique ID for the item (e.g., "theme_blue").').setRequired(true))
        .addStringOption(option => option.setName('name').setDescription('The name of the item (e.g., "Blue Theme").').setRequired(true))
        .addIntegerOption(option => option.setName('price').setDescription('The price in points.').setRequired(true))
        .addStringOption(option => option.setName('type').setDescription('Item type (e.g., THEME, BANNER).').setRequired(true))
        .addStringOption(option => option.setName('description').setDescription('A short description for the item.').setRequired(true))
        .addStringOption(option => option.setName('data').setDescription('Optional data (e.g., hex color #0000FF or image URL).').setRequired(false))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    
    async execute(interaction) {
        // Logic from handleAddShopItem
        
        const itemId = interaction.options.getString('item-id');
        const name = interaction.options.getString('name');
        const price = interaction.options.getInteger('price');
        const type = interaction.options.getString('type').toUpperCase();
        const description = interaction.options.getString('description');
        const data = interaction.options.getString('data'); // Can be null

        const result = db.addShopItem({ itemId, name, description, price, type, data });

        if (result.success) {
            await interaction.reply({ content: `[OK] Shop item "${name}" was successfully added/updated.`, ephemeral: true });
        } else {
            console.error("Error adding shop item:", result.error);
            await interaction.reply({ content: `[ERROR] Could not add item to the shop. Check console for details.`, ephemeral: true });
        }
    }
};