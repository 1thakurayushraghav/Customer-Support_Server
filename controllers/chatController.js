import Conversation from "../models/Conversation.js";
import axios from "axios";

export const sendMessage = async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  let convo = await Conversation.findOne({ userId });

  if (!convo) {
    convo = await Conversation.create({ userId, messages: [] });
  }

  // save user message
  convo.messages.push({ role: "user", content: message });

  const history = convo.messages.slice(-10);

  // call FastAPI
  const aiRes = await axios.post(`${process.env.AI_URL}/chat`, {
    messages: history
  });

  const reply = aiRes.data.reply;

  // save AI reply
  convo.messages.push({ role: "assistant", content: reply });

  await convo.save();

  res.json({ reply });
};