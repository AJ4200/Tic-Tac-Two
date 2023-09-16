import { Request, Response } from "express";
import { User } from "../models/user";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { generateAlias, generateAvatar } from "../utils/helpers";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const login = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Invalid token payload");
    }

    const email = payload.email;
    const googleAccountId = payload.sub;

    // Check if the user already exists in your database
    let user = await User.findOne({ googleAccountId });

    if (!user) {
      // User doesn't exist, create a new user
      user = new User({
        email,
        avatar: generateAvatar(email), // Generate avatar based on email
        alias: generateAlias(), // Generate random alias
        wins: 0,
        losses: 0,
        matchesPlayed: 0,
        googleAccountId,
      });

      await user.save();
    }

    // Return the user data or a token for authentication
    res.json(user);
  } catch (error) {
    console.error("Google sign-in error:", error);
    res.status(500).json({ error: "Failed to sign in with Google" });
  }
};

export const register = async (req: Request, res: Response) => {
  const { idToken, avatar, alias } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Invalid token payload");
    }

    const email = payload.email;
    const googleAccountId = payload.sub;

    // Check if the user already exists in your database
    const existingUser = await User.findOne({ googleAccountId });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create a new user
    const user = new User({
      email,
      avatar: avatar || generateAvatar(email), // Use provided avatar or generate based on email
      alias: alias || generateAlias(), // Use provided alias or generate random alias
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      googleAccountId,
    });

    await user.save();

    // Return the user data or a token for authentication
    res.json(user);
  } catch (error) {
    console.error("Google registration error:", error);
    res.status(500).json({ error: "Failed to register with Google" });
  }
};
