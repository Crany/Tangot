const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Message } = require('discord.js');
const hasModRoles = require('../util/hasModRoles');
const reportDB = require('../models/report.js')
const randomWords = require('random-words')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Reports a user.')
        .addUserOption((option) =>
            option.setName('reported')
            .setDescription('The member you want to report')
            .setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('reason')
            .setDescription('reason for the report')
            .setRequired(true)
        ),
    async execute(interaction, client, mongoose) {
        let reportedUser = interaction.options.getMember('reported').user;
        let reason = interaction.options.getString('reason');
        let informant = interaction.user
        let indentifier = `${randomWords()}.${randomWords()}.${randomWords()}`;

        let reportedEmbed = new MessageEmbed()
        let reportChannelEmbed = new MessageEmbed()

        console.log(informant.tag)

        if (reportedUser.bot) {
            reportedEmbed.setDescription("I can't report Bots.")
            .setColor('FFBF00');

            await interaction.reply({ embeds: [reportedEmbed] })
        } else if (informant.id === reportedUser.id) { 
            reportedEmbed.setDescription("You can't report yourself, silly!")
            .setColor('FFBF00');

            await interaction.reply({ embeds: [reportedEmbed] });
        } else {

            reportedEmbed.setTitle("Report Sent.")
            .setColor('GREEN')
            .setDescription(`Remember this ID: \`${indentifier}\``)
            await interaction.reply({ embeds: [reportedEmbed] })

            reportChannelEmbed.setTitle(`${reportedUser.tag} was reported.`)            
            .setColor('FFBF00')
            .addFields(
                { name: 'Reported:', value: reportedUser.tag, inline: true},
                { name: 'Reported By:', value: informant.tag, inline: true},
                { name: 'Reason:', value: reason, inline: true},
            )
            .setFooter(`ID: ${indentifier}`)
            client.channels.cache.get('982311311444680704').send({ embeds: [reportChannelEmbed] })


            const reportdb = new reportDB({
                _id: new mongoose.Types.ObjectId,
                reason: reason,
                reportedTag: reportedUser.tag,
                reportedID: reportedUser.id,
                informantTag: informant.tag,
                indentifier: indentifier
            })

            reportdb.save().catch();
        }

        
    }
}