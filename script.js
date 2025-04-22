// Fungsi untuk menambahkan tugas baru
async function addTask() {
    const taskInput = document.getElementById('taskInput');
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        alert('Silakan masukkan tugas!');
        return;
    }

    try {
        console.log('Mencoba menambahkan tugas:', taskText);
        const response = await fetch('/api/index', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'add',
                task: taskText
            })
        });

        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response data:', result);
        
        if (response.ok) {
            taskInput.value = '';
            loadTasks();
        } else {
            throw new Error(result.error || 'Gagal menambahkan tugas');
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Terjadi kesalahan saat menambahkan tugas');
    }
}

// Fungsi untuk memuat semua tugas
async function loadTasks() {
    try {
        // Memuat tugas aktif
        console.log('Memuat daftar tugas aktif...');
        const activeResponse = await fetch('/api/index?action=get');
        console.log('Active response status:', activeResponse.status);
        const activeResult = await activeResponse.json();
        console.log('Active response data:', activeResult);

        // Memuat tugas selesai
        console.log('Memuat daftar tugas selesai...');
        const completedResponse = await fetch('/api/index?action=get_completed');
        console.log('Completed response status:', completedResponse.status);
        const completedResult = await completedResponse.json();
        console.log('Completed response data:', completedResult);

        // Menampilkan tugas aktif
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '<h2>Tugas Aktif</h2>';
        
        if (activeResult.active && Array.isArray(activeResult.active)) {
            activeResult.active.forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.className = 'task-item';
                taskItem.innerHTML = `
                    <span>${task.task}</span>
                    <div>
                        <button onclick="completeTask(${task.id})">Selesai</button>
                        <button onclick="deleteTask(${task.id}, 'active')">Hapus</button>
                    </div>
                `;
                taskList.appendChild(taskItem);
            });
        }

        // Menampilkan tugas selesai
        const completedList = document.getElementById('completedList');
        if (!completedList) {
            const completedSection = document.createElement('div');
            completedSection.id = 'completedList';
            completedSection.innerHTML = '<h2>Tugas Selesai</h2>';
            taskList.parentNode.appendChild(completedSection);
        } else {
            completedList.innerHTML = '<h2>Tugas Selesai</h2>';
        }

        if (completedResult.completed && Array.isArray(completedResult.completed)) {
            completedResult.completed.forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.className = 'task-item completed';
                taskItem.innerHTML = `
                    <span>${task.task}</span>
                    <div>
                        <button onclick="deleteTask(${task.id}, 'completed')">Hapus</button>
                    </div>
                `;
                document.getElementById('completedList').appendChild(taskItem);
            });
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Terjadi kesalahan saat memuat tugas');
    }
}

// Fungsi untuk menandai tugas sebagai selesai
async function completeTask(id) {
    try {
        const response = await fetch('/api/index', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'complete',
                id: id
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            loadTasks();
        } else {
            throw new Error(result.error || 'Gagal menyelesaikan tugas');
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Terjadi kesalahan saat menyelesaikan tugas');
    }
}

// Fungsi untuk menghapus tugas
async function deleteTask(id, type) {
    if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
        return;
    }

    try {
        const response = await fetch('/api/index', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'delete',
                id: id,
                type: type
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            loadTasks();
        } else {
            throw new Error(result.error || 'Gagal menghapus tugas');
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Terjadi kesalahan saat menghapus tugas');
    }
}

// Memuat tugas saat halaman dimuat
document.addEventListener('DOMContentLoaded', loadTasks); 