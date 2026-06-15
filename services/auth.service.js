const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User.model');
const authConfig = require('../config/auth.config');
const emailService = require('../utils/email.service');

const generateToken = (id) => {
  return jwt.sign({ id }, authConfig.secret, {
    expiresIn: authConfig.expiresIn
  });
};

const register = async (userData) => {
  const { firstName, lastName, email, password, clinicName, phone } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email already in use');
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    firstName,
    lastName,
    email,
    passwordHash,
    clinicName,
    phone,
    role: 'clinic'
  });

  return generateToken(user._id);
};

const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  user.lastLogin = Date.now();
  await user.save();

  return generateToken(user._id);
};

const forgotPassword = async (email, resetUrlBase) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('There is no user with that email address.');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins

  await user.save({ validateBeforeSave: false });

  const resetURL = `${resetUrlBase}?token=${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await emailService.sendEmail(
      user.email,
      'Your password reset token (valid for 10 min)',
      message,
      `<p>Forgot your password? Click <a href="${resetURL}">here</a> to reset it.</p>`
    );
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new Error('There was an error sending the email. Try again later!');
  }
};

const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new Error('Token is invalid or has expired');
  }

  const salt = await bcrypt.genSalt(12);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return generateToken(user._id);
};

const getUserById = async (id) => {
  return await User.findById(id).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getUserById
};
