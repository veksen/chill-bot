import { Client, Guild, GuildMember, MessageReaction, TextChannel, User } from "discord.js";
import * as dotenv from "dotenv";
import * as mongoose from "mongoose";

dotenv.config();

import { MONGO_PATH, PREFIX, TOKEN } from "./config";

import { Instance } from "./Instance";

(async () => {
  if (!TOKEN) {
    return console.log("TOKEN is not set.");
  }

  mongoose.connect(MONGO_PATH, { useNewUrlParser: true });

  const client = new Client({ disableEveryone: true });
  const instance = new Instance();
  const bot = await instance.init(client);

  if (!bot) {
    return console.log("Something wrong happened");
  }

  client.on("warn", console.warn);
  client.on("error", console.error);
  client.on("ready", () => {
    console.log("Bot is ready!");

    // TODO: move me
    const getGuildMember = async (guildId: Guild["id"], user: User): Promise<GuildMember> => {
      const u = await user.fetch();
      const guild = client.guilds.resolve(guildId);
      return guild.members.fetch(u.id);
    };

    // TODO: move me
    instance.watchedMessages.forEach(async message => {
      const channel = (await client.channels.fetch(message.channelId)) as TextChannel;
      const watched = await channel.messages.fetch(message.messageId);

      const hasReactionByMe = watched.reactions.some(
        reaction => reaction.me && reaction.emoji.name === message.reaction
      );
      if (!hasReactionByMe) {
        watched.react(message.reaction).catch(console.log);
      }

      const collector = watched.createReactionCollector(
        (reaction: MessageReaction) => {
          return reaction.emoji.name === message.reaction;
        },
        { dispose: true }
      );
      collector
        .on("collect", async (role: MessageReaction, user: User) => {
          const member = await getGuildMember(message.guildId, user);
          member.roles.add(message.roleId).catch(console.log);
          console.log(`Collected ${role.emoji.name}`);
        })
        .on("remove", async (r: MessageReaction, user: User) => {
          const member = await getGuildMember(message.guildId, user);
          member.roles.remove(message.roleId).catch(console.log);
          console.log(`Removed ${r.emoji.name}`);
        });
    });
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
