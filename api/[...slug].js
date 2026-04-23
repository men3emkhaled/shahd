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
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ZxUaqRlz2h5d@ep-polished-recipe-ali6join-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
        rejectUnauthorized: false
    }
});

// Initialize Database
const initDb = async () => {
    try {
        // Create table if not exists
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

        // Ensure columns exist (for existing tables)
        const columns = [
            { name: 'title', type: 'TEXT' },
            { name: 'image_url', type: 'TEXT' },
            { name: 'price', type: 'TEXT' }
        ];

        for (const col of columns) {
            await pool.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='${col.name}') THEN 
                        ALTER TABLE products ADD COLUMN ${col.name} ${col.type}; 
                    END IF; 
                END $$;
            `);
        }
        
        console.log('Database initialized and synced');
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
        if (!process.env.DATABASE_URL) {
            const availableKeys = Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('PASSWORD') && !k.includes('URL'));
            return res.status(500).json({ 
                error: 'DATABASE_URL is missing',
                detected_keys: Object.keys(process.env),
                message: 'Please ensure DATABASE_URL is added to Vercel Environment Variables'
            });
        }
        
        // Ensure table exists (auto-repair)
        await initDb();

        const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('API Error:', err);
        res.status(500).json({ 
            error: 'DB Error', 
            details: err.message,
            hint: 'Check if DATABASE_URL is correct and includes sslmode=require'
        });
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

if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

module.exports = app;
