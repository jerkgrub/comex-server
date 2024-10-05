const User = require("../models/user_model");
const bcrypt = require("bcryptjs");

// 1. Create a New Account
const newAcc = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(400).json({
        message: "The email you have provided is already associated with an account.",
      });
    }

    // Create the new user
    const newUser = await User.create(req.body);
    res.json({ newUser, status: "Successfully inserted" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};

// 2. Find All Users
const findAllUser = async (req, res) => {
  try {
    const users = await User.find({}, 'firstName lastName email').lean(); // Projections to limit data
    res.json({ Users: users });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};

// 3. Find User by ID
const findOneUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ User: user });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};

// 4. Find User by Email
const findOneUserByEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ User: user });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};

// 5. Update User
const updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ updatedUser, status: "Successfully Updated the User" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};

// 6. Delete User
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id).lean();
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User successfully deleted", deletedUser });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};

// Authentication
const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email }).lean();

    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: "Email does not exist" });
    }

    // Check if the password is correct
    const isPasswordCorrect = bcrypt.compareSync(req.body.password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // If login is successful
    const token = user.generateAuthToken();
    const userInfo = {
      avatar: user.avatar,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      department: user.department,
      idNumber: user.idNumber,
      usertype: user.usertype,
      mobileNumber: user.mobileNumber,
      email: user.email,
    };

    const userTypeMessages = {
      admin: "Successfully logged in as Admin",
      "comex coordinator": "Successfully logged in as Comex Coordinator",
      faculty: "Successfully logged in as Faculty",
      ntp: "Successfully logged in as NTP",
      student: "Successfully logged in as Student",
    };

    const userType = user.usertype.toLowerCase(); // Normalize usertype to lowercase
    const message = userTypeMessages[userType] || "Role not recognized";

    res.status(200).json({
      message,
      token,
      user: userInfo,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

module.exports = {
  newAcc,      // Create
  findAllUser, // Read all users
  findOneUser, // Read user by ID
  findOneUserByEmail, // Read user by email
  updateUser,  // Update user
  deleteUser,  // Delete user
  login,       // Auth login
};
