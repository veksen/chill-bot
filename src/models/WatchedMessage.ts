import * as mongoose from "mongoose";
const { Schema } = mongoose;

export interface WatchedMessage {
  guildId: string;
  channelId: string;
  messageId: string;
  mention: string;
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
    mention: String,
    roleId: String,
    authorId: String
  },
  { timestamps: true }
);

WatchedMessageSchema.static("get", async function(id: string): Promise<WatchedMessage> {
  return this.findById(id).exec();
});

WatchedMessageSchema.static("list", async function(): Promise<WatchedMessage[]> {
  return this.find({})
    .sort({ createdAt: -1 })
    .exec();
});

export const WatchedMessageModel = mongoose.model<WatchedMessageDocument>("WatchedMessage", WatchedMessageSchema);
