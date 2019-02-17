import { GuildMember, MessageReaction, TextChannel, User } from "discord.js";
import { CommandInterface } from "../Command";

export const command: CommandInterface = {
  name: "watch",
  aliases: [],

  check: (_, msg, args = []) => {
    if (!msg) {
      return;
    }
    if (args.length !== 3) {
      msg.channel.send(`Provide 3 arguments:
      - messageId
      - mention
      - role
      `);
      return;
    }
    // TODO: validate arguments
    // valid message
    // valid mention
    // valid role
  },

  guard: () => {
    //
  },

  run: async (ctx, msg, args): Promise<void> => {
    command.check(ctx, msg, args);

    console.log("ran watch");

    const messageId = args[0];
    console.log(messageId);

    const mention = args[1];
    console.log(mention);

    const role: string = args[2];
    console.log(role);

    ctx.watchedMessages.push({
      messageId,
      mention,
      role
    });

    if (!ctx.watchedMessages.length) {
      return;
    }

    const firstWatch = ctx.watchedMessages[0];

    const channel = msg.channel as TextChannel;
    const messages = await channel.messages;
    const message = await messages.fetch(firstWatch.messageId);

    const getMember = async (user: User): Promise<GuildMember> => {
      const u = await user.fetch();
      return msg.guild.members.fetch(u.id);
    };

    const extractRoleId = (roleMention: string): string => {
      return roleMention.replace(/\D/g, "");
    };

    const collector = message.createReactionCollector(
      (reaction: MessageReaction) => {
        return reaction.emoji.name === firstWatch.mention;
      },
      { dispose: true }
    );
    collector
      .on("collect", async (r: MessageReaction, u: User) => {
        const member = await getMember(u);
        const roleId = extractRoleId(role);
        member.roles.add(roleId).catch(console.log);
        console.log(`Collected ${r.emoji.name}`);
      })
      .on("remove", async (r: MessageReaction, u: User) => {
        const member = await getMember(u);
        const roleId = extractRoleId(role);
        member.roles.remove(roleId).catch(console.log);
        console.log(`Removed ${r.emoji.name}`);
      });
  }
};
