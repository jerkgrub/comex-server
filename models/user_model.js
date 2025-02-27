// models/user_model.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config(); // Load environment variables

const UserSchema = new mongoose.Schema(
  {
    // User details
    isActivated: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: function () {
        // Auto-approve for non-crucial roles
        const nonCrucialRoles = ["ntp", "student", "faculty"];
        return nonCrucialRoles.includes(this.usertype?.toLowerCase());
      },
    },
    password: String,
    avatar: String,
    firstName: String,
    middleName: String,
    lastName: String,
    department: String,
    usertype: String,
    mobileNumber: String,
    idNumber: String,
    dateHired: String,
    email: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

// Hash the password and format name fields before saving the user model
UserSchema.pre("save", function (next) {
  if (this.isModified("password")) {
    this.password = bcrypt.hashSync(this.password, 10);
  }

  // Capitalize firstName, middleName, and lastName if provided
  if (this.firstName && typeof this.firstName === "string") {
    this.firstName =
      this.firstName.charAt(0).toUpperCase() +
      this.firstName.slice(1).toLowerCase();
  }
  if (this.middleName && typeof this.middleName === "string") {
    this.middleName =
      this.middleName.charAt(0).toUpperCase() +
      this.middleName.slice(1).toLowerCase();
  }
  if (this.lastName && typeof this.lastName === "string") {
    this.lastName =
      this.lastName.charAt(0).toUpperCase() +
      this.lastName.slice(1).toLowerCase();
  }

  next();
});

// Generate JWT token
UserSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, usertype: this.usertype },
    process.env.JWT_SECRET || "COMEX2024", // Use environment variable or default secret key
    { expiresIn: "1h" } // Token expires in 1 hour
  );
  return token;
};

const User = mongoose.model("User", UserSchema);
module.exports = User;
