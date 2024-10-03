const mongoose = require("mongoose");

let isConnected; // Track connection state

// Use environment variables for sensitive info like the connection string
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://nucasajerick:5sAb73lTrLX0c6Fy@cluster0.khsbida.mongodb.net/comexconnect";

const connectToDatabase = async () => {
  if (isConnected) {
    // If already connected, reuse the connection
    console.log("Reusing existing database connection");
    return;
  }

  try {
    const connection = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      poolSize: 20,
    });
    isConnected = connection.connections[0].readyState;
    console.log("New connection to MongoDB established");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error; // Ensure that the error is handled in the calling function
  }
};

module.exports = connectToDatabase;
