
        // Global Variables
        let tasks = JSON.parse(localStorage.getItem('flowsync_tasks')) || [];
        let habits = JSON.parse(localStorage.getItem('flowsync_habits')) || [];
        let currentUser = JSON.parse(localStorage.getItem('flowsync_user')) || null;
        let currentTab = 'tasks';
        let timerInterval = null;
        let timerMinutes = 25;
        let timerSeconds = 0;
        let isTimerRunning = false;
        let currentDate = new Date();
        let editingTaskId = null;

        // Motivational quotes
        const quotes = [
            "The way to get started is to quit talking and begin doing. - Walt Disney",
            "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
            "The future depends on what you do today. - Mahatma Gandhi",
            "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
            "The secret of getting ahead is getting started. - Mark Twain",
            "It always seems impossible until it's done. - Nelson Mandela",
            "Your limitation—it's only your imagination.",
            "Push yourself, because no one else is going to do it for you.",
            "Great things never come from comfort zones.",
            "Dream it. Wish it. Do it."
        ];

        // Initialize App
        function initApp() {
            if (!currentUser) {
                showLogin();
            } else {
                showMainApp();
                renderTasks();
                renderHabits();
                updateStats();
                generateCalendar();
                setDailyQuote();
                startNotificationSystem();
            }
        }

        // Authentication Functions
        function showLogin() {
            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('signupPage').style.display = 'none';
            document.getElementById('mainApp').style.display = 'none';
        }

        function showSignup() {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('signupPage').style.display = 'flex';
            document.getElementById('mainApp').style.display = 'none';
        }

        function showMainApp() {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('signupPage').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
        }

        function login(event) {
            event.preventDefault();
            const email = event.target.querySelector('input[type="email"]').value;
            const password = event.target.querySelector('input[type="password"]').value;
            
            // Demo login - in real app, this would validate against a backend
            currentUser = {
                id: Date.now(),
                name: email.split('@')[0],
                email: email,
                profilePic: null,
                theme: 'light',
                joinDate: new Date().toISOString()
            };
            
            localStorage.setItem('flowsync_user', JSON.stringify(currentUser));
            showSuccessMessage('Welcome back! 🎉');
            showMainApp();
            renderTasks();
            renderHabits();
            updateStats();
            generateCalendar();
            setDailyQuote();
            startNotificationSystem();
        }

        function signup(event) {
            event.preventDefault();
            const formData = new FormData(event.target);
            const name = event.target.querySelector('input[placeholder="Full Name"]').value;
            const email = event.target.querySelector('input[type="email"]').value;
            const password = event.target.querySelector('input[type="password"]').value;
            const confirmPassword = event.target.querySelector('input[placeholder="Confirm Password"]').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            
            // Demo signup - in real app, this would create account on backend
            currentUser = {
                id: Date.now(),
                name: name,
                email: email,
                profilePic: null,
                theme: 'light',
                joinDate: new Date().toISOString()
            };
            
            localStorage.setItem('flowsync_user', JSON.stringify(currentUser));
            showSuccessMessage('Account created successfully! Welcome to FlowSync! 🚀');
            showMainApp();
            renderTasks();
            renderHabits();
            updateStats();
            generateCalendar();
            setDailyQuote();
            startNotificationSystem();
        }

        function socialLogin(provider) {
            // Demo social login - in real app, this would use OAuth
            currentUser = {
                id: Date.now(),
                name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
                email: `user@${provider}.com`,
                profilePic: null,
                theme: 'light',
                joinDate: new Date().toISOString()
            };
            
            localStorage.setItem('flowsync_user', JSON.stringify(currentUser));
            showSuccessMessage(`Signed in with ${provider}! 🎉`);
            showMainApp();
            renderTasks();
            renderHabits();
            updateStats();
            generateCalendar();
            setDailyQuote();
            startNotificationSystem();
        }

        function logout() {
            currentUser = null;
            localStorage.removeItem('flowsync_user');
            showLogin();
        }

        // Tab Navigation
        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.task-section').forEach(tab => {
                tab.style.display = 'none';
            });
            
            // Remove active class from all nav tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName + 'Tab').style.display = 'block';
            
            // Add active class to clicked nav tab
            event.target.classList.add('active');
            
            currentTab = tabName;
            
            // Update content based on tab
            if (tabName === 'calendar') {
                generateCalendar();
            } else if (tabName === 'analytics') {
                updateAnalytics();
            }
        }

        // Task Management
        function handleTaskInput(event) {
            if (event.key === 'Enter') {
                addTask();
            }
        }

        function addTask() {
            const taskInput = document.getElementById('taskInput');
            const taskText = taskInput.value.trim();
            
            if (!taskText) return;
            
            const category = document.getElementById('taskCategory').value;
            const priority = document.getElementById('taskPriority').value;
            const dueDate = document.getElementById('taskDueDate').value;
            const tags = document.getElementById('taskTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
            
            const task = {
                id: Date.now(),
                title: taskText,
                description: '',
                category: category,
                priority: priority,
                dueDate: dueDate,
                tags: tags,
                status: 'todo',
                completed: false,
                createdAt: new Date().toISOString(),
                subtasks: [],
                timeSpent: 0
            };
            
            // Auto-categorization based on keywords
            const workKeywords = ['meeting', 'project', 'deadline', 'client', 'work', 'office'];
            const healthKeywords = ['exercise', 'gym', 'run', 'workout', 'health', 'doctor'];
            const personalKeywords = ['family', 'friend', 'home', 'personal', 'birthday'];
            
            const lowerTitle = taskText.toLowerCase();
            if (workKeywords.some(keyword => lowerTitle.includes(keyword))) {
                task.category = 'work';
            } else if (healthKeywords.some(keyword => lowerTitle.includes(keyword))) {
                task.category = 'health';
            } else if (personalKeywords.some(keyword => lowerTitle.includes(keyword))) {
                task.category = 'personal';
            }
            
            tasks.push(task);
            saveTasks();
            renderTasks();
            updateStats();
            
            // Clear inputs
            taskInput.value = '';
            document.getElementById('taskTags').value = '';
            
            showSuccessMessage('Task added successfully! 📝');
        }

        function renderTasks() {
            const todoContainer = document.getElementById('todoTasks');
            const inprogressContainer = document.getElementById('inprogressTasks');
            const doneContainer = document.getElementById('doneTasks');
            
            // Clear containers
            todoContainer.innerHTML = '';
            inprogressContainer.innerHTML = '';
            doneContainer.innerHTML = '';
            
            // Group tasks by status
            const todoTasks = tasks.filter(task => task.status === 'todo');
            const inprogressTasks = tasks.filter(task => task.status === 'inprogress');
            const doneTasks = tasks.filter(task => task.status === 'done');
            
            // Render tasks in each column
            todoTasks.forEach(task => todoContainer.appendChild(createTaskCard(task)));
            inprogressTasks.forEach(task => inprogressContainer.appendChild(createTaskCard(task)));
            doneTasks.forEach(task => doneContainer.appendChild(createTaskCard(task)));
            
            // Update counters
            document.getElementById('todoCount').textContent = todoTasks.length;
            document.getElementById('inprogressCount').textContent = inprogressTasks.length;
            document.getElementById('doneCount').textContent = doneTasks.length;
        }

        function createTaskCard(task) {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.draggable = true;
            card.dataset.taskId = task.id;
            
            const categoryEmojis = {
                personal: '🏠',
                work: '💼',
                health: '🏃',
                learning: '📚',
                finance: '💰'
            };
            
            const priorityClass = `priority-${task.priority}`;
            
            card.innerHTML = `
                <div class="task-header">
                    <div class="task-title ${task.completed ? 'completed' : ''}">
                        <div class="task-checkbox ${task.completed ? 'completed' : ''}" onclick="toggleTaskComplete(${task.id})">
                            ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                        </div>
                        ${task.title}
                    </div>
                    <div class="task-actions">
                        <button class="task-action" onclick="editTask(${task.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="task-action" onclick="deleteTask(${task.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="task-action" onclick="startTaskTimer(${task.id})" title="Start Timer">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
                
                <div class="task-meta">
                    <span class="task-tag">${categoryEmojis[task.category]} ${task.category}</span>
                    <span class="task-priority ${priorityClass}">${task.priority.toUpperCase()}</span>
                    ${task.dueDate ? `<span class="task-tag">📅 ${formatDate(task.dueDate)}</span>` : ''}
                </div>
                
                ${task.tags.length > 0 ? `
                    <div class="task-meta">
                        ${task.tags.map(tag => `<span class="task-tag">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
                
                ${task.description ? `<p style="margin-top: 10px; color: var(--gray);">${task.description}</p>` : ''}
                
                ${task.subtasks.length > 0 ? `
                    <div style="margin-top: 10px;">
                        <small>Subtasks: ${task.subtasks.filter(st => st.completed).length}/${task.subtasks.length} completed</small>
                    </div>
                ` : ''}
            `;
            
            // Add drag event listeners
            card.addEventListener('dragstart', dragStart);
            card.addEventListener('dragend', dragEnd);
            
            return card;
        }

        function toggleTaskComplete(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                if (task.completed) {
                    task.status = 'done';
                    showSuccessMessage(getRandomQuote());
                    playCompletionSound();
                } else {
                    task.status = 'todo';
                }
                saveTasks();
                renderTasks();
                updateStats();
            }
        }

        function editTask(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                editingTaskId = taskId;
                
                // Populate modal with task data
                document.getElementById('modalTaskTitle').value = task.title;
                document.getElementById('modalTaskDescription').value = task.description || '';
                document.getElementById('modalTaskCategory').value = task.category;
                document.getElementById('modalTaskPriority').value = task.priority;
                document.getElementById('modalTaskDueDate').value = task.dueDate || '';
                document.getElementById('modalTaskTags').value = task.tags.join(', ');
                
                // Render subtasks
                renderSubtasks(task.subtasks);
                
                // Show modal
                document.getElementById('taskModal').style.display = 'block';
            }
        }

        function deleteTask(taskId) {
            if (confirm('Are you sure you want to delete this task?')) {
                tasks = tasks.filter(t => t.id !== taskId);
                saveTasks();
                renderTasks();
                updateStats();
                showSuccessMessage('Task deleted successfully! 🗑️');
            }
        }

        function startTaskTimer(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                document.getElementById('timerTask').textContent = `Working on: ${task.title}`;
                startTimer();
            }
        }

        // Drag and Drop
        function dragStart(e) {
            e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
            e.target.classList.add('dragging');
        }

        function dragEnd(e) {
            e.target.classList.remove('dragging');
        }

        function allowDrop(e) {
            e.preventDefault();
            e.currentTarget.classList.add('drag-over');
        }

        function drop(e) {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');
            
            const taskId = parseInt(e.dataTransfer.getData('text/plain'));
            const newStatus = e.currentTarget.dataset.status;
            
            const task = tasks.find(t => t.id === taskId);
            if (task && task.status !== newStatus) {
                task.status = newStatus;
                if (newStatus === 'done') {
                    task.completed = true;
                    showSuccessMessage(getRandomQuote());
                    playCompletionSound();
                } else {
                    task.completed = false;
                }
                saveTasks();
                renderTasks();
                updateStats();
            }
        }

        // Pomodoro Timer
        function startTimer() {
            if (!isTimerRunning) {
                isTimerRunning = true;
                timerInterval = setInterval(updateTimer, 1000);
            }
        }

        function pauseTimer() {
            isTimerRunning = false;
            clearInterval(timerInterval);
        }

        function resetTimer() {
            isTimerRunning = false;
            clearInterval(timerInterval);
            timerMinutes = 25;
            timerSeconds = 0;
            updateTimerDisplay();
            document.getElementById('timerTask').textContent = 'No task selected';
        }

        function updateTimer() {
            if (timerSeconds === 0) {
                if (timerMinutes === 0) {
                    // Timer finished
                    isTimerRunning = false;
                    clearInterval(timerInterval);
                    showSuccessMessage('Pomodoro session completed! Take a break! 🍅');
                    playNotificationSound();
                    
                    // Start break timer
                    timerMinutes = 5;
                    timerSeconds = 0;
                    updateTimerDisplay();
                    return;
                }
                timerMinutes--;
                timerSeconds = 59;
            } else {
                timerSeconds--;
            }
            updateTimerDisplay();
        }

        function updateTimerDisplay() {
            const display = document.getElementById('timerDisplay');
            display.textContent = `${timerMinutes.toString().padStart(2, '0')}:${timerSeconds.toString().padStart(2, '0')}`;
        }

        // Calendar
        function generateCalendar() {
            const calendarGrid = document.getElementById('calendarGrid');
            const currentMonthElement = document.getElementById('currentMonth');
            
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            
            currentMonthElement.textContent = new Date(year, month).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
            });
            
            calendarGrid.innerHTML = '';
            
            // Add day headers
            const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dayHeaders.forEach(day => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'calendar-day';
                dayHeader.style.fontWeight = 'bold';
                dayHeader.style.background = 'var(--primary)';
                dayHeader.style.color = 'white';
                dayHeader.textContent = day;
                calendarGrid.appendChild(dayHeader);
            });
            
            // Get first day of month and number of days
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            // Add empty cells for days before month starts
            for (let i = 0; i < firstDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day';
                calendarGrid.appendChild(emptyDay);
            }
            
            // Add days of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                dayElement.textContent = day;
                
                const dayDate = new Date(year, month, day);
                const today = new Date();
                
                if (dayDate.toDateString() === today.toDateString()) {
                    dayElement.classList.add('today');
                }
                
                // Check if day has tasks
                const dayTasks = tasks.filter(task => {
                    if (!task.dueDate) return false;
                    const taskDate = new Date(task.dueDate);
                    return taskDate.toDateString() === dayDate.toDateString();
                });
                
                if (dayTasks.length > 0) {
                    dayElement.classList.add('has-tasks');
                    dayElement.title = `${dayTasks.length} task(s) due`;
                }
                
                calendarGrid.appendChild(dayElement);
            }
        }

        function changeMonth(direction) {
            currentDate.setMonth(currentDate.getMonth() + direction);
            generateCalendar();
        }

        // Habits
        function addHabit() {
            const habitInput = document.getElementById('habitInput');
            const habitText = habitInput.value.trim();
            
            if (!habitText) return;
            
            const habit = {
                id: Date.now(),
                name: habitText,
                streak: 0,
                lastCompleted: null,
                createdAt: new Date().toISOString(),
                completedDates: []
            };
            
            habits.push(habit);
            saveHabits();
            renderHabits();
            
            habitInput.value = '';
            showSuccessMessage('Habit added successfully! 🎯');
        }

        function renderHabits() {
            const habitList = document.getElementById('habitList');
            habitList.innerHTML = '';
            
            habits.forEach(habit => {
                const habitItem = document.createElement('div');
                habitItem.className = 'habit-item';
                
                const today = new Date().toDateString();
                const completedToday = habit.completedDates.includes(today);
                
                habitItem.innerHTML = `
                    <div>
                        <h4>${habit.name}</h4>
                        <small>Created ${formatDate(habit.createdAt.split('T')[0])}</small>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="habit-streak">🔥 ${habit.streak} days</span>
                        <button class="task-action ${completedToday ? 'completed' : ''}" 
                                onclick="toggleHabit(${habit.id})" 
                                title="${completedToday ? 'Completed today' : 'Mark as done'}">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="task-action" onclick="deleteHabit(${habit.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                habitList.appendChild(habitItem);
            });
        }

        function toggleHabit(habitId) {
            const habit = habits.find(h => h.id === habitId);
            if (!habit) return;
            
            const today = new Date().toDateString();
            const completedToday = habit.completedDates.includes(today);
            
            if (completedToday) {
                // Remove from completed dates
                habit.completedDates = habit.completedDates.filter(date => date !== today);
                habit.streak = Math.max(0, habit.streak - 1);
            } else {
                // Add to completed dates
                habit.completedDates.push(today);
                
                // Update streak
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayString = yesterday.toDateString();
                
                if (habit.completedDates.includes(yesterdayString) || habit.streak === 0) {
                    habit.streak++;
                } else {
                    habit.streak = 1;
                }
                
                habit.lastCompleted = today;
                showSuccessMessage(`Great job! ${habit.name} streak: ${habit.streak} days! 🔥`);
            }
            
            saveHabits();
            renderHabits();
            updateStats();
        }

        function deleteHabit(habitId) {
            if (confirm('Are you sure you want to delete this habit?')) {
                habits = habits.filter(h => h.id !== habitId);
                saveHabits();
                renderHabits();
                showSuccessMessage('Habit deleted successfully! 🗑️');
            }
        }

        // Focus Mode
        function selectRandomTask() {
            const incompleteTasks = tasks.filter(task => !task.completed && task.status !== 'done');
            
            if (incompleteTasks.length === 0) {
                document.getElementById('noFocusTask').innerHTML = '<p>No tasks available for focus mode. Add some tasks first!</p>';
                return;
            }
            
            const randomTask = incompleteTasks[Math.floor(Math.random() * incompleteTasks.length)];
            
            document.getElementById('focusTask').style.display = 'block';
            document.getElementById('noFocusTask').style.display = 'none';
            
            document.getElementById('focusTaskContent').innerHTML = `
                <h4>${randomTask.title}</h4>
                <p>Category: ${randomTask.category}</p>
                <p>Priority: ${randomTask.priority}</p>
                ${randomTask.description ? `<p>Description: ${randomTask.description}</p>` : ''}
            `;
            
            // Store current focus task
            window.currentFocusTask = randomTask;
        }

        function completeFocusTask() {
            if (window.currentFocusTask) {
                toggleTaskComplete(window.currentFocusTask.id);
                document.getElementById('focusTask').style.display = 'none';
                document.getElementById('noFocusTask').style.display = 'block';
                document.getElementById('noFocusTask').innerHTML = `
                    <p>Task completed! Great job! 🎉</p>
                    <button class="add-btn" onclick="selectRandomTask()">Pick Another Task</button>
                `;
            }
        }

        // Statistics and Analytics
        function updateStats() {
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(task => task.completed).length;
            const todayTasks = tasks.filter(task => {
                const today = new Date().toDateString();
                const taskDate = new Date(task.createdAt).toDateString();
                return taskDate === today;
            }).length;
            const todayCompleted = tasks.filter(task => {
                const today = new Date().toDateString();
                const taskDate = new Date(task.createdAt).toDateString();
                return taskDate === today && task.completed;
            }).length;
            
            document.getElementById('totalTasks').textContent = totalTasks;
            document.getElementById('completedTasks').textContent = completedTasks;
            document.getElementById('todayTasks').textContent = todayTasks;
            document.getElementById('todayCompleted').textContent = todayCompleted;
            
            const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            document.getElementById('productivityScore').textContent = productivity + '%';
            
            // Calculate streak
            const streak = calculateStreak();
            document.getElementById('currentStreak').textContent = streak;
        }

        function updateAnalytics() {
            updateStats();
            // Additional analytics could be added here
        }

        function calculateStreak() {
            // Simple streak calculation based on consecutive days with completed tasks
            let streak = 0;
            const today = new Date();
            
            for (let i = 0; i < 30; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() - i);
                const dateString = checkDate.toDateString();
                
                const hasCompletedTasks = tasks.some(task => {
                    const taskDate = new Date(task.createdAt).toDateString();
                    return taskDate === dateString && task.completed;
                });
                
                if (hasCompletedTasks) {
                    streak++;
                } else {
                    break;
                }
            }
            
            return streak;
        }

        // Theme Management
        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            document.getElementById('themeIcon').className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            
            if (currentUser) {
                currentUser.theme = newTheme;
                localStorage.setItem('flowsync_user', JSON.stringify(currentUser));
            }
        }

        // Profile Management
        function showProfile() {
            if (currentUser) {
                document.getElementById('profileName').value = currentUser.name;
                document.getElementById('profileEmail').value = currentUser.email;
                document.getElementById('profileTheme').value = currentUser.theme || 'light';
            }
            document.getElementById('profileModal').style.display = 'block';
        }

        function updateProfilePicture(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Update profile picture display
                    const profilePics = document.querySelectorAll('.profile-pic');
                    profilePics.forEach(pic => {
                        pic.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                    });
                    
                    if (currentUser) {
                        currentUser.profilePic = e.target.result;
                        localStorage.setItem('flowsync_user', JSON.stringify(currentUser));
                    }
                };
                reader.readAsDataURL(file);
            }
        }

        // Modal Management
        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        // Subtasks
        function addSubtask() {
            const subtasksList = document.getElementById('subtasksList');
            const subtaskDiv = document.createElement('div');
            subtaskDiv.className = 'form-group';
            subtaskDiv.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="text" class="form-input" placeholder="Subtask title" style="flex: 1;">
                    <button type="button" class="task-action" onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            subtasksList.appendChild(subtaskDiv);
        }

        function renderSubtasks(subtasks) {
            const subtasksList = document.getElementById('subtasksList');
            subtasksList.innerHTML = '';
            
            subtasks.forEach(subtask => {
                const subtaskDiv = document.createElement('div');
                subtaskDiv.className = 'form-group';
                subtaskDiv.innerHTML = `
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="text" class="form-input" value="${subtask.title}" style="flex: 1;">
                        <input type="checkbox" ${subtask.completed ? 'checked' : ''}>
                        <button type="button" class="task-action" onclick="this.parentElement.parentElement.remove()">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                subtasksList.appendChild(subtaskDiv);
            });
        }

        // Utility Functions
        function formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }

        function getRandomQuote() {
            return quotes[Math.floor(Math.random() * quotes.length)];
        }

        function setDailyQuote() {
            document.getElementById('dailyQuote').innerHTML = `<p>"${getRandomQuote()}"</p>`;
        }

        function showSuccessMessage(message) {
            const successDiv = document.createElement('div');
            successDiv.className = 'success-animation';
            successDiv.textContent = message;
            document.body.appendChild(successDiv);
            
            setTimeout(() => {
                document.body.removeChild(successDiv);
            }, 2000);
        }

        function playCompletionSound() {
            // Create a simple beep sound using Web Audio API
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
            } catch (e) {
                // Fallback for browsers that don't support Web Audio API
                console.log('Task completed!');
            }
        }

        function playNotificationSound() {
            playCompletionSound();
        }

        function startNotificationSystem() {
            // Check for due tasks every minute
            setInterval(() => {
                const now = new Date();
                const dueTasks = tasks.filter(task => {
                    if (!task.dueDate || task.completed) return false;
                    const dueDate = new Date(task.dueDate);
                    const timeDiff = dueDate.getTime() - now.getTime();
                    const hoursDiff = timeDiff / (1000 * 3600);
                    return hoursDiff <= 1 && hoursDiff > 0; // Due within 1 hour
                });
                
                dueTasks.forEach(task => {
                    showSuccessMessage(`⏰ Reminder: "${task.title}" is due soon!`);
                });
            }, 60000); // Check every minute
        }

        // Data Persistence
        function saveTasks() {
            localStorage.setItem('flowsync_tasks', JSON.stringify(tasks));
        }

        function saveHabits() {
            localStorage.setItem('flowsync_habits', JSON.stringify(habits));
        }

        // Task Form Submission
        document.getElementById('taskForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (editingTaskId) {
                const task = tasks.find(t => t.id === editingTaskId);
                if (task) {
                    task.title = document.getElementById('modalTaskTitle').value;
                    task.description = document.getElementById('modalTaskDescription').value;
                    task.category = document.getElementById('modalTaskCategory').value;
                    task.priority = document.getElementById('modalTaskPriority').value;
                    task.dueDate = document.getElementById('modalTaskDueDate').value;
                    task.tags = document.getElementById('modalTaskTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
                    
                    // Update subtasks
                    const subtaskInputs = document.querySelectorAll('#subtasksList .form-input');
                    const subtaskCheckboxes = document.querySelectorAll('#subtasksList input[type="checkbox"]');
                    task.subtasks = [];
                    
                    subtaskInputs.forEach((input, index) => {
                        if (input.value.trim()) {
                            task.subtasks.push({
                                id: Date.now() + index,
                                title: input.value.trim(),
                                completed: subtaskCheckboxes[index] ? subtaskCheckboxes[index].checked : false
                            });
                        }
                    });
                    
                    saveTasks();
                    renderTasks();
                    updateStats();
                    closeModal('taskModal');
                    showSuccessMessage('Task updated successfully! ✏️');
                }
            }
            
            editingTaskId = null;
        });

        // Profile Form Submission
        document.getElementById('profileForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (currentUser) {
                currentUser.name = document.getElementById('profileName').value;
                currentUser.email = document.getElementById('profileEmail').value;
                currentUser.theme = document.getElementById('profileTheme').value;
                
                localStorage.setItem('flowsync_user', JSON.stringify(currentUser));
                
                // Apply theme
                document.documentElement.setAttribute('data-theme', currentUser.theme);
                document.getElementById('themeIcon').className = currentUser.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                
                closeModal('profileModal');
                showSuccessMessage('Profile updated successfully! 👤');
            }
        });

        // Close modals when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Initialize the app when page loads
        document.addEventListener('DOMContentLoaded', initApp);
