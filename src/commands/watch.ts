import { CommandInterface } from "../Command";
import { WatchedMessageModel } from "../models/WatchedMessage";

export const command: CommandInterface = {
  name: "watch",
  aliases: [],

  check: (_, msg, args = []) => {
    if (!msg) {
      return;
    }
    if (args.length !== 4) {
      msg.channel.send(`Provide 4 arguments:
      - channelMention
      - messageId
      - mention
      - roleMention
      `);
      return;
    }
    // TODO: validate arguments
    // valid channel
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

    const extractRoleId = (roleMention: string): string => {
      return roleMention.replace(/\D/g, "");
    };

    const channelId = args[0];
    const messageId = args[1];
    const mention = args[2];
    const role: string = args[3];

    const watchedMessage = {
      guildId: msg.guild.id,
      channelId,
      messageId,
      mention,
      roleId: extractRoleId(role),
      authorId: msg.author.id
    };

    WatchedMessageModel.create(watchedMessage).then(() => {
      ctx.watchedMessages.push(watchedMessage);
    });
  }
};
