import { Message, MessageEmbed, TextChannel } from "discord.js";
import { CommandInterface } from "../Command";
import { WatchedMessageModel } from "../models/WatchedMessage";

const valid = (text: string) => `:white_check_mark: ${text}`;
const invalid = (text: string) => `:x: ${text}`;

const extractRoleId = (roleMention: string): string => {
  return roleMention.replace(/\D/g, "");
};

const validateChannel = (msg: Message, channelArg: string): string => {
  if (!channelArg) {
    return invalid("Please provide a channel id");
  }

  const channel = (msg.channel as TextChannel).guild.channels.has(channelArg);

  if (!channel) {
    return invalid(`Could not find channel \`${channelArg}\``);
  }

  return valid(`Found channel \`${channelArg}\``);
};

const validateMessage = (msg: Message, channelArg: string, messageArg: string): string => {
  if (!channelArg || !messageArg) {
    return invalid("Please provide a message id");
  }

  const channel = (msg.channel as TextChannel).guild.channels.get(channelArg) as TextChannel;
  const message = channel.messages.fetch(messageArg);

  if (!message) {
    return invalid(`Could not find message \`${messageArg}\``);
  }

  return valid(`Found message \`${messageArg}\``);
};

const validateMention = async (msg: Message, mentionArg: string): Promise<string> => {
  if (!mentionArg) {
    return invalid("Please provide a emoji/mention, like :+1:");
  }

  const emoji = await (msg.channel as TextChannel).guild.emojis.resolveIdentifier(mentionArg);

  // TODO: make sure this properly work - is it even necessary?
  if (!emoji) {
    return invalid(`Could not find emoji/mention \`${mentionArg}\`,
    is it available to the server?`);
  }

  return valid(`Found emoji/mention \`${mentionArg}\``);
};

const validateRole = async (msg: Message, roleArg: string): Promise<string> => {
  if (!roleArg) {
    return invalid("Please mention a role, `@somerole`");
  }

  const roleId = extractRoleId(roleArg);
  const role = await (msg.channel as TextChannel).guild.roles.fetch(roleId);

  if (!role || !roleId) {
    return invalid(`Could not find role \`${roleArg}\``);
  }

  return valid(`Found role \`${roleArg}\``);
};

export const command: CommandInterface = {
  name: "watch",
  aliases: [],

  check: async (_, msg, args = []) => {
    if (!msg) {
      return;
    }

    const headerField =
      args.length !== 4
        ? [
            {
              name: "Invalid",
              value: "This command requires 4 arguments"
            }
          ]
        : [];

    const validatedFields = [
      {
        name: "1- Channel",
        value: validateChannel(msg, args[0])
      },
      {
        name: "2- Message",
        value: validateMessage(msg, args[0], args[1])
      },
      {
        name: "3- Mention",
        value: await validateMention(msg, args[2])
      },
      {
        name: "4- Role",
        value: await validateRole(msg, args[3])
      }
    ];

    msg.channel.send(
      new MessageEmbed({
        fields: [...headerField, ...validatedFields]
      })
    );
  },

  guard: () => {
    //
  },

  run: async (ctx, msg, args): Promise<void> => {
    await command.check(ctx, msg, args);

    console.log("ran watch");

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
