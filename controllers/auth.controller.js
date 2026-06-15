const authService = require('../services/auth.service');

exports.register = async (req, res, next) => {
  try {
    const token = await authService.register(req.body);
    res.status(201).json({ status: 'success', token });
  } catch (error) {
    if (error.message === 'Email already in use') {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const token = await authService.login(email, password);
    res.status(200).json({ status: 'success', token });
  } catch (error) {
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ message: error.message });
    }
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const resetUrlBase = `${req.protocol}://${req.get('host')}/reset-password`; // Or your frontend URL
    await authService.forgotPassword(req.body.email, resetUrlBase);
    res.status(200).json({ status: 'success', message: 'Token sent to email!' });
  } catch (error) {
    if (error.message === 'There is no user with that email address.') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const jwtToken = await authService.resetPassword(token, password);
    res.status(200).json({ status: 'success', token: jwtToken });
  } catch (error) {
    if (error.message === 'Token is invalid or has expired') {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id);
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) {
    next(error);
  }
};
