import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  mint: { type: String, unique: true, required: true },
});

const Token = mongoose.model("Token", tokenSchema);

export default Token;
