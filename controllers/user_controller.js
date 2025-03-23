// controllers/user_controller.js
const { put } = require('@vercel/blob');
const multer = require('multer');
const User = require('../models/user_model');
const bcrypt = require('bcryptjs');
const { notifyAdminsAboutNewUser } = require('./notification_controller');

// Set up Multer to store files in memory temporarily
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});
// Controller to handle signature upload
const uploadSignature = async (req, res) => {
  const signatureFile = req.file; // Multer provides the file as req.file
  const userId = req.params.id; // Assuming signature is tied to the user ID

  if (!signatureFile) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Upload the image to Vercel Blob
    const { url } = await put(`signatures/${userId}-${Date.now()}.png`, signatureFile.buffer, {
      access: 'public'
    });

    // Update MongoDB with the new signature URL
    const user = await User.findByIdAndUpdate(userId, { signature: url }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Signature uploaded successfully', signatureUrl: url, user });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading signature', error });
  }
};

// Controller to handle avatar upload
const uploadAvatar = async (req, res) => {
  const avatarFile = req.file; // Multer provides the file as req.file
  const userId = req.params.id; // Assuming avatar is tied to the user ID

  if (!avatarFile) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Upload the image to Vercel Blob
    const { url } = await put(`avatars/${userId}-${Date.now()}.png`, avatarFile.buffer, {
      access: 'public'
    });

    // Update MongoDB with the new avatar URL
    const user = await User.findByIdAndUpdate(userId, { avatar: url }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Avatar uploaded successfully', avatarUrl: url, user });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading avatar', error });
  }
};

const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  console.log('[DEBUG] Reset password request received for email:', email);

  try {
    // Find the user by email
    console.log('[DEBUG] Looking up user with email:', email);
    const user = await User.findOne({ email });

    if (!user) {
      console.log('[DEBUG] User not found for email:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('[DEBUG] User found, updating password for user ID:', user._id);
    // Update the user's password directly (hashing will be handled in the pre-save hook)
    user.password = newPassword;
    await user.save();
    console.log('[DEBUG] Password reset successful for email:', email);

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('[DEBUG] Error resetting password:', error);
    return res.status(500).json({ message: 'Error resetting password', error });
  }
};

// New method to fetch approved users
const getApprovedUsers = async (req, res) => {
  try {
    const approvedUsers = await User.find({ isApproved: true, isActivated: true })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ users: approvedUsers });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching approved users', error: err });
  }
};

// New method to fetch pending approval users
const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ isApproved: false, isActivated: true })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ users: pendingUsers });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pending users', error: err });
  }
};

// New method to approve a user
const approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User approved successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Error approving user', error: err });
  }
};

// Modify the existing newAcc method to handle auto-approval and provide detailed error handling
const newAcc = async (req, res) => {
  try {
    const { email, usertype } = req.body;

    // Log the full request body for debugging
    console.log('newAcc received body:', req.body);

    // Validate that 'usertype' is provided as a non-empty string
    if (!usertype || typeof usertype !== 'string' || usertype.trim() === '') {
      console.error('Invalid usertype provided in newAcc:', usertype);
      return res.status(400).json({
        message: 'Usertype is required and must be a non-empty string'
      });
    }

    // Similarly validate that 'email' is provided as a non-empty string
    if (!email || typeof email !== 'string' || email.trim() === '') {
      console.error('Invalid email provided in newAcc:', email);
      return res.status(400).json({ message: 'Email is required and must be a non-empty string' });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email already associated with an account.'
      });
    }

    // Auto-approve for non-crucial roles
    const nonCrucialRoles = ['ntp', 'student', 'faculty'];
    const isApproved = nonCrucialRoles.includes(usertype.toLowerCase());

    const newUser = new User({
      ...req.body,
      isApproved
    });

    const savedUser = await newUser.save();

    // Notify admins and coordinators about the new user
    await notifyAdminsAboutNewUser(savedUser);

    res.json({
      newAcc: savedUser,
      status: isApproved ? 'Account created and approved' : 'Account created, pending approval'
    });
  } catch (err) {
    console.error('Error in newAcc:', err);
    res.status(500).json({ message: 'Error creating account', error: err });
  }
};

// 2. Read all users - Modified to only show activated users
const findAllUser = (req, res) => {
  User.find({ isActivated: true })
    .select('-password') // Exclude password field
    .then(allDaUser => {
      res.json({ Users: allDaUser });
    })
    .catch(err => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};

// Get deactivated users
const getDeactivatedUsers = (req, res) => {
  User.find({ isActivated: false })
    .select('-password') // Exclude password field
    .then(deactivatedUsers => {
      res.json({ Users: deactivatedUsers });
    })
    .catch(err => {
      res.status(500).json({ message: 'Error fetching deactivated users', error: err });
    });
};

// Deactivate a user
const deactivateUser = (req, res) => {
  User.findByIdAndUpdate(req.params.id, { isActivated: false }, { new: true })
    .select('-password')
    .then(deactivatedUser => {
      if (!deactivatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({
        message: 'User successfully deactivated',
        user: deactivatedUser
      });
    })
    .catch(err => {
      res.status(500).json({ message: 'Error deactivating user', error: err });
    });
};

// Restore a deactivated user
const restoreUser = (req, res) => {
  User.findByIdAndUpdate(req.params.id, { isActivated: true }, { new: true })
    .select('-password')
    .then(restoredUser => {
      if (!restoredUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({
        message: 'User successfully restored',
        user: restoredUser
      });
    })
    .catch(err => {
      res.status(500).json({ message: 'Error restoring user', error: err });
    });
};

// Find user by ID
// controllers/user_controller.js

const findOneUser = (req, res) => {
  User.findById(req.params.id)
    .select('-password') // Exclude password field
    .then(user => {
      if (user) {
        res.json({ User: user });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    })
    .catch(err => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};

// Find user by Email
const findOneUserByEmail = (req, res) => {
  User.findOne({ email: req.params.email })
    .then(user => {
      if (user) {
        res.json({ User: user });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    })
    .catch(err => {
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

  if (req.body.usertype) {
    updateData.usertype = req.body.usertype;
  }

  // Update dateHired if provided
  if (req.body.dateHired) {
    updateData.dateHired = req.body.dateHired;
  }

  // Handle `isActivated` separately to ensure it's a Boolean
  if (req.body.hasOwnProperty('isActivated')) {
    const isActivatedValue = req.body.isActivated;
    console.log('isActivatedValue before conversion:', isActivatedValue);
    if (typeof isActivatedValue === 'string') {
      updateData.isActivated = isActivatedValue.toLowerCase() === 'true';
    } else {
      updateData.isActivated = Boolean(isActivatedValue);
    }
    console.log('isActivatedValue after conversion:', updateData.isActivated);
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
    runValidators: true
  })
    .then(updatedUser => {
      res.json({
        updatedUser: updatedUser,
        status: 'Successfully updated the user'
      });
    })
    .catch(err => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};

// 4. Delete user
const deleteUser = (req, res) => {
  User.findOneAndDelete({ _id: req.params.id })
    .then(deletedUser => {
      if (deletedUser) {
        res.json({ message: 'User successfully deleted', deletedUser });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    })
    .catch(err => {
      res.status(500).json({ message: 'Something went wrong', error: err });
    });
};

// Modify the login method to check approval status and activation
const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(401).json({ message: 'Email does not exist' });
    }

    // Check if user is approved
    if (!user.isApproved) {
      return res.status(403).json({ message: 'Account pending approval' });
    }

    // Check if user is activated
    if (!user.isActivated) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Check if the password is correct
    const isPasswordCorrect = bcrypt.compareSync(req.body.password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // If login is successful
    const token = user.generateAuthToken();
    const userInfo = {
      _id: user._id,
      avatar: user.avatar,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      department: user.department,
      idNumber: user.idNumber,
      usertype: user.usertype,
      mobileNumber: user.mobileNumber,
      email: user.email
    };

    const userTypeMessages = {
      admin: 'Successfully logged in as Admin',
      'comex coordinator': 'Successfully logged in as Comex Coordinator',
      faculty: 'Successfully logged in as Faculty',
      ntp: 'Successfully logged in as NTP',
      student: 'Successfully logged in as Student'
    };

    const userType = user.usertype.toLowerCase();
    const message = userTypeMessages[userType] || 'Role not recognized';

    res.status(200).json({
      message,
      token,
      user: userInfo
    });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
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
  uploadAvatar, // Upload avatar
  upload, // multer
  uploadSignature, // Upload signature
  getApprovedUsers,
  getPendingUsers,
  approveUser,
  deactivateUser, // Deactivate user
  restoreUser, // Restore user
  getDeactivatedUsers // Get deactivated users
};
