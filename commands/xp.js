const Discord = require("discord.js");
const MysqlConnector = require("../src/mysqlConnector");

/**
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 * @param {Array<String>} arguments
 */

module.exports.run = async (client, message, arguments) => {
  const embed = new Discord.MessageEmbed();
  const xp = await MysqlConnector.executeQuery(
    "SELECT xp_count FROM xp WHERE user_id = " + message.author.id
  ).then((res) => res[0].xp_count);
  embed.setDescription("XP: " + xp.toString());
  await message.channel.send({ embeds: [embed] });
};

module.exports.name = "xp";
