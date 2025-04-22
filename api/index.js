const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: true
    }
});

// Handler untuk mendapatkan tugas aktif
async function getTasks(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
        return { active: rows };
    } catch (error) {
        console.error('Error getting tasks:', error);
        throw new Error('Error getting tasks');
    }
}

// Handler untuk mendapatkan tugas selesai
async function getCompletedTasks(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM completed_tasks ORDER BY completed_at DESC');
        return { completed: rows };
    } catch (error) {
        console.error('Error getting completed tasks:', error);
        throw new Error('Error getting completed tasks');
    }
}

// Handler untuk menambah tugas
async function addTask(req) {
    const { task } = req.body;
    if (!task) {
        throw new Error('Task is required');
    }

    try {
        const [result] = await pool.query('INSERT INTO tasks (task) VALUES (?)', [task]);
        return { success: true, id: result.insertId };
    } catch (error) {
        console.error('Error adding task:', error);
        throw new Error('Error adding task');
    }
}

// Handler untuk menyelesaikan tugas
async function completeTask(req) {
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
        
        return { success: true };
    } catch (error) {
        console.error('Error completing task:', error);
        throw new Error('Error completing task');
    }
}

// Handler untuk menghapus tugas
async function deleteTask(req) {
    const { id, type } = req.body;
    if (!id || !type) {
        throw new Error('ID and type are required');
    }

    try {
        const table = type === 'completed' ? 'completed_tasks' : 'tasks';
        await pool.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
        return { success: true };
    } catch (error) {
        console.error('Error deleting task:', error);
        throw new Error('Error deleting task');
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
        const action = req.query.action || (req.body && req.body.action);

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
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
}; 