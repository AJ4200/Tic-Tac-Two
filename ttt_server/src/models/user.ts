import { Schema, model, Document } from "mongoose";

interface User extends Document {
email: string;
  avatar: string;
  alias: string;
  wins: number;
  losses: number;
  matchesPlayed: number;
}

const UserSchema = new Schema<User>({
email: { type: String, required: true },
  avatar: { type: String, required: true },
  alias: { type: String, required: true },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  matchesPlayed: { type: Number, default: 0 },
});

export const User = model<User>("User", UserSchema);
