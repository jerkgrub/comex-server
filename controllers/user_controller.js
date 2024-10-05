const User = require("../models/user_model");
const bcrypt = require("bcryptjs");

// 1. Create
const newAcc = (req, res) => {
  const { email } = req.body;

  // Check if the email already exists
  User.findOne({ email })
    .then((existingUser) => {
      if (existingUser) {
        // If the email is already registered
        return res.status(400).json({
          message:
            "The email you have provided is already associated with an account.",
        });
      }

      // If email is not used, create the new user
      User.create(req.body)
        .then((newAcc) => {
          res.json({ newAcc: newAcc, status: "successfully inserted" });
        })
        .catch((err) => {
          res.status(500).json({ message: "Something went wrong", error: err });
        });
    })
    .catch((err) => {
      res.status(500).json({ message: "Something went wrong", error: err });
    });
};

// 2. Read
const findAllUser = (req, res) => {
  User.find()
    .then((allDaUser) => {
      res.json({ Users: allDaUser });
    })
    .catch((err) => {
      res.json({ message: "Something went wrong", error: err });
    });
};
// FIND BY ID
const findOneUser = (req, res) => {
  User.findById(req.params.id)
    .then((user) => {
      if (user) {
        res.json({ User: user });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Something went wrong", error: err });
    });
};
// FIND BY EMAIL
const findOneUserByEmail = (req, res) => {
  User.findOne({ email: req.params.email })
    .then((user) => {
      if (user) {
        res.json({ User: user });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Something went wrong", error: err });
    });
};

// 3. Update
const updateUser = (req, res) => {
  User.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
    runValidators: true,
  })
    .then((updatedUser) => {
      res.json({
        updatedUser: updatedUser,
        status: "successfully Updated the User",
      });
    })
    .catch((err) => {
      res.json({ message: "Something went wrong", error: err });
    });
};

// 4. Delete
const deleteUser = (req, res) => {
  User.findOneAndDelete({ _id: req.params.id })
    .then((deletedUser) => {
      if (deletedUser) {
        res.json({ message: "User successfully deleted", deletedUser });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Something went wrong", error: err });
    });
};

// auth
const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: "Email does not exist" });
    }

    // Check if the password is correct
    const isPasswordCorrect = bcrypt.compareSync(
      req.body.password,
      user.password
    );
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

    const userType = user.usertype.toLowerCase(); // Normalizing usertype to lowercase
    const message = userTypeMessages[userType] || "Role not recognized";

    res.status(200).json({
      message,
      token,
      user: userInfo,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

module.exports = {
  // CRUD

  newAcc, //create

  findAllUser, //read
  findOneUser, //read
  findOneUserByEmail, //read

  updateUser, //update

  deleteUser, //delete

  // AUTH
  login,
};
