// db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('First MongoDB connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  try {
    const conn2 = mongoose.createConnection(process.env.CHINMAYEE_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await conn2;
    console.log('Second MongoDB connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;