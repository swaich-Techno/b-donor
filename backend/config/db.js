const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn("MONGO_URI is not set. API will start, but database routes will fail until configured.");
    return;
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}

module.exports = connectDB;
