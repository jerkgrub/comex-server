const mongoose = require("mongoose");

// Use environment variables to store sensitive info like the connection string
const MONGODB_URI =
  process.env.MONGODB_URI ||
  // "mongodb+srv://nucasajerick:5sAb73lTrLX0c6Fy@cluster0.khsbida.mongodb.net/comexconnect";
  "mongodb://127.0.0.1:27017/comexconnect"

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Established a connection to the database"))
  .catch((err) =>
    console.log("Something went wrong when connecting to the database", err)
  );
