import { Client, Guild, GuildMember, MessageReaction, TextChannel, User } from "discord.js";
import { Instance } from "../instance";

const getGuildMember = async (client: Client, guildId: Guild["id"], user: User): Promise<GuildMember> => {
  const u = await user.fetch();
  const guild = client.guilds.resolve(guildId);
  return guild.members.fetch(u.id);
};

export interface ReactionCollectorInterface {
  init: (ctx: Instance) => void;
}

export class ReactionCollector implements ReactionCollector {
  public init(ctx: Instance): void {
    ctx.watchedMessages.forEach(async message => {
      const channel = (await ctx.bot.channels.fetch(message.channelId)) as TextChannel;
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
          const member = await getGuildMember(ctx.bot, message.guildId, user);
          member.roles.add(message.roleId).catch(console.log);
          console.log(`Collected ${role.emoji.name}`);
        })
        .on("remove", async (r: MessageReaction, user: User) => {
          const member = await getGuildMember(ctx.bot, message.guildId, user);
          member.roles.remove(message.roleId).catch(console.log);
          console.log(`Removed ${r.emoji.name}`);
        });
    });
  }
}
