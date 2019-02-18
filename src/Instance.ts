import * as Discord from "discord.js";

import { PREFIX } from "./config";

import { CommandHandler } from "./CommandHandler";
import { WatchedMessage, WatchedMessageModel } from "./models/WatchedMessage";

interface InstanceInterface {
  bot?: Discord.Client;
  prefix?: string;
  handler?: CommandHandler;
  watchedMessages: WatchedMessage[];
}

export class Instance implements InstanceInterface {
  public bot: Discord.Client;
  public prefix: string;
  public handler: CommandHandler;
  public watchedMessages: WatchedMessage[];

  public async init(bot: Discord.Client): Promise<Instance | void> {
    this.bot = bot;
    this.prefix = PREFIX;

    const handler = new CommandHandler();
    this.handler = await handler.init();
    this.watchedMessages = await (WatchedMessageModel as any).list();

    return this;
  }
}
