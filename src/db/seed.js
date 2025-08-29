require('dotenv').config();
const { pool } = require('./database');

const quests = [
    // --- Marine Recruit (Shells Town) ---
    {
        title: 'The Tyrant of Shells Town',
        description: 'A sympathetic Marine officer has tasked you with investigating the corrupt Captain Morgan. Find evidence of his tyranny and expose him.',
        arc: 'Romance Dawn Arc',
        saga: 'East Blue Saga',
        quest_type: 'Main Story'
    },
    // --- Pirate Hopeful (Syrup Village) ---
    {
        title: 'A Ship of Dreams',
        description: 'To become a true pirate, you need a ship. Prove your worth to the local pirate crew in Syrup Village to earn your vessel and fend off a looming threat.',
        arc: 'Romance Dawn Arc',
        saga: 'East Blue Saga',
        quest_type: 'Main Story'
    },
    // --- Revolutionary Seed (Ohara) ---
    {
        title: 'The Scholar\'s Legacy',
        description: 'Find a hidden message left behind by a scholar of Ohara. It is said to contain details of a government cover-up. Avoid the watchful eyes of the Marines.',
        arc: 'Romance Dawn Arc',
        saga: 'East Blue Saga',
        quest_type: 'Main Story'
    },
    // --- Neutral (Baratie) ---
    {
        title: 'The Battle for the Baratie',
        description: 'The Krieg Pirates are attacking the sea-faring restaurant, the Baratie. Aid the chefs and defend the restaurant from the pirate onslaught.',
        arc: 'Romance Dawn Arc',
        saga: 'East Blue Saga',
        quest_type: 'Main Story'
    }
];

const seedQuests = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('Seeding quests...');

        // Clear existing quests to avoid duplicates
        await client.query('DELETE FROM quests');

        for (const quest of quests) {
            const query = 'INSERT INTO quests (title, description, arc, saga, quest_type) VALUES ($1, $2, $3, $4, $5)';
            const values = [quest.title, quest.description, quest.arc, quest.saga, quest.quest_type];
            await client.query(query, values);
        }

        await client.query('COMMIT');
        console.log('Quests seeded successfully!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error seeding quests:', error);
    } finally {
        client.release();
        pool.end();
    }
};

seedQuests();
