require('dotenv').config();
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { 
    Client, Intents, MessageEmbed,
    Collection, Permissions, 
} = require('discord.js');
const createCaptcha = require('./captcha/captcha.js');
const fs = require('node:fs');
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

const modRoles = [
    '980849935643725864', // Owner
    '981657737291251722', // Moderator
    '980879699670626344', // Leader
    '980879536549924864', // Developer
    '981933858138255381', // Admin erms
]

const clientID = process.env.CLIENTID;

const doingCaptcha = [];

const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
];

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) { // Command Files //
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(clientID, process.env.GUILDID),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();

client.once('ready', () => {
    console.log('Tangot is ready.');
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand) return;
    else if (interaction.channel.id == '980860670390190082') return;
    else if (interaction.commandName == "ping") {
        await interaction.reply("Ping!");
    }
});

client.on('messageCreate', async (message) => {
    const hasModRoles = modRoles.some(roles => { // Checks if the message author has any Moderation roles //
        if (message.channel.type != 'DM') {
            return message.member.roles.cache.has(roles)
        }
    })

    if (message.author.bot === true) return;
    else if (message.channel.id == '980860670390190082') {
        if (hasModRoles) return;
        else if (message.content == 'ready') {
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

client.login(process.env.TOKEN);