const express = require('express');
const { getAllUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get current user's data
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Return sanitized user object
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username
    };
    res.json(userResponse);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
