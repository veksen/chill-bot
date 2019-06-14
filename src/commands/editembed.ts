import { EmbedField, GuildChannel, Message, MessageEmbed, TextChannel } from "discord.js";
import { allowedChannels } from "../allowedChannels";
import { CommandInterface } from "../Command";
import { Instance } from "../Instance";
import { ConditionValidity, invalid, isChannelMention, valid } from "../utils";

const getChannel = (msg: Message, channelArg: string): TextChannel => {
  const findByNameOrId = (c: GuildChannel) => {
    if (isChannelMention(channelArg) && msg.mentions.channels.first()) {
      return c.name === (msg.mentions.channels.first() as TextChannel).name;
    }

    return c.id === channelArg;
  };

  return (msg.channel as TextChannel).guild.channels.find(findByNameOrId) as TextChannel;
};

const getMessage = (msg: Message, channelArg: string, messageArg: string): Promise<Message> => {
  const channel = getChannel(msg, channelArg);

  return channel.messages.fetch(messageArg);
};

const validateChannel = (msg: Message, channelArg: string): ConditionValidity => {
  if (!channelArg) {
    return invalid("Please mention a channel, or provide a channel id");
  }

  const channel = getChannel(msg, channelArg);

  if (!channel) {
    return invalid(`Could not find channel \`${channelArg}\``);
  }

  return valid(`Found channel <#${channel.id}>`);
};

const extractContent = (msg: Message, channelArg: string, messageArg: string): string => {
  const [command] = msg.content.split(" ");
  return msg.content
    .replace(command, "")
    .replace(channelArg, "")
    .replace(messageArg, "")
    .trim();
};

const validateMessage = async (msg: Message, channelArg: string, messageArg: string): Promise<ConditionValidity> => {
  if (!channelArg || !messageArg) {
    return invalid("Please provide a message id");
  }

  const channel = getChannel(msg, channelArg);

  try {
    await channel.messages.fetch(messageArg);

    return valid(`Found message \`${messageArg}\``);
  } catch (e) {
    if (channel) {
      return invalid(`Could not find message id \`${messageArg}\` in <#${channel.id}>`);
    }

    return invalid(`Could not find message id \`${messageArg}\``);
  }
};

const validateContent = (msg: Message, channelArg: string, messageArg: string): ConditionValidity => {
  const content = extractContent(msg, channelArg, messageArg);

  if (!content) {
    return invalid("Please add some content, can't send an empty message");
  }

  if (!content.match(/\*\*.*\*\*/g)) {
    return invalid("Please have at least one title, using `**title**` format");
  }

  const LIMIT = 75;
  const cutContent = content.length > LIMIT ? `${content.slice(0, LIMIT)}... (cut sample)` : content;

  return valid(`Valid content supplied: ${cutContent}`);
};

export class Command implements CommandInterface {
  public name = "editembed";
  public aliases = [];
  private validations: { [name: string]: ConditionValidity } = {
    channel: { valid: false, message: "" },
    message: { valid: false, message: "" },
    content: { valid: false, message: "" }
  };

  public async run(ctx: Instance, msg: Message, args: string[]): Promise<void> {
    console.log(`command attempted: ${this.name}`);

    try {
      await this.guard(ctx, msg);
    } catch (e) {
      console.log(e.message);
      return;
    }

    const isValid = await this.check(ctx, msg, args);
    if (!isValid) {
      console.log(`command invalid: ${this.name}`);
      const invalidEmbed = await this.buildEmbed(args, isValid);
      msg.channel.send(invalidEmbed);
      return;
    }

    const channelToSend = getChannel(msg, args[0]);
    const messageToEdit = await getMessage(msg, args[0], args[1]);
    const messageToSend = extractContent(msg, args[0], args[1]);

    const embedArr = messageToSend
      .split("**")
      .filter(Boolean)
      .reduce((acc: any[], curr: string, i: number) => {
        const pair = Math.floor(i / 2);
        const key = i % 2 === 0 ? "name" : "value";
        return [...acc.filter((_, index) => index !== pair), { ...acc[pair], [key]: curr }];
      }, []);

    messageToEdit.edit("", {
      embed: {
        color: 0xcc0c29,
        fields: [...embedArr]
      }
    });

    const validEmbed = await this.buildEmbed(args, isValid, channelToSend, messageToEdit.id);
    msg.channel.send(validEmbed);

    console.log(`command ran: ${this.name}`);
  }

  public async check(_: Instance, msg: Message, args: string[]): Promise<boolean> {
    if (!msg) {
      return false;
    }

    this.validations = {
      channel: validateChannel(msg, args[0]),
      message: await validateMessage(msg, args[0], args[1]),
      content: validateContent(msg, args[0], args[1])
    };

    const isValid = [this.validations.channel.valid, this.validations.content.valid].every(cond => cond);

    return isValid;
  }

  public async guard(_: Instance, msg: Message): Promise<void> {
    const channelIsAllowed = allowedChannels.includes(msg.channel.id);

    if (!channelIsAllowed) {
      throw new Error("not allowed");
    }
  }

  private async buildEmbed(
    args: string[],
    isValid: boolean,
    channel?: TextChannel,
    messageId?: string
  ): Promise<MessageEmbed> {
    let headerField: EmbedField[] = [];
    if (args.length <= 3) {
      headerField = [
        {
          name: "Invalid",
          value: "This command requires 3 arguments"
        }
      ];
    } else if (!isValid) {
      headerField = [
        {
          name: "Invalid",
          value: "Invalid arguments, validate below"
        }
      ];
    } else {
      headerField = [
        {
          name: "Success",
          value: `Edited embed **${messageId}** in <#${(channel as TextChannel).id}>`
        }
      ];
    }

    const validatedFields: EmbedField[] = [
      {
        name: "1- Channel",
        value: this.validations.channel.message
      },
      {
        name: "2- Message",
        value: this.validations.message.message
      },
      {
        name: "3- Content",
        value: this.validations.content.message
      }
    ];

    const embed = new MessageEmbed({
      fields: [...headerField, ...validatedFields]
    });

    return embed;
  }
}
