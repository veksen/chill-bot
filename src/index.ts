import { Client } from "discord.js";
import * as dotenv from "dotenv";
import * as mongoose from "mongoose";

dotenv.config();

import { MONGO_PATH, PREFIX, TOKEN } from "./config";

import { Instance } from "./Instance";

(async () => {
  if (!TOKEN) {
    return console.log("TOKEN is not set.");
  }
  if (!MONGO_PATH) {
    return console.log("MONGO_PATH is not set.");
  }

  mongoose.connect(MONGO_PATH, { useNewUrlParser: true });

  const client = new Client({ disableEveryone: true });
  const instance = new Instance();
  const bot = await instance.init(client).catch(console.log);

  if (!bot) {
    return console.log("Something wrong happened");
  }

  client.on("warn", console.warn);
  client.on("error", console.error);
  client.on("ready", () => {
    console.log("Bot is ready!");
    bot.reactionCollector.init(bot).catch(console.log);
  });
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
