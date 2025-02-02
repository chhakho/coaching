require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');

// Use a separate test database
const testDb = new sqlite3.Database(':memory:');

// Promisify database methods
const dbAsync = {
  get: (sql, params) => {
    return new Promise((resolve, reject) => {
      testDb.get(sql, params, (error, result) => {
        if (error) reject(error);
        resolve(result);
      });
    });
  },
  run: (sql, params) => {
    return new Promise((resolve, reject) => {
      testDb.run(sql, params, function(error) {
        if (error) reject(error);
        resolve(this);
      });
    });
  },
  all: (sql, params) => {
    return new Promise((resolve, reject) => {
      testDb.all(sql, params, (error, rows) => {
        if (error) reject(error);
        resolve(rows);
      });
    });
  }
};

// Mock the database module
jest.mock('../config/db', () => {
  return dbAsync;
});

// Initialize test database
const initializeTestDb = async () => {
  return new Promise((resolve, reject) => {
    testDb.serialize(() => {
      testDb.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          email TEXT UNIQUE,
          password TEXT,
          name TEXT
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
};

// Clear test database
const clearTestDb = async () => {
  return new Promise((resolve, reject) => {
    testDb.run('DELETE FROM users', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

function createTestApp() {
// Only create the app instance without starting the server
const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Don't call app.listen() as supertest manages the connections
return app;
}

// Setup and teardown helpers
const setupTestDb = async () => {
  await initializeTestDb();
};

const teardownTestDb = async () => {
  await clearTestDb();
  await new Promise((resolve) => testDb.close(resolve));
};

module.exports = { 
  createTestApp,
  setupTestDb,
  teardownTestDb,
  clearTestDb
};
