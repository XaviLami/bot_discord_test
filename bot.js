require("dotenv").config();
const Discord = require("discord.js");
const axios = require("axios");
const commandLoader = require("./commandLoader");
const FormData = require("./node_modules/form-data");
const MysqlConnector = require("./src/mysqlConnector");

const bot = new Discord.Client({
  intents: ["GUILD_MESSAGES", "GUILDS", "GUILD_MEMBERS"],
});

const insulte = "";
MysqlConnector.connect();

const PREFIX = "$";
commandLoader.load(bot);
bot.on("guildMemberAdd", async (member) => {
  const role = await member.guild.roles.fetch("991626678050770975");
  await member.roles.add(role);
  member.send(
    "Welcome to the Best Server! The commands avaible it's : $xp for see your xp acount and $bonjour"
  );
});

bot.on("messageCreate", async (message) => {
  data = new FormData();
  data.append("text", `${message}`);
  data.append("lang", "fr,en");
  data.append("mode", "standard");
  data.append("api_user", process.env.API_USER_INSULTS);
  data.append("api_secret", process.env.API_KEY_INSULTS);

  axios({
    url: "https://api.sightengine.com/1.0/text/check.json",
    method: "post",
    data: data,
    headers: data.getHeaders(),
  })
    .then(function (response) {
      response.data.profanity.matches.forEach((e) => (this.insulte = e.match));
      if (this.insulte) {
        message.delete(message.content);
      }
    })
    .catch(function (error) {
      // handle error
      if (error.response) console.log(error.response.data);
      else console.log(error.message);
    });

  const userData = await MysqlConnector.executeQuery(
    "SELECT * FROM xp WHERE user_id = " + message.author.id
  );

  let userHasBeenModified = false;

  //Vérifier que l'id_user n'existe pas et l'ajoute si il n'existe pas
  if (userData.length === 0) {
    console.log("new user");
    MysqlConnector.executeQuery(
      `insert into xp(user_id,xp_count,xp_level) values ("${message.author.id}", "0","0")`
    );
  } else {
    const userLevel = userData[0].xp_level;
    const userXp = userData[0].xp_count;
    const maxXp = 3 + userLevel;
    console.log(userLevel, userXp, maxXp);
    if (userXp === maxXp - 1) {
      await MysqlConnector.executeQuery(
        "UPDATE xp SET xp_level = xp_level + 1, xp_count = 0 WHERE user_id = " +
          message.author.id
      );
      userHasBeenModified = true;
    }
  }

  if (userHasBeenModified === false) {
    await MysqlConnector.executeQuery(
      `UPDATE xp SET xp_count = xp_count + 1 WHERE user_id = ${message.author.id}`
    );
  }

  if (message.content.startsWith(PREFIX)) {
    let word = message.content.split(" ");
    const commandName = word.shift().slice(1);
    const argument = word;

    if (bot.commands.has(commandName)) {
      // La commande existe, on la lance
      bot.commands.get(commandName).run(bot, message, argument);
    } else {
      // La commande n'existe pas, on prévient l'utilisateur
      await message.delete();
      await message.channel.send(`The ${commandName} does not exist.`);
    }
  }
});

bot
  .login(process.env.TOKEN)
  .then(() => {
    console.log("Connexion réussie");
  })
  .catch((error) => {
    console.error(error);
  });
