import * as mongoose from "mongoose";
const { Schema } = mongoose;

export interface WatchedMessage {
  guildId: string;
  channelId: string;
  messageId: string;
  reaction: string;
  roleId: string;
  authorId: string;
}

export interface WatchedMessageDocument extends WatchedMessage, mongoose.Document {
  createdAt: string;
  updatedAt: string;
}

const WatchedMessageSchema: mongoose.Schema = new Schema(
  {
    guildId: String,
    channelId: String,
    messageId: String,
    reaction: String,
    roleId: String,
    authorId: String
  },
  { timestamps: true }
);

WatchedMessageSchema.statics = {
  async get(id: string): Promise<WatchedMessage> {
    return this.findById(id).exec();
  },

  async list(): Promise<WatchedMessage[]> {
    return this.find({})
      .sort({ createdAt: -1 })
      .exec();
  }
};

export const WatchedMessageModel = mongoose.model<WatchedMessageDocument>("WatchedMessage", WatchedMessageSchema);
