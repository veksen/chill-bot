import * as Discord from "discord.js";
import * as glob from "glob";
import { Command } from "./Command";
import { Instance } from "./Instance";

interface CurrentCommand {
  command: string;
  arguments: string[];
}

export interface CommandHandlerInterface {
  commands: Command[];
  current?: CurrentCommand;
}

export class CommandHandler implements CommandHandlerInterface {
  public commands: Command[] = [];
  public current: CurrentCommand;

  public async init(): Promise<CommandHandler> {
    await glob("dist/commands/**/*.js", (err, commands) => {
      if (err) {
        throw new Error("Something wrong happened");
      }

      this.commands = commands.map(command => new (require("../" + command)).Command());
    });

    return this;
  }

  public parse(ctx: Instance, msg: Discord.Message): void {
    const rawCmd = msg.content.slice(ctx.prefix.length);
    const argumentsArray = rawCmd.replace(/\s/g, " ").split(" ");
    const [cmd, ...args] = argumentsArray;

    this.current = {
      command: cmd.toLowerCase(),
      arguments: args
    };

    // attempt the match the command by name, or aliases
    const found = this.commands.find(command => {
      return command.name === cmd || command.aliases.some(alias => alias === cmd);
    });

    if (!found) {
      this.invalidCommand(cmd);
      return;
    }

    found.run(ctx, msg, this.current.arguments);
  }

  private invalidCommand(cmd: string): void {
    console.log(`Invalid command: ${cmd}`);
  }
}
