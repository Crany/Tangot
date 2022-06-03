const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
	    .setName('echo')
	    .setDescription('Replies with your input!')
	    .addStringOption((option) =>
		    option.setName('input')
			.setDescription('The input to echo back')
			.setRequired(true)
        ),
    async execute(interaction, client, mongoose) {
		let testEmbed = new MessageEmbed()
		.setColor('GREEN')
		.setDescription(`Echo-ed: \`${interaction.options.getString('input')}\``)
        return await interaction.reply({ embeds: [testEmbed] })
    }
}