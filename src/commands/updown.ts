import { EmbedField, GuildChannel, Message, MessageEmbed, TextChannel } from "discord.js";
import { allowedChannels } from "../allowedChannels";
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

export class Command implements CommandInterface {
  public name = "updown";
  public aliases = [];
  private validations: { [name: string]: ConditionValidity } = {
    channel: { valid: false, message: "" }
  };

  public async check(_: Instance, msg: Message, args: string[]): Promise<boolean> {
    if (!msg) {
      return false;
    }

    this.validations = {
      channel: validateChannel(msg, args[0])
    };

    const isValid = [this.validations.channel.valid].every(cond => cond);

    return isValid;
  }

  public async guard(_: Instance, msg: Message): Promise<void> {
    const channelIsAllowed = allowedChannels.includes(msg.channel.id);

    if (!channelIsAllowed) {
      throw new Error("Not allowed in this channel");
    }
  }

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

    const channel = args[0];

    const channelToSend = getChannel(msg, args[0]);

    const id = await ctx.channelWatcher.add(ctx, {
      guildId: msg.guild.id,
      channelId: extractIdFromMention(channel),
      authorId: msg.author.id
    });

    const validEmbed = await this.buildEmbed(args, isValid, channelToSend, id);
    msg.channel.send(validEmbed);

    console.log(`command ran: ${this.name}`);
  }

  private async buildEmbed(
    args: string[],
    isValid: boolean,
    channel?: TextChannel,
    createdId?: string
  ): Promise<MessageEmbed> {
    let headerField: EmbedField[] = [];
    if (args.length !== 1) {
      headerField = [
        {
          name: "Invalid",
          value: "This command requires 1 arguments"
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
          value: `Watching channel <#${(channel as TextChannel).id}> for messages, with id \`${createdId}\``
        }
      ];
    }

    const validatedFields: EmbedField[] = [
      {
        name: "1- Channel",
        value: this.validations.channel.message
      }
    ];

    const embed = new MessageEmbed({
      fields: [...headerField, ...validatedFields]
    });

    return embed;
  }
}
