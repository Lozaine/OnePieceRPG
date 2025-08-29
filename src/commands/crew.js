const { SlashCommandBuilder } = require('discord.js');
const { pool } = require('../db/database');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  MessageFlags,
} = require('../utils/constants');

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

      const container = new ContainerBuilder().addChild(
        new TextDisplayBuilder('**Your Crew**').setHeadingLevel(2)
      );

      if (crewResult.rows.length === 0) {
        container.addChild(
          new TextDisplayBuilder('You have no crew members yet. Progress through the story to recruit allies!')
        );
      } else {
        const crewSections = crewResult.rows.map(crewMember => {
          return new SectionBuilder()
            .addChild(new TextDisplayBuilder(`**${crewMember.name}**`))
            .addChild(new TextDisplayBuilder(`*${crewMember.description}*`));
        });
        container.addChildren(...crewSections);
      }

      await interaction.reply({
        body: container,
        flags: MessageFlags.IsComponentsV2,
      });

    } catch (error) {
      console.error('Error fetching crew data:', error);
      await interaction.reply({ content: 'There was an error fetching your crew information.', ephemeral: true });
    } finally {
      client.release();
    }
  },
};
