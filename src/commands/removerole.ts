import { EmbedField, Message, MessageEmbed } from "discord.js";
import { CommandInterface } from "../Command";
import { Instance } from "../Instance";
import { WatchedMessageModel } from "../models/WatchedMessage";
import { ConditionValidity, invalid, valid } from "../utils";

const validateId = async (_: Message, idArg: string): Promise<ConditionValidity> => {
  if (!idArg) {
    return invalid("Please provide an id");
  }

  const message = await WatchedMessageModel.findOne({ _id: idArg });

  if (!message) {
    return invalid(`Could not find role reaction with id \`${idArg}\``);
  }

  return valid(`Deleted role reaction id \`${idArg}\``);
};

export class Command implements CommandInterface {
  public name = "removerole";
  public aliases = ["deleterole"];

  public async run(ctx: Instance, msg: Message, args: string[]): Promise<void> {
    try {
      await this.guard(ctx, msg);
    } catch (e) {
      console.log(e.message);
      return;
    }

    const isValid = await this.check(ctx, msg, args);
    if (!isValid) {
      return;
    }

    console.log("ran removerole");

    const id = args[0];

    ctx.reactionCollector
      .remove(ctx, {
        id
      })
      .catch(console.log);
  }

  public async check(_: Instance, msg: Message, args: string[]): Promise<boolean> {
    if (!msg) {
      return false;
    }

    const validations = {
      id: await validateId(msg, args[0])
    };

    const isValid = [validations.id.valid].every(cond => cond);

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
    }

    const validatedFields = [
      {
        name: "1- ID",
        value: (await validateId(msg, args[0])).message
      }
    ];

    msg.channel.send(
      new MessageEmbed({
        fields: [...headerField, ...validatedFields]
      })
    );

    return isValid;
  }

  public async guard(_: Instance, msg: Message): Promise<void> {
    const allowedChannels = [
      "382642615952211970", // chillhop
      "544291635165528094", // Tele
      "548421804943998976" // v
    ];

    const channelIsAllowed = allowedChannels.includes(msg.channel.id);

    if (!channelIsAllowed) {
      throw new Error("not allowed");
    }
  }
}
