import * as mongoose from "mongoose";
const { Schema } = mongoose;

export interface Suggestion {
  guildId: string;
  channelId: string;
  messageId: string;
  authorId: string;
  content: string;
}

export interface SuggestionDocument extends Suggestion, mongoose.Document {
  createdAt: string;
  updatedAt: string;
}

const SuggestionSchema: mongoose.Schema = new Schema(
  {
    guildId: String,
    channelId: String,
    messageId: String,
    authorId: String,
    content: String
  },
  { timestamps: true }
);

SuggestionSchema.statics = {
  async get(id: string): Promise<Suggestion> {
    return this.findById(id).exec();
  },

  async list(): Promise<Suggestion[]> {
    return this.find({})
      .sort({ createdAt: -1 })
      .exec();
  }
};

export const SuggestionModel = mongoose.model<SuggestionDocument>("Suggestion", SuggestionSchema);
