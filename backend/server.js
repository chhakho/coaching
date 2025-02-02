require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const db = require('./config/db');

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5001;
console.log(`Running in ${process.env.NODE_ENV || 'development'} mode`);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
