import { Message } from "discord.js";
import { Instance } from "./instance";

export interface CommandInterface {
  name: string;
  aliases: string[];
  run: (ctx: Instance, msg: Message, args: string[]) => Promise<void>;
  check: (ctx: Instance, msg: Message, args: string[]) => Promise<boolean>;
  guard: (ctx: Instance, msg: Message, args: string[]) => Promise<void>;
}

export class Command implements CommandInterface {
  public name: string;
  public aliases: string[] = [];
  public run: (ctx: Instance, msg: Message, args: string[]) => Promise<void>;
  public check: (ctx: Instance, msg: Message, args: string[]) => Promise<boolean>;
  public guard: (ctx: Instance, msg: Message, args: string[]) => Promise<void>;

  constructor(command: CommandInterface) {
    this.name = command.name;
    this.aliases = command.aliases;
    this.run = command.run;
  }
}
