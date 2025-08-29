require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

console.log('Starting command deployment...');
console.log('BOT_TOKEN exists:', !!process.env.BOT_TOKEN);
console.log('CLIENT_ID exists:', !!process.env.CLIENT_ID);

if (!process.env.BOT_TOKEN) {
  console.error('BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

if (!process.env.CLIENT_ID) {
  console.error('CLIENT_ID is not set in environment variables');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'src/commands');

// Check if commands directory exists
if (!fs.existsSync(commandsPath)) {
  console.error('Commands directory does not exist:', commandsPath);
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
console.log('Found command files:', commandFiles);

for (const file of commandFiles) {
  try {
    const command = require(`./src/commands/${file}`);
    if (command.data && command.data.toJSON) {
      commands.push(command.data.toJSON());
      console.log(`Loaded command: ${command.data.name}`);
    } else {
      console.warn(`Command ${file} is missing data or toJSON method`);
    }
  } catch (error) {
    console.error(`Error loading command ${file}:`, error);
  }
}

console.log(`Total commands to deploy: ${commands.length}`);

const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        // The put method is used to fully refresh all global commands with the current set.
        // Global commands may take up to an hour to update.
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        
        // List the deployed commands
        data.forEach(command => {
          console.log(`- ${command.name}: ${command.description}`);
        });
        
    } catch (error) {
        console.error('Error deploying commands:', error);
        
        if (error.code === 50001) {
          console.error('Missing Access - Check if your bot has the applications.commands scope');
        } else if (error.code === 10013) {
          console.error('Unknown Application - Check your CLIENT_ID');
        } else if (error.status === 401) {
          console.error('Unauthorized - Check your BOT_TOKEN');
        }
        
        process.exit(1);
    }
})();
