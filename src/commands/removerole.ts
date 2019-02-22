import { Message, MessageEmbed } from "discord.js";
import { CommandInterface } from "../Command";
import { Instance } from "../instance";
import { WatchedMessageModel } from "../models/WatchedMessage";

const valid = (text: string) => ({ valid: true, message: `:white_check_mark: ${text}` });
const invalid = (text: string) => ({ valid: false, message: `:x: ${text}` });

const validateId = async (_: Message, idArg: string): Promise<{ valid: boolean; message: string }> => {
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
    await this.check(ctx, msg, args);

    console.log("ran removerole");

    const id = args[0];

    ctx.reactionCollector
      .remove(ctx, {
        id
      })
      .catch(console.log);
  }

  public async check(_: Instance, msg: Message, args: string[]): Promise<void> {
    if (!msg) {
      return;
    }

    const headerField =
      args.length !== 1
        ? [
            {
              name: "Invalid",
              value: "This command requires 1 argument"
            }
          ]
        : [];

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
  }

  public async guard(): Promise<void> {
    //
  }
}
