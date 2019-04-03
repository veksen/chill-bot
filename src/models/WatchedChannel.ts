import * as mongoose from "mongoose";
const { Schema } = mongoose;

export interface WatchedChannel {
  guildId: string;
  channelId: string;
  authorId: string;
}

export interface WatchedChannelDocument extends WatchedChannel, mongoose.Document {
  createdAt: string;
  updatedAt: string;
}

const WatchedChannelSchema: mongoose.Schema = new Schema(
  {
    guildId: String,
    channelId: String,
    authorId: String
  },
  { timestamps: true }
);

WatchedChannelSchema.statics = {
  async get(id: string): Promise<WatchedChannel> {
    return this.findById(id).exec();
  },

  async list(): Promise<WatchedChannel[]> {
    return this.find({})
      .sort({ createdAt: -1 })
      .exec();
  }
};

export const WatchedChannelModel = mongoose.model<WatchedChannelDocument>("WatchedChannel", WatchedChannelSchema);
