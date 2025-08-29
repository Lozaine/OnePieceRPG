require('dotenv').config();
const { pool } = require('./database');
const fs = require('fs');
const path = require('path');

const initDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log('Initializing database...');
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await client.query(schema);
        console.log('Database initialized successfully!');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        client.release();
        pool.end();
    }
};

initDatabase();
