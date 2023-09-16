import { Schema, model, Document } from "mongoose";

interface Game extends Document {
  player1: Schema.Types.ObjectId;
  player2: Schema.Types.ObjectId;
  gameLink: string;
  winner: Schema.Types.ObjectId;
  loser: Schema.Types.ObjectId;
}

const GameSchema = new Schema<Game>({
  player1: { type: Schema.Types.ObjectId, ref: "User", required: true },
  player2: { type: Schema.Types.ObjectId, ref: "User", required: true },
  gameLink: { type: String, required: true },
  winner: { type: Schema.Types.ObjectId, ref: "User" },
  loser: { type: Schema.Types.ObjectId, ref: "User" },
});

export const Game = model<Game>("Game", GameSchema);
