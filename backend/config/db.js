const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2');
const path = require('path');

let db;

if (process.env.NODE_ENV === 'production') {
  db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
} else {
  db = new sqlite3.Database(path.join(__dirname, 'dev.db'));
}

// Initialize SQLite table for development
if (process.env.NODE_ENV !== 'production') {
  db.serialize(() => {
    // Drop existing users table if it exists
    db.run(`DROP TABLE IF EXISTS users`);
    
    console.log('Creating users table with updated schema...');
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('Users table created successfully');
      }
    });
  });
}

// Promisify database methods
const dbAsync = {
  get: (sql, params) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (error, result) => {
        if (error) reject(error);
        resolve(result);
      });
    });
  },
  run: (sql, params) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(error) {
        if (error) reject(error);
        resolve(this);
      });
    });
  },
  all: (sql, params) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (error, rows) => {
        if (error) reject(error);
        resolve(rows);
      });
    });
  }
};

module.exports = process.env.NODE_ENV === 'production' ? db : dbAsync;
