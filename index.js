'use strict'

console.log('Starting Bot...')

require('dotenv').config();
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { 
    Client, Intents, MessageEmbed,
    Collection, Permissions, 
} = require('discord.js');
const createCaptcha = require('./captcha/captcha.js');
const mongoose = require('mongoose');
const fs = require('node:fs');
const path = require('node:path');
const hasModRoles = require('./util/hasModRoles.js');
const client = new Client({
    intents: [ // Uses for the Bot //
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILDS,
    ], partials: [ // Places the bot can reach //
        'CHANNEL',
        'GUILD_MEMBER',
        'GUILD_SCHEDULED_EVENT',
        'MESSAGE',
        'REACTION',
        'USER'
    ]
});

client.commands = new Collection();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const clientID = process.env.CLIENTID;

const doingCaptcha = [];

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	commands.push(command.data.toJSON());
}

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

const clientId = '123456789012345678';
const guildId = '876543210987654321';

// for (const file of commandFiles) {
// 	const command = require(`./commands/${file}`);
// 	commands.push(command.data.toJSON());
// }

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
	try {
		console.log('├── Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(clientID, process.env.GUILDID),
			{ body: commands },
		);

		console.log('├── Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();

client.once('ready', () => {
    console.log('└── Connected to discord.');
    console.log('App Logs:')
});

client.on('interactionCreate', async (interaction) => {
    const command = client.commands.get(interaction.commandName);
    if (!interaction.isCommand) return;
    else if (interaction.channel.id == '980860670390190082') await interaction.reply({ content: "You can't do / commands here.", ephemeral: true });
    else if (!command) return;
    else {
        try {
            await command.execute(interaction, client, mongoose);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }

        console.log(`${interaction.user.tag} use the command "${interaction.commandName}"`)
    }
});

client.on('messageCreate', async (message) => {

    let messageContent = message.content.toLowerCase()

    if (message.author.bot === true) return;
    else if (message.channel.id == '980860670390190082') {
        let readySplitContent = message.content.split('ready');

        if (hasModRoles("m", message) == true) return;
        else if (readySplitContent.length == 2) {
            message.delete()

            // * // Captcha Stuff //
            // * Tutorial to get it working by: Anson the Developer (Jimp/Captcha)
            // * With help from people from the Discord.js Server
            // * 
            // * If you want to fully understand how this code works,
            // * I would recommend watching the video Anson The
            // * Developer made when they made this code.
            // * 
            // * I only messed around with part of the code for it to
            // * fit the needs of my server.

            if (!doingCaptcha.includes(message.author.id)) {
                doingCaptcha.push(message.author.id);
                const captcha = await createCaptcha();

                try {
                    let doCaptcha = true
                    let captchaEmbed = new MessageEmbed();
                    let beginningEmbed = new MessageEmbed()
                    beginningEmbed.setTitle("You will have 1 minute to complete this captcha. Do this by resending the text you see bellow.")
                    beginningEmbed.setDescription("Don't forget it's CaSe SeNsItIvE!")
                    beginningEmbed.setImage(`attachment://${captcha}.png`)
                    beginningEmbed.setColor('BLUE')
                    setTimeout(() => message.author.send({ embeds: [beginningEmbed], files: [`./captcha/captchas/${captcha}.png`] }).catch((e) => {
                        console.log(`${message.author.tag} forgot to allow DM's`)
                        fs.unlink(`./captcha/captchas/${captcha}.png`, (err) => { if (err) throw err })
                        doCaptcha = false
                    }).then(async () => {
                        if (doCaptcha == true) {
                            console.log(`${message.author.tag} is doing the CAPTCHA.`)
                            try {
                                const filter = (msg) => {
                                    if (msg.author.bot) return
                                    if (msg.author.id == message.author.id && msg.content === captcha) {
                                        return true
                                    } else {
                                        captchaEmbed.setTitle(`You have answered the captcha incorrectly.`)
                                        captchaEmbed.setColor("RED")
                                        msg.author.send({ embeds: [captchaEmbed] })
                                        return false;
                                    }
                                }

                                await message.author.createDM();
                                const response = await message.author.dmChannel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] })
                                if (response) {
                                    captchaEmbed.setTitle(`You have answered the captcha correctly.`)
                                    captchaEmbed.setDescription(`Welcome to the server, ${message.author}!`)
                                    captchaEmbed.setColor("GREEN")
                                    message.author.send({ embeds: [captchaEmbed] })
                                    client.guilds.cache.get(process.env.GUILDID).members.cache.get(message.author.id).roles.add(process.env.MEMBERSID)
                                    doingCaptcha.splice(doingCaptcha.indexOf(message.author.id), 1)
                                    console.log(`${message.author.tag} successfully completed the CAPTCHA.`)

                                    let welcomeEmbed = new MessageEmbed();
                                    welcomeEmbed.setDescription(`Please welcome ${message.author} to the server!`)
                                    welcomeEmbed.setColor('GREEN')
                                    client.guilds.cache.get(process.env.GUILDID).channels.cache.get('980850845497307206').send({ embeds: [welcomeEmbed] })
                                }
                            } catch (e) {
                                if (e != 'Collection(0) [Map] {}') console.error(e);
                                captchaEmbed.setTitle(`You did not complete the captcha fast enough.`)
                                captchaEmbed.setColor("RED")
                                await message.author.send({ embeds: [captchaEmbed] })
                                doingCaptcha.splice(doingCaptcha.indexOf(message.author.id), 1)
                                await console.log(`${message.author.tag} failed the CAPTCHA.`)
                            }
                        } else {
                            doingCaptcha.splice(doingCaptcha.indexOf(message.author.id), 1)
                        }
                    }), 500)
                } catch (e) {
                    console.error(e)
                }
            }
        } else {
            message.delete()
        }
    }
})

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("├── Connected to the MongoDB Database.");
    client.login(process.env.TOKEN).catch((err) => {
        console.log("└── Failed to connect to Discord.");
        console.error(err);
    });
}).catch((err) => {
    console.log("└── Failed to connect to the MongoDB Database.");
    console.error(err);
    process.exit(1);
});