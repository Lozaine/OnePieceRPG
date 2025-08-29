const { SlashCommandBuilder } = require('discord.js');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  MessageFlags,
} = require('../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get information about the bot and its commands.'),
  async execute(interaction) {
    const helpContainer = new ContainerBuilder()
      .addChild(
        new TextDisplayBuilder().setContent('**Welcome to the One Piece RPG!**').setHeadingLevel(1)
      )
      .addChild(
        new TextDisplayBuilder('This bot allows you to embark on your own adventure in the world of One Piece. Create a character, complete quests, and become a legend!')
      )
      .addChild(
        new SectionBuilder()
          .addChild(new TextDisplayBuilder().setContent('**Getting Started**').setHeadingLevel(3))
          .addChild(new TextDisplayBuilder('Your first step is to create your character. Use the `/character-create` command to begin your journey.'))
      )
      .addChild(
        new SectionBuilder()
          .addChild(new TextDisplayBuilder().setContent('**Core Commands**').setHeadingLevel(3))
          .addChild(new TextDisplayBuilder(
            '`/character-create`: Create your unique character.\n' +
            '`/quests`: View your current quests.\n' +
            '`/island`: Get information about your current location.\n' +
            '`/map`: View the map of the East Blue.\n' +
            '`/crew`: Check on your crew members.\n' +
            '`/help`: Shows this help message.'
          ))
      )
      .addChild(
        new TextDisplayBuilder('*Fair winds and following seas!*')
      );

    await interaction.reply({
      body: helpContainer,
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
