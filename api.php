<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Aktifkan error reporting untuk debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log semua request
error_log("Request Method: " . $_SERVER['REQUEST_METHOD']);
error_log("POST Data: " . print_r($_POST, true));
error_log("GET Data: " . print_r($_GET, true));

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "todo_db";

// Membuat koneksi
$conn = new mysqli($servername, $username, $password, $dbname);

// Memeriksa koneksi
if ($conn->connect_error) {
    error_log("Connection failed: " . $conn->connect_error);
    die(json_encode(['error' => 'Koneksi gagal: ' . $conn->connect_error]));
}

// Membuat tabel tugas aktif
$sql = "CREATE TABLE IF NOT EXISTS tasks (
    id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

if (!$conn->query($sql)) {
    error_log("Error creating tasks table: " . $conn->error);
    die(json_encode(['error' => 'Error creating tasks table: ' . $conn->error]));
}

// Membuat tabel tugas selesai
$sql = "CREATE TABLE IF NOT EXISTS completed_tasks (
    id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task VARCHAR(255) NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

if (!$conn->query($sql)) {
    error_log("Error creating completed_tasks table: " . $conn->error);
    die(json_encode(['error' => 'Error creating completed_tasks table: ' . $conn->error]));
}

// Mendapatkan aksi dari request
$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');
error_log("Action: " . $action);

switch ($action) {
    case 'get':
        // Mengambil tugas aktif
        $result = $conn->query("SELECT * FROM tasks ORDER BY created_at DESC");
        if (!$result) {
            error_log("Error in get query: " . $conn->error);
            echo json_encode(['error' => 'Error getting tasks: ' . $conn->error]);
            break;
        }
        $tasks = [];
        while ($row = $result->fetch_assoc()) {
            $tasks[] = $row;
        }
        echo json_encode(['active' => $tasks]);
        break;

    case 'get_completed':
        // Mengambil tugas selesai
        $result = $conn->query("SELECT * FROM completed_tasks ORDER BY completed_at DESC");
        if (!$result) {
            error_log("Error in get completed query: " . $conn->error);
            echo json_encode(['error' => 'Error getting completed tasks: ' . $conn->error]);
            break;
        }
        $tasks = [];
        while ($row = $result->fetch_assoc()) {
            $tasks[] = $row;
        }
        echo json_encode(['completed' => $tasks]);
        break;

    case 'add':
        if (!isset($_POST['task'])) {
            error_log("Task is required but not provided");
            echo json_encode(['error' => 'Task is required']);
            break;
        }
        $task = $conn->real_escape_string($_POST['task']);
        $sql = "INSERT INTO tasks (task) VALUES ('$task')";
        if ($conn->query($sql)) {
            echo json_encode(['success' => true]);
        } else {
            error_log("Error adding task: " . $conn->error);
            echo json_encode(['error' => 'Error adding task: ' . $conn->error]);
        }
        break;

    case 'complete':
        if (!isset($_POST['id'])) {
            echo json_encode(['error' => 'ID is required']);
            break;
        }
        $id = (int)$_POST['id'];
        
        // Mengambil tugas yang akan dipindahkan
        $sql = "SELECT task FROM tasks WHERE id = $id";
        $result = $conn->query($sql);
        if ($row = $result->fetch_assoc()) {
            $task = $row['task'];
            
            // Memindahkan ke tabel completed_tasks
            $sql = "INSERT INTO completed_tasks (task) VALUES ('" . $conn->real_escape_string($task) . "')";
            if ($conn->query($sql)) {
                // Menghapus dari tabel tasks
                $sql = "DELETE FROM tasks WHERE id = $id";
                if ($conn->query($sql)) {
                    echo json_encode(['success' => true]);
                } else {
                    error_log("Error deleting task: " . $conn->error);
                    echo json_encode(['error' => 'Error completing task: ' . $conn->error]);
                }
            } else {
                error_log("Error moving task to completed: " . $conn->error);
                echo json_encode(['error' => 'Error completing task: ' . $conn->error]);
            }
        } else {
            echo json_encode(['error' => 'Task not found']);
        }
        break;

    case 'delete':
        if (!isset($_POST['id']) || !isset($_POST['type'])) {
            echo json_encode(['error' => 'ID and type are required']);
            break;
        }
        $id = (int)$_POST['id'];
        $type = $_POST['type'];
        
        $table = ($type === 'completed') ? 'completed_tasks' : 'tasks';
        $sql = "DELETE FROM $table WHERE id = $id";
        
        if ($conn->query($sql)) {
            echo json_encode(['success' => true]);
        } else {
            error_log("Error deleting task: " . $conn->error);
            echo json_encode(['error' => 'Error deleting task: ' . $conn->error]);
        }
        break;

    default:
        error_log("Invalid action: " . $action);
        echo json_encode(['error' => 'Invalid action']);
        break;
}

$conn->close();
?> 