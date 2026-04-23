const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'shahd-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Initialize Database
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                title TEXT,
                category TEXT NOT NULL,
                image_url TEXT NOT NULL,
                price TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Database initialized');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};
initDb();

// Auth Middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.admin) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Routes
app.post(['/api/login', '/login'], (req, res) => {
    const { username, password } = req.body;
    const adminUser = 'handmade';
    const adminPass = process.env.ADMIN_PASSWORD || 'handmade@2026';

    if (username === adminUser && password === adminPass) {
        req.session.admin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post(['/api/logout', '/logout'], (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get(['/api/check-auth', '/check-auth'], (req, res) => {
    res.json({ authenticated: !!req.session.admin });
});

// Get all products
app.get(['/api/products', '/products'], async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post(['/api/products', '/products'], isAuthenticated, async (req, res) => {
    try {
        const { title, category, imageUrl, price } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is required' });
        }

        // Save to Database
        const result = await pool.query(
            'INSERT INTO products (title, category, image_url, price) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, category, imageUrl, price]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Save error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Delete product
app.delete(['/api/products/:id', '/products/:id'], isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

module.exports = app;
