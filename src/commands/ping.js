const { SlashCommandBuilder } = require('discord.js');
const { TextDisplayBuilder, MessageFlags } = require('../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction) {
    await interaction.reply({
      body: new TextDisplayBuilder('Pong!'),
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
