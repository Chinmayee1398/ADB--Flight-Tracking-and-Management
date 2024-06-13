require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('Connection error: ', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
