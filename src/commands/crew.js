const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../db/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crew')
        .setDescription('View and manage your crew.'),
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

            const characterResult = await client.query('SELECT id FROM characters WHERE player_id = $1', [playerId]);
            if (characterResult.rows.length === 0) {
                await interaction.reply({ content: 'You have not created a character yet. Use `/character-create` to begin!', ephemeral: true });
                return;
            }
            const characterId = characterResult.rows[0].id;

            const crewResult = await client.query(
                `SELECT c.name, c.description
                 FROM crews c
                 JOIN character_crew cc ON c.id = cc.crew_id
                 WHERE cc.character_id = $1`,
                [characterId]
            );

            const embed = new EmbedBuilder()
                .setTitle('Your Crew')
                .setColor(0x0099FF)
                .setTimestamp();

            if (crewResult.rows.length === 0) {
                embed.setDescription('You have no crew members yet. Progress through the story to recruit allies!');
            } else {
                const crewList = crewResult.rows.map(c => `**${c.name}**\n*${c.description}*`).join('\n\n');
                embed.setDescription(crewList);
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching crew data:', error);
            await interaction.reply({ content: 'There was an error fetching your crew information.', ephemeral: true });
        } finally {
            client.release();
        }
    },
};
