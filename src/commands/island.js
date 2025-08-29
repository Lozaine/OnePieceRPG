const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../db/database');

const islandData = {
    'Shells Town': {
        description: 'A town under the tyrannical rule of Captain "Axe-Hand" Morgan. The Marine base is the most prominent feature.',
        locations: 'Marine Base, Tavern, Docks',
        npcs: 'Captain Morgan, Helmeppo, Coby',
        quests: 'Expose Captain Morgan\'s corruption.'
    },
    'Syrup Village': {
        description: 'A quiet village on the Gecko Islands. It is known for being the hometown of Usopp.',
        locations: 'Mansion on the Hill, Shipyard, Slopes',
        npcs: 'Kaya, Usopp, Merry',
        quests: 'Acquire a ship and defend against pirates.'
    },
    'Ohara': {
        description: 'The ruins of the island of scholars, destroyed by a Buster Call. It is a sad and desolate place.',
        locations: 'Tree of Knowledge (Ruins), Clandestine Camp',
        npcs: 'Mysterious Informant',
        quests: 'Find the hidden message left by a scholar.'
    },
    'Baratie': {
        description: 'A floating restaurant in the middle of the sea. A haven for cooks and fighters.',
        locations: 'Kitchen, Deck, Sanji\'s Quarters',
        npcs: 'Zeff, Sanji, Patty',
        quests: 'Aid the chefs against the Krieg Pirates.'
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('island')
        .setDescription('View details about your current island.'),
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
            const data = islandData[location];

            if (!data) {
                await interaction.reply({ content: `You are in an unknown location: ${location}. How did you get here?`, ephemeral: true });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(location)
                .setDescription(data.description)
                .addFields(
                    { name: 'Key Locations', value: data.locations },
                    { name: 'Notable Figures', value: data.npcs },
                    { name: 'Available Quests', value: data.quests }
                )
                .setColor(0x0099FF)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching island data:', error);
            await interaction.reply({ content: 'There was an error fetching island information.', ephemeral: true });
        } finally {
            client.release();
        }
    },
};
