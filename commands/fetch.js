const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const mongoose = require('mongoose')
const reportDB = require('../models/report.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fetch')
        .setDescription("Fetches details of a given matter.")
        .addSubcommandGroup(sub =>
            sub.setName('reports')
            .setDescription('Fetches details of a given report')
            .addSubcommand(sub =>
                sub.setName('user')
                .setDescription('Fetches via mention.')
                .addUserOption(options =>
                    options.setName('user')
                    .setDescription('The reported User')
                    .setRequired(true)
                )
            ).addSubcommand(sub =>
                sub.setName('id')
                .setDescription('Fetches via Report ID')
                .addStringOption(options =>
                    options.setName('id')
                    .setDescription('The ID of the Report')
                    .setRequired(true)
                )
            )
        ),
    async execute(interaction, client, mongoose) {
        const hasModRoles = require("../util/hasModRoles");
        let subCommandGroup = interaction.options.getSubcommandGroup();
        let subCommand      = interaction.options.getSubcommand()

        if (subCommandGroup === 'reports') {

            if (hasModRoles('i', interaction) == false) {
                await interaction.reply({ embeds: [
                    new MessageEmbed()
                    .setDescription("You have to be a Moderator to do this action.")
                    .setColor('FFBF00')
                ], ephemeral: true })
            } else {
                if (subCommandGroup == 'reports') {
                    await interaction.reply(`${client.guilds.cache.get('980839689609150545').members.cache.get(client.user.id).nickname} is thinking...`)
                    
                    let user = interaction.options.getMember('user');
                    let identifier = interaction.options.getString('id');
                    if (user != null) user = user.user;
                    if (identifier != null) identifier = identifier.toLowerCase();
                    let reportFetch = []; // Clear results //
                    let reportFetchResult = []; // MongoDB Results //
                    
                    if (subCommand == 'user') {
                        reportDB.find({}, (err, result) => {
                            reportFetchResult = result;
                        }).clone().then(() => {
                            setTimeout(() => {
                                for (let i = 0; i != reportFetchResult.length; i++) { if (reportFetchResult[i]["reportedTag"] == user.tag) reportFetch.push(reportFetchResult[i]) }
                            }, 1000)
                        });
                    } else if (subCommand == 'id') {
                        reportDB.find({}, (err, result) => {
                            reportFetchResult = result;
                        }).clone().then(() => {
                            setTimeout(() => {
                                for (let i = 0; i != reportFetchResult.length; i++) { if (reportFetchResult[i]["identifier"] == identifier) reportFetch.push(reportFetchResult[i]) }
                            }, 1000)
                        });
                    }

                    setTimeout(async () => {

                        let resultEmbed = new MessageEmbed();

                        let query;

                        if (identifier != null) query = identifier;
                        else query = user.tag;

                        if (reportFetch.length == 0) {
                            resultEmbed.setDescription(`No result were returned for the query "${query}"`)
                            .setColor('FFBF00');
                            await interaction.editReply({ embeds: [resultEmbed] })
                        } else {
                            resultEmbed.setTitle(`This is what returned for the query: "${query}"`)
                            .setColor('GREEN');
                            for (let i = 0; i != reportFetch.length; i++) {
                                resultEmbed.addFields(
                                    { name: 'ID:', value: reportFetch[i]['identifier'], inline: true},
                                    { name: 'Reported:', value: reportFetch[i]['reportedTag'], inline: true},
                                    { name: 'Reason:', value: reportFetch[i]['reason'], inline: true},
                                )
                            }

                            await interaction.editReply({ embeds: [resultEmbed] })
                        }
                    }, 1500)
                }
            }
        }
    }
}