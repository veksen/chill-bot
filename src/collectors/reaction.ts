import { Client, Guild, GuildMember, Message, MessageReaction, ReactionCollector, TextChannel, User } from "discord.js";
import { MongooseDocument } from "mongoose";
import { Instance } from "../Instance";
import { WatchedMessageDocument, WatchedMessageModel } from "../models/WatchedMessage";

const getGuildMember = async (client: Client, guildId: Guild["id"], user: User): Promise<GuildMember | void> => {
  const u = await user.fetch().catch(console.log);
  if (!u) {
    return;
  }
  const guild = client.guilds.resolve(guildId);
  return guild.members.fetch(u.id);
};

const getMessageFromChannel = async (client: Client, message: WatchedMessageDocument): Promise<Message | void> => {
  const channel = (await client.channels.fetch(message.channelId).catch(console.log)) as TextChannel;
  if (!channel) {
    return;
  }
  return channel.messages.fetch(message.messageId);
};

interface KeyedReactionCollector {
  id: string;
  collector: ReactionCollector;
}

export class ReactionCollectorHelper {
  private watched: WatchedMessageDocument[] = [];
  private collectors: KeyedReactionCollector[] = [];

  public async init(ctx: Instance): Promise<void> {
    this.watched = await (WatchedMessageModel as any).list();
    this.watched.forEach(async message => {
      this.setup(ctx, message);
    });
  }

  public async add(
    ctx: Instance,
    message: {
      guildId: string;
      channelId: string;
      messageId: string;
      reaction: string;
      roleId: string;
      authorId: string;
    }
  ): Promise<MongooseDocument["_id"] | void> {
    const query = {
      guildId: message.guildId,
      channelId: message.channelId,
      messageId: message.messageId,
      reaction: message.reaction
    };

    const result = await WatchedMessageModel.findOneAndUpdate(query, message, { upsert: true, new: true });

    if (result) {
      this.watched = [...this.watched, result];
      this.setup(ctx, result);

      return result._id;
    }

    return;
  }

  public async remove(
    ctx: Instance,
    message: {
      id: string;
    }
  ): Promise<void> {
    const query = {
      _id: message.id
    };

    const toRemove = await WatchedMessageModel.findOne(query);

    if (!toRemove) {
      throw new Error(`no match for ${message.id}`);
    }

    await WatchedMessageModel.deleteOne(query);
    this.watched = [...this.watched.filter(m => m.id !== toRemove.id)];
    this.unsetup(ctx, toRemove);
  }

  private async addReaction(ctx: Instance, message: WatchedMessageDocument): Promise<void> {
    const guild = ctx.bot.guilds.get(message.guildId) as Guild;
    const watched = await getMessageFromChannel(ctx.bot, message).catch(console.log);
    if (!watched) {
      return;
    }
    const isCustomEmoji = message.reaction.match(/^<:.+:\d+>$/);
    const emoji = isCustomEmoji ? guild.emojis.get(message.reaction.replace(/\D/g, "")) : message.reaction;
    if (emoji) {
      watched.react(emoji).catch(console.log);
    } else {
      console.log(`cannot react, ${message.reaction} is invalid`);
    }
  }

  private async removeReaction(ctx: Instance, message: WatchedMessageDocument): Promise<void> {
    const guild = ctx.bot.guilds.get(message.guildId) as Guild;
    const watched = await getMessageFromChannel(ctx.bot, message).catch(console.log);
    if (!watched) {
      return;
    }
    const isCustomEmoji = message.reaction.match(/^<:.+:\d+>$/);
    const emoji = isCustomEmoji ? guild.emojis.get(message.reaction.replace(/\D/g, "")) : message.reaction;
    if (emoji) {
      await watched.reactions
        .filter(reaction => {
          return reaction.me && reaction.emoji.name === emoji;
        })
        .each(reaction => {
          // TODO: guild.me could be uncached...
          reaction.users.remove(guild.me).catch(console.log);
        });
    } else {
      console.log(`cannot react, ${message.reaction} is invalid`);
    }
  }

  private async unsetup(ctx: Instance, message: WatchedMessageDocument): Promise<void> {
    const { id } = message;
    const keyedCollector = this.collectors.find(c => c.id === id);

    if (!keyedCollector) {
      throw new Error("no match");
    }

    this.removeReaction(ctx, message).catch(console.log);
    keyedCollector.collector.stop();

    // then update collectors to remove the deleted one
    this.collectors = [...this.collectors.filter(c => c.id !== id)];
  }

  private async setup(ctx: Instance, message: WatchedMessageDocument): Promise<void> {
    const watched = await getMessageFromChannel(ctx.bot, message).catch(console.log);
    if (!watched) {
      return;
    }
    const hasReactionByMe = watched.reactions.some(reaction => reaction.me && reaction.emoji.name === message.reaction);

    if (!hasReactionByMe) {
      this.addReaction(ctx, message);
    }
    const collector = watched.createReactionCollector(
      (reaction: MessageReaction) => {
        return reaction.emoji.name === message.reaction;
      },
      { dispose: true }
    );
    collector
      .on("collect", async (role: MessageReaction, user: User) => {
        const member = await getGuildMember(ctx.bot, message.guildId, user).catch(console.log);
        if (!member || member.user.bot) {
          return;
        }
        member.roles.add(message.roleId).catch(console.log);
        console.log(`Collected ${role.emoji.name}`);
      })
      .on("remove", async (r: MessageReaction, user: User) => {
        const member = await getGuildMember(ctx.bot, message.guildId, user).catch(console.log);
        if (!member || member.user.bot) {
          return;
        }
        member.roles.remove(message.roleId).catch(console.log);
        console.log(`Removed ${r.emoji.name}`);
      });

    // then update collectors with the newly created one
    this.collectors = [
      ...this.collectors,
      {
        id: message.id,
        collector
      }
    ];
  }
}
