const User = require('../models/User');
const { generateToken } = require('../config/auth');
const bcrypt = require('bcryptjs');

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const register = async (req, res) => {
  try {
    console.log('Registration request received:', {
      ...req.body,
      password: '[REDACTED]'
    });
    
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const username = email.split('@')[0];
    
    console.log('Checking for existing user with email:', email);
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    console.log('Creating new user with username:', username);
    const user = await User.create({ username, email, password, name });
    console.log('User created successfully:', {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name
    });
    const token = generateToken(user);
    
    // Return sanitized user object (without password)
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username
    };

    res.status(201).json({ token, user: userResponse });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    
    // Return sanitized user object (without password)
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username
    };

    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie('token');
    res.status(200).json({ message: 'Successfully logged out' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login, logout };
