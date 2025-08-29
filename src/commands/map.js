const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../db/database');

// A simple representation of the East Blue map
const eastBlueMap = `
      N
      |
W --- O --- E
      |
      S

[Loguetown]
    ^
    |
[Arlong Park]--[Syrup Village]
    ^              ^
    |              |
[Baratie] ---- [Orange Town]
                   ^
                   |
             [Shells Town]
`;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('map')
        .setDescription('View the world map and your current location.'),
    async execute(interaction) {
        const discord_id = interaction.user.id;
        const client = await pool.connect();

        try {
            const playerResult = await client.query('SELECT id FROM players WHERE discord_id = $1', [discord_id]);
            if (playerResult.rows.length === 0) {
                await interaction.reply({ content: 'You have not started your adventure yet. Use `/character-create` to begin!', ephemeral: true });
                return;
            }
            const playerId = playerResult.rows[0].id;

            const characterResult = await client.query('SELECT current_location FROM characters WHERE player_id = $1', [playerId]);
            if (characterResult.rows.length === 0) {
                await interaction.reply({ content: 'You have not created a character yet. Use `/character-create` to begin!', ephemeral: true });
                return;
            }
            const location = characterResult.rows[0].current_location;

            const embed = new EmbedBuilder()
                .setTitle('East Blue Map')
                .setDescription('A chart of the calmest of the four seas.')
                .addFields({ name: 'Map', value: `\`\`\`${eastBlueMap}\`\`\`` })
                .addFields({ name: 'Your Location', value: `You are currently at **${location}**.` })
                .setColor(0x0099FF)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching map data:', error);
            await interaction.reply({ content: 'There was an error fetching map information.', ephemeral: true });
        } finally {
            client.release();
        }
    },
};
