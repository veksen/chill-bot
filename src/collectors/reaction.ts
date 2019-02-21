import { Client, Guild, GuildMember, MessageReaction, TextChannel, User } from "discord.js";
import { Instance } from "../instance";
import { WatchedMessage, WatchedMessageModel } from "../models/WatchedMessage";

const getGuildMember = async (client: Client, guildId: Guild["id"], user: User): Promise<GuildMember> => {
  const u = await user.fetch();
  const guild = client.guilds.resolve(guildId);
  return guild.members.fetch(u.id);
};

export interface ReactionCollectorInterface {
  init: (ctx: Instance) => void;
}

export class ReactionCollector implements ReactionCollector {
  private watched: WatchedMessage[] = [];

  public async init(ctx: Instance): Promise<void> {
    this.watched = await (WatchedMessageModel as any).list();
    this.watched.forEach(async message => {
      this.setup(ctx, message);
    });
  }

  public add(
    ctx: Instance,
    message: {
      guildId: string;
      channelId: string;
      messageId: string;
      reaction: string;
      roleId: string;
      authorId: string;
    }
  ): void {
    const query = {
      guildId: message.guildId,
      channelId: message.channelId,
      messageId: message.messageId,
      reaction: message.reaction
    };

    // TODO: eventually avoid doing a full refetch, for performance reasons
    WatchedMessageModel.findOneAndUpdate(query, message, { upsert: true })
      .then(async () => {
        this.watched = await (WatchedMessageModel as any).list();
      })
      .then(() => {
        this.setup(ctx, message);
      });
  }

  private async setup(ctx: Instance, message: WatchedMessage): Promise<void> {
    const channel = (await ctx.bot.channels.fetch(message.channelId)) as TextChannel;
    const watched = await channel.messages.fetch(message.messageId);
    const hasReactionByMe = watched.reactions.some(reaction => reaction.me && reaction.emoji.name === message.reaction);
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
        const member = await getGuildMember(ctx.bot, message.guildId, user);
        member.roles.add(message.roleId).catch(console.log);
        console.log(`Collected ${role.emoji.name}`);
      })
      .on("remove", async (r: MessageReaction, user: User) => {
        const member = await getGuildMember(ctx.bot, message.guildId, user);
        member.roles.remove(message.roleId).catch(console.log);
        console.log(`Removed ${r.emoji.name}`);
      });
  }
}
