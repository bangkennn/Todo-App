const mysql = require('mysql2/promise');
require('dotenv').config();

// Log environment variables (akan dihapus password-nya)
console.log('Database Config:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    // tidak menampilkan password untuk keamanan
});

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: true
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test koneksi database
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('Database connection error:', error);
        return false;
    }
}

// Handler untuk mendapatkan tugas aktif
async function getTasks(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
        console.log('Retrieved tasks:', rows);
        return { active: rows };
    } catch (error) {
        console.error('Error getting tasks:', error);
        throw new Error(`Error getting tasks: ${error.message}`);
    }
}

// Handler untuk mendapatkan tugas selesai
async function getCompletedTasks(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM completed_tasks ORDER BY completed_at DESC');
        console.log('Retrieved completed tasks:', rows);
        return { completed: rows };
    } catch (error) {
        console.error('Error getting completed tasks:', error);
        throw new Error(`Error getting completed tasks: ${error.message}`);
    }
}

// Handler untuk menambah tugas
async function addTask(req) {
    console.log('Add task request body:', req.body);
    
    const { task } = req.body;
    if (!task) {
        throw new Error('Task is required');
    }

    try {
        const [result] = await pool.query('INSERT INTO tasks (task) VALUES (?)', [task]);
        console.log('Task added successfully:', result);
        return { success: true, id: result.insertId };
    } catch (error) {
        console.error('Error adding task:', error);
        throw new Error(`Error adding task: ${error.message}`);
    }
}

// Handler untuk menyelesaikan tugas
async function completeTask(req) {
    console.log('Complete task request body:', req.body);
    
    const { id } = req.body;
    if (!id) {
        throw new Error('ID is required');
    }

    try {
        // Get task
        const [rows] = await pool.query('SELECT task FROM tasks WHERE id = ?', [id]);
        if (rows.length === 0) {
            throw new Error('Task not found');
        }

        // Move to completed_tasks
        await pool.query('INSERT INTO completed_tasks (task) VALUES (?)', [rows[0].task]);
        
        // Delete from tasks
        await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
        
        console.log('Task completed successfully');
        return { success: true };
    } catch (error) {
        console.error('Error completing task:', error);
        throw new Error(`Error completing task: ${error.message}`);
    }
}

// Handler untuk menghapus tugas
async function deleteTask(req) {
    console.log('Delete task request body:', req.body);
    
    const { id, type } = req.body;
    if (!id || !type) {
        throw new Error('ID and type are required');
    }

    try {
        const table = type === 'completed' ? 'completed_tasks' : 'tasks';
        await pool.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
        console.log('Task deleted successfully');
        return { success: true };
    } catch (error) {
        console.error('Error deleting task:', error);
        throw new Error(`Error deleting task: ${error.message}`);
    }
}

// Main handler untuk semua request
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Test database connection
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Could not connect to database');
        }

        console.log('Request method:', req.method);
        console.log('Request query:', req.query);
        console.log('Request body:', req.body);

        const action = req.query.action || (req.body && req.body.action);
        console.log('Action:', action);

        let result;
        switch (action) {
            case 'get':
                result = await getTasks(req);
                break;
            case 'get_completed':
                result = await getCompletedTasks(req);
                break;
            case 'add':
                result = await addTask(req);
                break;
            case 'complete':
                result = await completeTask(req);
                break;
            case 'delete':
                result = await deleteTask(req);
                break;
            default:
                throw new Error('Invalid action');
        }

        res.json(result);
    } catch (error) {
        console.error('Error in main handler:', error);
        res.status(500).json({ error: error.message });
    }
}; 