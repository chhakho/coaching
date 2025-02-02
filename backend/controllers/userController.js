const User = require('../models/User');

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const sanitizeUser = (user) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const validateId = (id) => {
  return !isNaN(id) && parseInt(id).toString() === id.toString();
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users.map(sanitizeUser));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    if (!validateId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    if (!validateId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Check if user is trying to modify their own data
    if (req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Not authorized to modify other users' });
    }

    // Validate email if it's being updated
    if (req.body.email && !validateEmail(req.body.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const updatedUser = await User.update(req.params.id, req.body);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(sanitizeUser(updatedUser));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (!validateId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Check if user is trying to delete their own account
    if (req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Not authorized to delete other users' });
    }

    const result = await User.delete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
