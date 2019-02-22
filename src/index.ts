import * as Discord from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

import { PREFIX, TOKEN } from "./config";

import { Instance } from "./Instance";

(async () => {
  if (!TOKEN) {
    return console.log("TOKEN is not set.");
  }

  const client = new Discord.Client({ disableEveryone: true });
  const instance = new Instance();
  const bot = await instance.init(client);

  if (!bot) {
    return console.log("Something wrong happened");
  }

  client.on("warn", console.warn);
  client.on("error", console.error);
  client.on("ready", () => console.log("Bot is ready!"));
  client.on("disconnect", () => console.log("Bot disconnected!"));
  client.on("reconnecting", () => console.log("Bot reconnecting!"));

  client.on("message", async message => {
    if (message.author.bot) {
      return undefined;
    }
    if (!message.content.startsWith(PREFIX)) {
      return undefined;
    }

    bot.handler.parse(bot, message);
  });

  client.login(TOKEN);
})();
