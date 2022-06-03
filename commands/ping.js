const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction, client, mongoose) {
        var ping = client.ws.ping; // Gets the ping of the bot //

        let pingEmbed = new MessageEmbed()
        .setTitle(`Pong! \`${ping}ms\``)
        
        if (ping >= "500") { // Terrible Connection //
            pingEmbed.setColor("RED");
            pingEmbed.setDescription(`Pong! \`${ping}ms\`\nSeems like we're experiencing some networking issues.`)
        } else if (ping >= "250") { // Degraded Connection //
            pingEmbed.setColor("FFBF00");
        } else if (ping < "250") { // Good Connection //
            pingEmbed.setColor("GREEN");
        }

        return await interaction.reply({ embeds: [pingEmbed] });
    }
}