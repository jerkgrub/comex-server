// controllers/user_controller.js
const User = require('../models/user_model');
const bcrypt = require('bcryptjs');

const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    return res.status(500).json({ message: 'Error resetting password', error });
  }
};

// 1. Create a new account
const newAcc = (req, res) => {
  const { email } = req.body;

  // Check if the email already exists
  User.findOne({ email })
    .then((existingUser) => {
      if (existingUser) {
        return res.status(400).json({
          message:
            'The email you have provided is already associated with an account.',
        });
      }

      // If email is not used, create the new user
      const newUser = new User(req.body);
      // Password will be hashed in the pre-save hook
      newUser
        .save()
        .then((newAcc) => {
          res.json({ newAcc: newAcc, status: 'Successfully registered' });
        })
        .catch((err) => {
          res.status(500).json({ message: 'Something went wrong', error: err });
        });
    })
    .catch((err) => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};

// 2. Read all users
const findAllUser = (req, res) => {
  User.find()
    .select('-password') // Exclude password field
    .then((allDaUser) => {
      res.json({ Users: allDaUser });
    })
    .catch((err) => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};

// Find user by ID
// controllers/user_controller.js

const findOneUser = (req, res) => {
  User.findById(req.params.id)
    .select('-password') // Exclude password field
    .then((user) => {
      if (user) {
        res.json({ User: user });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};


// Find user by Email
const findOneUserByEmail = (req, res) => {
  User.findOne({ email: req.params.email })
    .then((user) => {
      if (user) {
        res.json({ User: user });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};

// 3. Update user
const updateUser = (req, res) => {
  // Create an object to hold the fields to update
  const updateData = {};

  // Update firstName if provided
  if (req.body.firstName) {
    updateData.firstName = req.body.firstName;
  }

  // Update middleName if provided
  if (req.body.middleName) {
    updateData.middleName = req.body.middleName;
  }

  // Update lastName if provided
  if (req.body.lastName) {
    updateData.lastName = req.body.lastName;
  }

  // Update idNumber if provided
  if (req.body.idNumber) {
    updateData.idNumber = req.body.idNumber;
  }

  // Update mobileNumber if provided
  if (req.body.mobileNumber) {
    updateData.mobileNumber = req.body.mobileNumber;
  }

  // Update department if provided
  if (req.body.department) {
    updateData.department = req.body.department;
  }

  // Update email if provided
  if (req.body.email) {
    updateData.email = req.body.email;
  }

  // Update password if provided and not empty
  if (typeof req.body.password === 'string' && req.body.password.trim() !== '') {
    updateData.password = bcrypt.hashSync(req.body.password, 10);
  }

  // Find the user and update with the new data
  User.findOneAndUpdate({ _id: req.params.id }, updateData, {
    new: true,
    runValidators: true,
  })
    .then((updatedUser) => {
      res.json({
        updatedUser: updatedUser,
        status: 'Successfully updated the user',
      });
    })
    .catch((err) => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};




// 4. Delete user
const deleteUser = (req, res) => {
  User.findOneAndDelete({ _id: req.params.id })
    .then((deletedUser) => {
      if (deletedUser) {
        res.json({ message: 'User successfully deleted', deletedUser });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};

// User login
const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Email does not exist' });
    }

    // Check if the password is correct
    const isPasswordCorrect = bcrypt.compareSync(
      req.body.password,
      user.password
    );
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Incorrect password' });
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
      admin: 'Successfully logged in as Admin',
      'comex coordinator': 'Successfully logged in as Comex Coordinator',
      faculty: 'Successfully logged in as Faculty',
      ntp: 'Successfully logged in as NTP',
      student: 'Successfully logged in as Student',
    };

    const userType = user.usertype.toLowerCase();
    const message = userTypeMessages[userType] || 'Role not recognized';

    res.status(200).json({
      message,
      token,
      user: userInfo,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Something went wrong', error: error.message });
  }
};

module.exports = {
  resetPassword, // Reset Password
  newAcc, // Create
  findAllUser, // Read all users
  findOneUser, // Read by ID
  findOneUserByEmail, // Read by Email
  updateUser, // Update
  deleteUser, // Delete
  login, // Authentication
};
