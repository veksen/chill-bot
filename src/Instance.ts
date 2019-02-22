import * as Discord from "discord.js";

import { PREFIX } from "./config";

import { ReactionCollectorHelper } from "./collectors/reaction";
import { CommandHandler } from "./CommandHandler";

interface InstanceInterface {
  bot?: Discord.Client;
  prefix?: string;
  handler?: CommandHandler;
}

export class Instance implements InstanceInterface {
  public bot: Discord.Client;
  public prefix: string;
  public handler: CommandHandler;
  public reactionCollector: ReactionCollectorHelper;

  public async init(bot: Discord.Client): Promise<Instance | void> {
    this.bot = bot;
    this.prefix = PREFIX;

    const handler = new CommandHandler();
    this.handler = await handler.init();
    this.reactionCollector = new ReactionCollectorHelper();

    return this;
  }
}
