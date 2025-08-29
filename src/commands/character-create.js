const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');
const { pool } = require('../db/database');

// --- Character Creation Options ---
const races = [
    { label: 'Human', value: 'Human', description: '+1 to all stats. 10% more XP.' },
    { label: 'Fish-Man / Mermaid', value: 'Fish-Man', description: '+2 Str, +1 Dur. Water Breathing.' },
    { label: 'Mink', value: 'Mink', description: '+2 Agi, +1 Str. Electro ability.' },
    { label: 'Skypiean', value: 'Skypiean', description: '+2 Int, +1 Agi. Sky-Dweller ability.' },
    { label: 'Giant', value: 'Giant', description: '+4 Str, +2 Dur, -2 Agi. Giant\'s Strength.' },
];

const origins = [
    { label: 'Shells Town - Marine Recruit', value: 'Shells Town', description: 'Start your journey as a Marine.' },
    { label: 'Syrup Village - Pirate Hopeful', value: 'Syrup Village', description: 'Begin your adventure as a pirate.' },
    { label: 'Ohara - Revolutionary Seed', value: 'Ohara', description: 'Uncover secrets as a Revolutionary.' },
    { label: 'Baratie - Neutral', value: 'Baratie', description: 'A neutral start as a cook or brawler.' },
];

const dreams = [
    { label: 'World\'s Greatest Swordsman', value: 'Swordsman', description: 'Start with a Katana and a sword skill.' },
    { label: 'Find the All Blue', value: 'All Blue', description: 'Start with cooking recipes and crafting bonus.' },
    { label: 'Map the World', value: 'Navigator', description: 'Start with a Log Pose and find hidden locations.' },
    { label: 'Brave Warrior of the Sea', value: 'Warrior', description: 'Start with higher base health and a combat skill.' },
];


module.exports = {
    data: new SlashCommandBuilder()
        .setName('character-create')
        .setDescription('Create your character for the One Piece adventure!'),
    async execute(interaction) {
        const discord_id = interaction.user.id;

        // --- Check if user already has a character ---
        const client = await pool.connect();
        try {
            const playerCheck = await client.query('SELECT id FROM players WHERE discord_id = $1', [discord_id]);
            if (playerCheck.rows.length > 0) {
                const characterCheck = await client.query('SELECT id FROM characters WHERE player_id = $1', [playerCheck.rows[0].id]);
                if (characterCheck.rows.length > 0) {
                    await interaction.reply({ content: 'You have already created a character. You cannot create another one at this time.', ephemeral: true });
                    return;
                }
            }

            // --- Step 1: Race Selection ---
            const raceSelect = new StringSelectMenuBuilder()
                .setCustomId('race_select')
                .setPlaceholder('Choose your race...')
                .addOptions(races);

            const row = new ActionRowBuilder().addComponents(raceSelect);

            const reply = await interaction.reply({
                content: 'Welcome to the world of One Piece! Let\'s begin your story. First, choose your race:',
                components: [row],
                ephemeral: true,
            });

            // --- Collector for interactions ---
            const collector = reply.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id,
                time: 60000, // 60 seconds
            });

            const characterData = {};

            collector.on('collect', async i => {
                if (i.isStringSelectMenu()) {
                    if (i.customId === 'race_select') {
                        characterData.race = i.values[0];

                        const originSelect = new StringSelectMenuBuilder()
                            .setCustomId('origin_select')
                            .setPlaceholder('Choose your origin...')
                            .addOptions(origins);
                        const row = new ActionRowBuilder().addComponents(originSelect);

                        await i.editReply({
                            content: `You have chosen **${characterData.race}**. Now, where does your story begin?`,
                            components: [row]
                        });
                    } else if (i.customId === 'origin_select') {
                        characterData.origin = i.values[0];

                        const dreamSelect = new StringSelectMenuBuilder()
                            .setCustomId('dream_select')
                            .setPlaceholder('What is your ultimate dream?')
                            .addOptions(dreams);
                        const row = new ActionRowBuilder().addComponents(dreamSelect);

                        await i.editReply({
                            content: `An origin in **${characterData.origin}**. A fateful choice. Finally, what is the dream that drives you?`,
                            components: [row]
                        });
                    } else if (i.customId === 'dream_select') {
                        characterData.dream = i.values[0];

                        const modal = new ModalBuilder()
                            .setCustomId('name_modal')
                            .setTitle('Choose Your Character\'s Name');

                        const nameInput = new TextInputBuilder()
                            .setCustomId('character_name')
                            .setLabel("What is your character's name?")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true);

                        modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
                        await i.showModal(modal);

                        const submitted = await i.awaitModalSubmit({
                            time: 60000,
                            filter: m => m.user.id === i.user.id,
                        }).catch(error => {
                            // Occurs when the modal times out
                            i.editReply({ content: 'Character creation timed out.', components: [] }).catch(console.error);
                            return null;
                        });

                        if (submitted) {
                            characterData.name = submitted.fields.getTextInputValue('character_name');

                            const summary = `**Review Your Character:**\n` +
                                          `- **Name:** ${characterData.name}\n` +
                                          `- **Race:** ${characterData.race}\n` +
                                          `- **Origin:** ${characterData.origin}\n` +
                                          `- **Dream:** ${dreams.find(d => d.value === characterData.dream).label}\n\n` +
                                          `Is this correct?`;

                            const confirmButton = new ButtonBuilder()
                                .setCustomId('confirm_creation')
                                .setLabel('Confirm')
                                .setStyle(ButtonStyle.Success);

                            const cancelButton = new ButtonBuilder()
                                .setCustomId('cancel_creation')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Danger);

                            const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

                            // Acknowledge the modal submission and update the message
                            await submitted.update({ content: summary, components: [row] });
                        }
                    }
                } else if (i.isButton()) {
                    if (i.customId === 'confirm_creation') {
                        const dbClient = await pool.connect();
                        try {
                            await dbClient.query('BEGIN');

                            // Find or create player
                            let playerResult = await dbClient.query('SELECT id FROM players WHERE discord_id = $1', [discord_id]);
                            let playerId;
                            if (playerResult.rows.length === 0) {
                                playerResult = await dbClient.query('INSERT INTO players (discord_id) VALUES ($1) RETURNING id', [discord_id]);
                            }
                            playerId = playerResult.rows[0].id;

                            // Base stats
                            let stats = { str: 1, agi: 1, dur: 1, int: 1 };
                            // Apply racial bonuses
                            switch (characterData.race) {
                                case 'Human': stats = { str: 2, agi: 2, dur: 2, int: 2 }; break;
                                case 'Fish-Man': stats = { str: 3, agi: 1, dur: 2, int: 1 }; break;
                                case 'Mink': stats = { str: 2, agi: 3, dur: 1, int: 1 }; break;
                                case 'Skypiean': stats = { str: 1, agi: 2, dur: 1, int: 3 }; break;
                                case 'Giant': stats = { str: 5, agi: -1, dur: 3, int: 1 }; break;
                            }

                            // Insert character
                            const characterQuery = 'INSERT INTO characters (player_id, name, race, origin, dream, current_location, strength, agility, durability, intelligence) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *';
                            const characterValues = [playerId, characterData.name, characterData.race, characterData.origin, characterData.dream, characterData.origin, stats.str, stats.agi, stats.dur, stats.int];
                            const newCharacter = await dbClient.query(characterQuery, characterValues);
                            const characterId = newCharacter.rows[0].id;

                            // --- Assign Initial Quest ---
                            const originQuestMap = {
                                'Shells Town': 'The Tyrant of Shells Town',
                                'Syrup Village': 'A Ship of Dreams',
                                'Ohara': 'The Scholar\'s Legacy',
                                'Baratie': 'The Battle for the Baratie'
                            };
                            const questTitle = originQuestMap[characterData.origin];
                            if (questTitle) {
                                const questResult = await dbClient.query('SELECT id FROM quests WHERE title = $1', [questTitle]);
                                if (questResult.rows.length > 0) {
                                    const questId = questResult.rows[0].id;
                                    await dbClient.query(
                                        'INSERT INTO character_quests (character_id, quest_id, status) VALUES ($1, $2, $3)',
                                        [characterId, questId, 'In Progress']
                                    );
                                }
                            }

                            await dbClient.query('COMMIT');
                            const successMessage = `Welcome, **${characterData.name}**! Your adventure in the world of One Piece begins now! Your journey starts in **${characterData.origin}**. May you achieve your dream of becoming the **${characterData.dream}**!\n\n**New Quest Started:** ${questTitle}`;
                            await i.update({ content: successMessage, components: [] });
                            collector.stop();

                        } catch (err) {
                            await dbClient.query('ROLLBACK');
                            console.error('Error during final character creation:', err);
                            await i.update({ content: 'There was a database error. Please try again.', components: [] });
                        } finally {
                            dbClient.release();
                        }
                    } else if (i.customId === 'cancel_creation') {
                        await i.update({ content: 'Character creation cancelled.', components: [] });
                        collector.stop();
                    }
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: 'Character creation timed out.', components: [] });
                }
            });

        } catch (error) {
            console.error('Error during character creation:', error);
            await interaction.reply({ content: 'An error occurred while trying to create your character. Please try again later.', ephemeral: true });
        } finally {
            client.release();
        }
    },
};
