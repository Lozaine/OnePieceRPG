const { SlashCommandBuilder } = require('discord.js');
const { pool } = require('../db/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quests')
        .setDescription('View your quest log.'),
    async execute(interaction) {
        const discord_id = interaction.user.id;
        const client = await pool.connect();

        try {
            // Find the character for the player
            const playerResult = await client.query('SELECT id FROM players WHERE discord_id = $1', [discord_id]);
            if (playerResult.rows.length === 0) {
                await interaction.reply({ content: 'You have not started your adventure yet. Use `/character-create` to begin!', ephemeral: true });
                return;
            }
            const playerId = playerResult.rows[0].id;

            const characterResult = await client.query('SELECT id FROM characters WHERE player_id = $1', [playerId]);
            if (characterResult.rows.length === 0) {
                await interaction.reply({ content: 'You have not created a character yet. Use `/character-create` to begin!', ephemeral: true });
                return;
            }
            const characterId = characterResult.rows[0].id;

            // Fetch quests for the character
            const questResult = await client.query(
                `SELECT q.title, q.description, cq.status
                 FROM quests q
                 JOIN character_quests cq ON q.id = cq.quest_id
                 WHERE cq.character_id = $1`,
                [characterId]
            );

            if (questResult.rows.length === 0) {
                await interaction.reply({ content: 'Your quest log is empty. Explore the world to find new adventures!', ephemeral: true });
                return;
            }

            // Format the quest log
            const questLog = questResult.rows.map(q => `**${q.title}** [${q.status}]\n*${q.description}*`).join('\n\n');

            await interaction.reply({ content: `**Your Quest Log**\n\n${questLog}`, ephemeral: true });

        } catch (error) {
            console.error('Error fetching quests:', error);
            await interaction.reply({ content: 'There was an error fetching your quest log.', ephemeral: true });
        } finally {
            client.release();
        }
    },
};
