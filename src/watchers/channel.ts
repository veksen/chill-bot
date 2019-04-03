import { Guild, Message } from "discord.js";
import { MongooseDocument } from "mongoose";
import { Instance } from "../Instance";
import { WatchedChannelDocument, WatchedChannelModel } from "../models/WatchedChannel";

interface KeyedChannelWatcher {
  id: string;
  guildId: string;
}

export class ChannelWatcher {
  private watched: WatchedChannelDocument[] = [];
  private watchers: KeyedChannelWatcher[] = [];

  public async init(ctx: Instance): Promise<void> {
    this.watched = await (WatchedChannelModel as any).list();
    this.watched.forEach(async channel => {
      this.setup(ctx, channel);
    });
  }

  public async add(
    ctx: Instance,
    channel: {
      guildId: string;
      channelId: string;
      authorId: string;
    }
  ): Promise<MongooseDocument["_id"] | void> {
    const query = {
      guildId: channel.guildId,
      channelId: channel.channelId
    };

    const result = await WatchedChannelModel.findOneAndUpdate(query, channel, { upsert: true, new: true });

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

    const toRemove = await WatchedChannelModel.findOne(query);

    if (!toRemove) {
      throw new Error(`no match for ${message.id}`);
    }

    await WatchedChannelModel.deleteOne(query);
    this.watched = [...this.watched.filter(m => m.id !== toRemove.id)];
    this.unsetup(ctx, toRemove);
  }

  public run(ctx: Instance, message: Message): void {
    const watcher = this.matches(message);

    if (watcher) {
      this.addReaction(ctx, watcher, message);
    }
  }

  private async addReaction(ctx: Instance, watched: KeyedChannelWatcher, message: Message): Promise<void> {
    const guild = ctx.bot.guilds.get(watched.guildId) as Guild;
    const channel = guild.channels.get(watched.id);

    if (!channel) {
      return;
    }

    await (message as Message).react("👍");
    await (message as Message).react("👎");
  }

  private matches(message: Message): KeyedChannelWatcher | void {
    return this.watchers.find(w => w.id === message.channel.id);
  }

  private async unsetup(_: Instance, channel: WatchedChannelDocument): Promise<void> {
    const { id } = channel;
    const keyedWatcher = this.watchers.find(c => c.id === id);

    if (!keyedWatcher) {
      throw new Error("no match");
    }

    // then update watchers to remove the deleted one
    this.watchers = [...this.watchers.filter(c => c.id !== id)];
  }

  private async setup(_: Instance, ref: WatchedChannelDocument): Promise<void> {
    // then update watchers with the newly created one
    this.watchers = [
      ...this.watchers.filter(w => w.id !== ref.channelId),
      {
        id: ref.channelId,
        guildId: ref.guildId
      }
    ];
  }
}
