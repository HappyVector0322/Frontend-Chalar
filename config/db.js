// db.js
// db.js

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
//    await mongoose.connect('mongodb://127.0.0.1:27017/hubspotapp');
    await mongoose.connect('mongodb+srv://jordanlineberry2:fnKts7YtaqNgqHe0@cluster0.wfglz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

    console.log('MongoDB Connected...');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
