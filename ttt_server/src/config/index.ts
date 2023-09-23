import mongoose from "mongoose";

// Set up MongoDB connection
mongoose.connect(process.env.MONGODB_URI as string);

