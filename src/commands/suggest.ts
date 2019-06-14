import { EmbedField, GuildChannel, Message, MessageEmbed, TextChannel } from "discord.js";
import { CommandInterface } from "../Command";
import { Instance } from "../Instance";
import { SuggestionModel } from "../models/Suggestion";
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

const extractContent = (msg: Message): string => {
  const [command] = msg.content.split(" ");
  return msg.content.replace(command, "").trim();
};

const validateContent = (msg: Message): ConditionValidity => {
  const content = extractContent(msg);

  if (!content) {
    return invalid("Please provide a suggestion");
  }

  const LIMIT = 75;
  const cutContent = content.length > LIMIT ? `${content.slice(0, LIMIT)}... (cut sample)` : content;

  return valid(`Valid content supplied: ${cutContent}`);
};

export class Command implements CommandInterface {
  public name = "suggest";
  public aliases = ["suggestion"];
  private validations: { [name: string]: ConditionValidity } = {
    channel: { valid: false, message: "" },
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

    const channelToSend = getChannel(msg, msg.channel.id);
    const suggestionContent = extractContent(msg);

    const options = {
      files: msg.attachments.array().map(attachment => attachment.url)
    };

    const sentMessage = (await channelToSend.send("", {
      embed: {
        color: 0x84b160,
        fields: [{ name: `Suggestion`, value: `from <@${msg.author.id}>: ${suggestionContent}` }]
      },
      ...options
    })) as Message;
    await sentMessage.react("✅");
    await sentMessage.react("❌");
    await msg.delete();

    await SuggestionModel.create({
      guildId: msg.guild.id,
      channelId: msg.channel.id,
      messageId: sentMessage.id,
      authorId: msg.author.id,
      content: suggestionContent
    });

    console.log(`command ran: ${this.name}`);
  }

  public async check(_: Instance, msg: Message, __: string[]): Promise<boolean> {
    if (!msg) {
      return false;
    }

    this.validations = {
      content: validateContent(msg)
    };

    const isValid = [this.validations.content.valid].every(cond => cond);

    return isValid;
  }

  public async guard(_: Instance, msg: Message): Promise<void> {
    const channelIsAllowed = ["455713503630589963", "582293944218419223"].includes(msg.channel.id);

    if (!channelIsAllowed) {
      throw new Error("not allowed");
    }
  }

  private async buildEmbed(args: string[], isValid: boolean): Promise<MessageEmbed> {
    let headerField: EmbedField[] = [];
    if (args.length <= 1) {
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
          value: `Added suggestion!`
        }
      ];
    }

    const validatedFields: EmbedField[] = [
      {
        name: "1- Content",
        value: this.validations.content.message
      }
    ];

    const embed = new MessageEmbed({
      fields: [...headerField, ...validatedFields]
    });

    return embed;
  }
}
