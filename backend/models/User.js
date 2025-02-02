const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async create(user) {
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    console.log('Preparing to insert user into database:', {
      username: user.username,
      email: user.email,
      name: user.name
    });
    
    const sql = `INSERT INTO users (username, email, password, name) VALUES (?, ?, ?, ?)`;
    console.log('Executing SQL:', sql);
    
    const result = await db.run(sql, [user.username, user.email, hashedPassword, user.name]);
    console.log('Database insert result:', result);
    return {
      id: result.lastID,
      username: user.username,
      email: user.email,
      name: user.name
    };
  }

  static async findByEmail(email) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    return db.get(sql, [email]);
  }

  static async findById(id) {
    const sql = `SELECT * FROM users WHERE id = ?`;
    return db.get(sql, [id]);
  }

  static async update(id, user) {
    const updates = [];
    const params = [];
    
    if (user.username) {
      updates.push('username = ?');
      params.push(user.username);
    }
    if (user.email) {
      updates.push('email = ?');
      params.push(user.email);
    }
    if (user.password) {
      updates.push('password = ?');
      params.push(await bcrypt.hash(user.password, 10));
    }
    if (user.name) {
      updates.push('name = ?');
      params.push(user.name);
    }
    
    if (updates.length === 0) return null;
    
    params.push(id);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await db.run(sql, params);
    
    return this.findById(id);
  }

  static async delete(id) {
    const sql = `DELETE FROM users WHERE id = ?`;
    return db.run(sql, [id]);
  }

  static async getAll() {
    const sql = `SELECT * FROM users`;
    return db.all(sql);
  }
}

module.exports = User;
