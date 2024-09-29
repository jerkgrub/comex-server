const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    // user details
    isActivated: Boolean,
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
      validate: {
        validator: function (v) {
          return v.endsWith("nu-moa.edu.ph");
        },
        message: (props) =>
          `${props.value} is not a valid email. It should end with '@nu-moa.edu.ph'`,
      },
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", function (next) {
  if (this.isModified("password")) {
    this.password = bcrypt.hashSync(this.password, 10);
  }
  next();
});

// UserSchema.pre("save", function (next) {
//   this.usertype = this.usertype.toLowerCase();
//   next();
// });

UserSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, usertype: this.usertype },
    "COMEX2024",
    { expiresIn: "1h" } // Token expires in 1 hour
  );
  return token;
};

const User = mongoose.model("User", UserSchema);
module.exports = User;
