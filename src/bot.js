require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { testConnection } = require('./db/database');

console.log('Starting bot...');
console.log('BOT_TOKEN exists:', !!process.env.BOT_TOKEN);
console.log('CLIENT_ID exists:', !!process.env.CLIENT_ID);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

// Check if commands directory exists
if (!fs.existsSync(commandsPath)) {
  console.error('Commands directory does not exist:', commandsPath);
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
console.log('Found command files:', commandFiles);

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  try {
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`Loaded command: ${command.data.name}`);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  } catch (error) {
    console.error(`Error loading command ${file}:`, error);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`Bot is in ${client.guilds.cache.size} guilds`);
  
  try {
    await testConnection();
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
});

client.on('interactionCreate', async interaction => {
  console.log('Interaction received:', interaction.type, interaction.commandName || 'No command');
  
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    console.log(`Executing command: ${interaction.commandName}`);
    await command.execute(interaction);
    console.log(`Command ${interaction.commandName} executed successfully`);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    } catch (replyError) {
      console.error('Error sending error message:', replyError);
    }
  }
});

client.on('error', error => {
  console.error('Discord client error:', error);
});

client.on('warn', warning => {
  console.warn('Discord client warning:', warning);
});

client.login(process.env.BOT_TOKEN).catch(error => {
  console.error('Failed to login:', error);
  process.exit(1);
});
