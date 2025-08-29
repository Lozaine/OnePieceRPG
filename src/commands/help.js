const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get information about the bot and its commands.'),
    async execute(interaction) {
        const helpEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Welcome to the One Piece RPG!')
            .setDescription('This bot allows you to embark on your own adventure in the world of One Piece. Create a character, complete quests, and become a legend!')
            .addFields(
                { name: 'Getting Started', value: 'Your first step is to create your character. Use the `/character-create` command to begin your journey.' },
                { name: 'Core Commands', value:
                    '`/character-create`: Create your unique character.\n' +
                    '`/quests`: View your current quests.\n' +
                    '`/island`: Get information about your current location.\n' +
                    '`/map`: View the map of the East Blue.\n' +
                    '`/crew`: Check on your crew members.\n' +
                    '`/help`: Shows this help message.'
                }
            )
            .setTimestamp()
            .setFooter({ text: 'Fair winds and following seas!' });

        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    },
};
