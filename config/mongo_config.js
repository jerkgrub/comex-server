// config/mongo_config.js
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in your .env file.');
}

/**
 * In serverless environments, it's important to reuse the database connection across function invocations.
 * We'll use a global variable to store the connection.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    // If connection is already established, return it
    return cached.conn;
  }

  if (!cached.promise) {
    // If no connection promise exists, create one
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      })
      .then(mongoose => {
        console.log('New connection to MongoDB established');
        return mongoose;
      })
      .catch(error => {
        console.error('Error connecting to MongoDB:', error);
        throw error; // Ensure that the error is handled in the calling function
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectToDatabase;
