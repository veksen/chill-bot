import { EmbedField, GuildChannel, Message, MessageEmbed, TextChannel } from "discord.js";
import { CommandInterface } from "../Command";
import { Instance } from "../Instance";
import { ConditionValidity, extractIdFromMention, invalid, isChannelMention, valid } from "../utils";

const getChannel = (msg: Message, channelArg: string): TextChannel => {
  const findByNameOrId = (c: GuildChannel) => {
    if (isChannelMention(channelArg) && msg.mentions.channels.first()) {
      return c.name === (msg.mentions.channels.first() as TextChannel).name;
    }

    return c.id === channelArg;
  };

  return (msg.channel as TextChannel).guild.channels.find(findByNameOrId) as TextChannel;
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

const validateReaction = async (msg: Message, reactionArg: string): Promise<ConditionValidity> => {
  if (!reactionArg) {
    return invalid("Please provide a emoji/reaction, like :+1:");
  }

  const emoji = await (msg.channel as TextChannel).guild.emojis.resolveIdentifier(reactionArg);

  // TODO: make sure this properly work - is it even necessary?
  if (!emoji) {
    return invalid(`Could not find emoji/reaction \`${reactionArg}\`,
    is it available to the server?`);
  }

  return valid(`Found emoji/reaction \`${reactionArg}\``);
};

const validateRole = async (msg: Message, roleArg: string): Promise<ConditionValidity> => {
  if (!roleArg) {
    return invalid("Please mention a role, `@somerole`");
  }

  const roleId = extractIdFromMention(roleArg);
  const role = await (msg.channel as TextChannel).guild.roles.fetch(roleId);

  if (!role || !roleId) {
    return invalid(`Could not find role \`${roleArg}\``);
  }

  return valid(`Found role \`${roleArg}\``);
};

export class Command implements CommandInterface {
  public name = "addrole";
  public aliases = [];
  private validations: { [name: string]: ConditionValidity } = {
    channel: { valid: false, message: "" },
    message: { valid: false, message: "" },
    reaction: { valid: false, message: "" },
    role: { valid: false, message: "" }
  };

  public async check(_: Instance, msg: Message, args: string[]): Promise<boolean> {
    if (!msg) {
      return false;
    }

    this.validations = {
      channel: validateChannel(msg, args[0]),
      message: await validateMessage(msg, args[0], args[1]),
      reaction: await validateReaction(msg, args[2]),
      role: await validateRole(msg, args[3])
    };

    const isValid = [
      this.validations.channel.valid,
      this.validations.message.valid,
      this.validations.reaction.valid,
      this.validations.role.valid
    ].every(cond => cond);

    return isValid;
  }

  public async guard(): Promise<void> {
    //
  }

  public async run(ctx: Instance, msg: Message, args: string[]): Promise<void> {
    const isValid = await this.check(ctx, msg, args);

    if (!isValid) {
      const invalidEmbed = await this.buildEmbed(args, isValid);
      msg.channel.send(invalidEmbed);
      return;
    }

    console.log("ran addrole");

    const channel = args[0];
    const messageId = args[1];
    const reaction = args[2];
    const role: string = args[3];

    const id = await ctx.reactionCollector.add(ctx, {
      guildId: msg.guild.id,
      channelId: extractIdFromMention(channel),
      messageId,
      reaction,
      roleId: extractIdFromMention(role),
      authorId: msg.author.id
    });

    const validEmbed = await this.buildEmbed(args, isValid, id);
    msg.channel.send(validEmbed);
  }

  private async buildEmbed(args: string[], isValid: boolean, createdId?: string): Promise<MessageEmbed> {
    let headerField: EmbedField[] = [];
    if (args.length !== 4) {
      headerField = [
        {
          name: "Invalid",
          value: "This command requires 4 arguments"
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
          value: `Created reaction role with id \`${createdId}\``
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
        name: "3- Reaction",
        value: this.validations.reaction.message
      },
      {
        name: "4- Role",
        value: this.validations.role.message
      }
    ];

    const embed = new MessageEmbed({
      fields: [...headerField, ...validatedFields]
    });

    return embed;
  }
}
