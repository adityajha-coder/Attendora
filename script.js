// --- Static Animations ---
const canvas = document.getElementById('shooting-stars-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let stars = [], shootingStars = [];
function initStars() { stars = []; for (let i = 0; i < 100; i++) stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: Math.random() * 1.5, alpha: Math.random(), dAlpha: 0.01 + Math.random() * 0.01 }); }
function drawStars() { stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`; ctx.fill(); s.alpha += s.dAlpha; if (s.alpha > 1 || s.alpha < 0) s.dAlpha *= -1; }); }
function createShootingStar() { if (Math.random() < 0.02) { shootingStars.push({ x: Math.random() * canvas.width, y: Math.random() > 0.5 ? 0 : Math.random() * canvas.height, len: Math.random() * 80 + 10, speed: Math.random() * 10 + 5, size: Math.random() * 1 + 0.5, angle: Math.PI / 4 + (Math.random() * Math.PI / 4) }); } }
function drawShootingStars() { shootingStars.forEach((s, i) => { ctx.beginPath(); const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.len * Math.cos(s.angle), s.y - s.len * Math.sin(s.angle)); grad.addColorStop(0, `rgba(255, 255, 255, ${s.size / 2})`); grad.addColorStop(1, 'rgba(255, 255, 255, 0)'); ctx.strokeStyle = grad; ctx.lineWidth = s.size; ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.len * Math.cos(s.angle), s.y - s.len * Math.sin(s.angle)); ctx.stroke(); s.x += s.speed * Math.cos(s.angle); s.y += s.speed * Math.sin(s.angle); if (s.x > canvas.width + s.len || s.y > canvas.height + s.len) shootingStars.splice(i, 1); }); }
let animationFrameId;
function animate() { ctx.clearRect(0, 0, canvas.width, canvas.height); drawStars(); createShootingStar(); drawShootingStars(); animationFrameId = requestAnimationFrame(animate); }
function stopAnimate() { cancelAnimationFrame(animationFrameId); }
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initStars(); });


// --- SPA Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const THEMES = {
        'default': { name: 'Default', start: '#3b82f6', end: '#8b5cf6' },
        'sunset': { name: 'Sunset', start: '#f97316', end: '#ef4444' },
        'ocean': { name: 'Ocean', start: '#06b6d4', end: '#3b82f6' },
        'forest': { name: 'Forest', start: '#22c55e', end: '#15803d' },
    };

    // STATE MANAGEMENT
    let state = {
        userProfile: { email: '', course: '', year: '', rollNumber: '', mobile: '' },
        schedule: [],
        history: [],
        assignments: [],
        gpaCourses: [],
        achievements: {},
        settings: {
            notifications: false,
            isLightMode: false,
            selectedTheme: 'default',
            dashboardOrder: ['overview-card-attendance', 'overview-card-courses', 'overview-card-streaks', 'overview-card-achievements'],
            hasCompletedTour: false,
        },
        currentCalendarDate: new Date(),
        pomodoro: {
            timerId: null,
            timeLeft: 25 * 60,
            isRunning: false,
            isPomodoroVisible: false,
            sessionsCompleted: 0,
        },
    };

    let chartInstances = {}; // To store chart objects
    let countdownInterval = null;

    // UI ELEMENTS
    const authPage = document.getElementById('auth-page');
    const landingPage = document.getElementById('landing-page');
    const dashboardApp = document.getElementById('dashboard-app');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    // Modals
    const classModal = document.getElementById('class-modal');
    const courseDetailsModal = document.getElementById('course-details-modal');
    const settingsModal = document.getElementById('settings-modal');
    const notesModal = document.getElementById('notes-modal');
    const assignmentModal = document.getElementById('assignment-modal');
    const gpaModal = document.getElementById('gpa-modal');
    const semesterWrappedModal = document.getElementById('semester-wrapped-modal');
    const scanTimetableModal = document.getElementById('scan-timetable-modal');
    const confirmationModal = document.getElementById('confirmation-modal');

    // Containers
    const coursesGrid = document.getElementById('courses-grid');
    const upcomingClassesList = document.getElementById('upcoming-classes-list');
    const achievementsGrid = document.getElementById('achievements-grid');
    const assignmentsList = document.getElementById('assignments-list');
    const upcomingAssignmentsList = document.getElementById('upcoming-assignments-list');


    // --- DATA PERSISTENCE (LOCALSTORAGE) ---
    const saveData = () => {
        localStorage.setItem('attendoraState', JSON.stringify(state));
    };

    const loadData = () => {
        const savedState = localStorage.getItem('attendoraState');
        if (savedState) {
            const loadedState = JSON.parse(savedState);
            // Merge saved state with default state to prevent errors if new properties are added
            state = {
                ...state,
                ...loadedState,
                settings: { ...state.settings, ...(loadedState.settings || {}) },
                pomodoro: { ...state.pomodoro, ...(loadedState.pomodoro || {}) }
            };
            state.currentCalendarDate = new Date(loadedState.currentCalendarDate);
        }
        applyTheme(state.settings.selectedTheme);
        applyLightMode(state.settings.isLightMode);
    };

    // --- THEME & APPEARANCE ---
    const applyTheme = (themeName) => {
        const theme = THEMES[themeName] || THEMES['default'];
        const root = document.documentElement;
        root.style.setProperty('--primary-color-start', theme.start);
        root.style.setProperty('--primary-color-end', theme.end);
        state.settings.selectedTheme = themeName;
    };

    const applyLightMode = (isLight) => {
        document.body.classList.toggle('light-mode', isLight);
        document.getElementById('theme-toggle').checked = isLight;
        const canvasEl = document.getElementById('shooting-stars-canvas');
        if (isLight) {
            canvasEl.style.opacity = '0';
            stopAnimate();
        } else {
            canvasEl.style.opacity = '1';
            initStars();
            animate();
        }
        state.settings.isLightMode = isLight;
    };

    const renderThemePicker = () => {
        const picker = document.getElementById('theme-picker');
        if (!picker) return;
        picker.innerHTML = '';
        Object.keys(THEMES).forEach(key => {
            const theme = THEMES[key];
            const swatch = document.createElement('button');
            swatch.className = `w-6 h-6 rounded-full cursor-pointer border-2 ${state.settings.selectedTheme === key ? 'border-blue-500' : 'border-transparent'}`;
            swatch.style.background = `linear-gradient(45deg, ${theme.start}, ${theme.end})`;
            swatch.dataset.theme = key;
            swatch.title = theme.name;
            picker.appendChild(swatch);
        });
    };

    document.getElementById('theme-toggle').addEventListener('change', (e) => {
        applyLightMode(e.target.checked);
        saveData();
        // Re-render charts with a delay to allow theme transition to finish
        setTimeout(renderReports, 300);
    });


    // --- AUTHENTICATION FLOW ---
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    const loginUser = () => {
        localStorage.setItem('loggedIn', 'true');
        showDashboard();
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginUser();
    });

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        state.userProfile = {
            email: document.getElementById('signup-email').value,
            course: document.getElementById('signup-course').value,
            year: document.getElementById('signup-year').value,
            rollNumber: document.getElementById('signup-roll').value,
            mobile: document.getElementById('signup-mobile').value
        };
        saveData();
        loginUser();
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('loggedIn');
        window.location.reload(); // Reload to clear state fully
    });


    // --- CORE LOGIC & INITIALIZATION ---
    const initializeApp = () => {
        loadData();
        setupEventListeners();
        if (localStorage.getItem('loggedIn')) {
            showDashboard();
        } else {
            showLandingPage();
        }
    };

    const showDashboard = () => {
        authPage.classList.add('hidden');
        landingPage.classList.add('hidden');
        dashboardApp.classList.remove('hidden');
        initializeDashboard();
    };

    const showLandingPage = () => {
        dashboardApp.classList.add('hidden');
        authPage.classList.add('hidden');
        landingPage.classList.remove('hidden');
    };

    const showAuthPage = (showLogin = true) => {
        dashboardApp.classList.add('hidden');
        landingPage.classList.add('hidden');
        authPage.classList.remove('hidden');
        loginForm.classList.toggle('hidden', !showLogin);
        signupForm.classList.toggle('hidden', showLogin);
    };

    const initializeDashboard = () => {
        autoMarkMissedClasses();
        renderThemePicker();
        checkNotificationStatus();
        updateAllViews();

        if (!state.settings.hasCompletedTour) {
            setTimeout(startOnboardingTour, 1000); // Delay for elements to render
        }
    };

    const updateAllViews = () => {
        renderOverviewCards();
        renderSchedule();
        renderTodaysClasses();
        renderCourses();
        renderAssignments();
        renderCalendar();
        renderAchievements();
        renderReports();
        renderProfile();
        renderGpaCalculator();
        updateOverviewStats();
        updateGoalOrientedCard();
        updateNextClassCountdown();

        // Assignment button logic
        const addAssignmentBtn = document.getElementById('add-assignment-btn');
        const hasCourses = state.schedule.length > 0;
        addAssignmentBtn.disabled = !hasCourses;
        addAssignmentBtn.classList.toggle('opacity-50', !hasCourses);
        addAssignmentBtn.classList.toggle('cursor-not-allowed', !hasCourses);
        addAssignmentBtn.title = hasCourses ? '' : 'Please add a course first before adding an assignment.';
    };

    // --- EVENT LISTENERS SETUP ---
    function setupEventListeners() {
        // Auth page navigation
        document.getElementById('show-signup').addEventListener('click', (e) => { e.preventDefault(); showAuthPage(false); });
        document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); showAuthPage(true); });
        document.getElementById('go-to-login-btn').addEventListener('click', (e) => { e.preventDefault(); showAuthPage(true); });
        document.getElementById('go-to-signup-btn').addEventListener('click', (e) => { e.preventDefault(); showAuthPage(false); });

        // Mobile Menu
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full');
            sidebarOverlay.classList.remove('hidden', 'opacity-0');
        });
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden', 'opacity-0');
        });

        // Modals
        document.body.addEventListener('click', (e) => {
            if (e.target.closest('.close-modal-btn')) {
                toggleModal(e.target.closest('.modal-overlay'), false);
            }
        });

        // Forms
        document.getElementById('class-form').addEventListener('submit', handleClassFormSubmit);
        document.getElementById('assignment-form').addEventListener('submit', handleAssignmentFormSubmit);
        document.getElementById('notes-form').addEventListener('submit', handleNoteSubmit);
        document.getElementById('gpa-form').addEventListener('submit', handleGpaFormSubmit);

        // Main Actions
        document.getElementById('add-class-btn').addEventListener('click', () => openClassModal(null, 'Class'));
        document.getElementById('add-assignment-btn').addEventListener('click', () => openAssignmentModal());
        document.getElementById('add-gpa-course-btn').addEventListener('click', openGpaModal);
        document.getElementById('settings-btn').addEventListener('click', () => toggleModal(settingsModal, true));
        document.getElementById('export-csv-btn').addEventListener('click', exportHistoryToCSV);
        document.getElementById('export-data-btn').addEventListener('click', exportData);
        document.getElementById('import-data-input').addEventListener('change', importData);
        document.getElementById('pomodoro-toggle-btn').addEventListener('click', togglePomodoro);
        document.getElementById('semester-wrapped-btn').addEventListener('click', generateSemesterWrapped);
        document.getElementById('share-wrapped-btn').addEventListener('click', shareSemesterWrapped);
        document.getElementById('start-tour-btn').addEventListener('click', startOnboardingTour);

        // Timetable Scanner listeners
        document.getElementById('schedule-view').addEventListener('click', (e) => {
            if (e.target.closest('#scan-timetable-btn') || e.target.closest('#scan-timetable-prompt-btn')) {
                openTimetableScanner();
            }
            if (e.target.closest('#add-class-prompt-btn')) {
                openClassModal();
            }
        });
        document.getElementById('timetable-file-input').addEventListener('change', handleTimetableScan);
        document.getElementById('save-scanned-schedule-btn').addEventListener('click', handleSaveScannedSchedule);

        // Settings Theme Picker
        document.getElementById('settings-modal').addEventListener('click', (e) => {
            const swatch = e.target.closest('#theme-picker button');
            if (swatch) {
                applyTheme(swatch.dataset.theme);
                renderThemePicker(); // Re-render to show active state
                saveData();
            }
        });

        // Dynamic Content Clicks (Event Delegation for reliability)
        dashboardApp.addEventListener('click', e => {
            // Courses View: Click to see details
            const courseCard = e.target.closest('#courses-grid .course-card-clickable');
            if (courseCard) {
                showCourseDetails(courseCard.dataset.courseName);
                return;
            }

            // Schedule View: Edit/Delete Class
            const editClassBtn = e.target.closest('.edit-class-btn');
            if (editClassBtn) {
                populateModalForEdit(parseFloat(editClassBtn.dataset.classId));
                return;
            }
            const deleteClassBtn = e.target.closest('.delete-class-btn');
            if (deleteClassBtn) {
                handleDeleteClass(parseFloat(deleteClassBtn.dataset.classId));
                return;
            }

            // Overview View: Mark Today's Attendance
            const attendanceBtn = e.target.closest('#upcoming-classes-list button[data-status]');
            if (attendanceBtn) {
                handleAttendanceAction(parseFloat(attendanceBtn.dataset.classId), attendanceBtn.dataset.status);
                return;
            }

            // Assignments View: Edit/Delete Assignment
            const editAssignmentBtn = e.target.closest('.edit-assignment-btn');
            if (editAssignmentBtn) {
                openAssignmentModal(editAssignmentBtn.dataset.assignmentId);
                return;
            }
            const deleteAssignmentBtn = e.target.closest('.delete-assignment-btn');
            if (deleteAssignmentBtn) {
                handleDeleteAssignment(deleteAssignmentBtn.dataset.assignmentId);
                return;
            }

            // GPA View: Edit/Delete GPA Course
            const editGpaBtn = e.target.closest('.edit-gpa-btn');
            if (editGpaBtn) {
                openGpaModal(editGpaBtn.dataset.gpaId);
                return;
            }
            const deleteGpaBtn = e.target.closest('.delete-gpa-btn');
            if (deleteGpaBtn) {
                handleDeleteGpaCourse(deleteGpaBtn.dataset.gpaId);
                return;
            }

            // Course Details Modal: Add Note
            const noteBtn = e.target.closest('.add-note-btn');
            if (noteBtn) {
                openNoteModal(parseInt(noteBtn.dataset.historyId));
                return;
            }
        });

        // Search/Filter Listeners
        document.getElementById('courses-search').addEventListener('keyup', (e) => filterGrid(e.target.value, '#courses-grid', '.course-card-clickable'));
        document.getElementById('assignments-search').addEventListener('keyup', (e) => filterGrid(e.target.value, '#assignments-list', '.assignment-item'));
        document.getElementById('gpa-search').addEventListener('keyup', (e) => filterTable(e.target.value, '#gpa-courses-tbody'));

        // Calendar Navigation
        document.getElementById('prev-month-btn').addEventListener('click', () => {
            state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() - 1);
            renderCalendar();
            saveData();
        });
        document.getElementById('next-month-btn').addEventListener('click', () => {
            state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() + 1);
            renderCalendar();
            saveData();
        });

        // Notification Toggle
        document.getElementById('notification-toggle').addEventListener('change', handleNotificationToggle);

        // Sidebar Navigation
        document.getElementById('sidebar-nav').addEventListener('click', handleSidebarNav);

        // Pomodoro Timer
        document.getElementById('pomodoro-start').addEventListener('click', startPomodoro);
        document.getElementById('pomodoro-pause').addEventListener('click', pausePomodoro);
        document.getElementById('pomodoro-reset').addEventListener('click', resetPomodoro);

        // Draggable Cards
        setupDraggableOverviewCards();
    }

    // --- MODAL & UI HELPERS ---
    const toggleModal = (modal, show) => {
        if (!modal) return;
        if (show) {
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.querySelector('.modal-content').classList.remove('scale-95');
            const input = modal.querySelector('input');
            if (input) setTimeout(() => input.focus(), 100);
        } else {
            modal.classList.add('opacity-0', 'pointer-events-none');
            modal.querySelector('.modal-content').classList.add('scale-95');
        }
    };

    const showConfirmationModal = (title, message, onConfirm) => {
        document.getElementById('confirmation-title').textContent = title;
        document.getElementById('confirmation-message').textContent = message;

        const confirmBtn = document.getElementById('confirm-action-btn');

        // Clone and replace the button to remove old event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.addEventListener('click', () => {
            onConfirm();
            toggleModal(confirmationModal, false);
        }, { once: true });

        toggleModal(confirmationModal, true);
    };

    const showToast = (message, type = 'success') => {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'fixed bottom-0 right-0 m-8 p-4 rounded-lg text-white font-bold shadow-lg transform translate-y-20 opacity-0 z-50'; // Reset classes
        if (type === 'success') {
            toast.classList.add('bg-gradient-to-r', 'from-green-400', 'to-teal-500');
        } else {
            toast.classList.add('bg-gradient-to-r', 'from-red-500', 'to-orange-500');
        }
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
    };

    // --- RENDERING FUNCTIONS ---
    function renderProfile() {
        const profile = state.userProfile || {};
        const email = profile.email || 'user@example.com';
        const firstLetter = email.charAt(0).toUpperCase() || 'A';

        document.getElementById('profile-email').textContent = email;
        document.getElementById('profile-roll').textContent = `Roll Number: ${profile.rollNumber || 'Not set'}`;
        document.getElementById('profile-course').textContent = profile.course || 'Not set';
        document.getElementById('profile-year').textContent = profile.year || 'Not set';
        document.getElementById('profile-mobile').textContent = profile.mobile || 'Not set';
        document.getElementById('profile-img').src = `https://placehold.co/100x100/${getComputedStyle(document.documentElement).getPropertyValue('--primary-color-start').substring(1)}/FFFFFF?text=${firstLetter}`;

        document.getElementById('welcome-message').textContent = `Welcome, ${email.split('@')[0]}!`;
    }

    function renderTodaysClasses() {
        const today = new Date().toLocaleString('en-us', { weekday: 'long' });
        const todayDateStr = new Date().toISOString().slice(0, 10);
        const upcomingClasses = state.schedule.filter(c => c.day === today);

        upcomingClassesList.innerHTML = '';
        if (upcomingClasses.length > 0) {
            upcomingClasses.forEach(c => {
                const li = document.createElement('li');
                li.className = 'flex flex-col sm:flex-row justify-between items-center gap-2 p-3 bg-white/5 rounded-lg';
                const historyEntry = state.history.find(h => h.classId === c.id && h.date === todayDateStr);

                let statusHTML = '';
                if (historyEntry) {
                    if (historyEntry.status === 'Present') statusHTML = `<span class="font-bold text-green-500">Present</span>`;
                    else if (historyEntry.status === 'Absent') statusHTML = `<span class="font-bold text-red-500">Absent</span>`;
                    else statusHTML = `<span class="font-bold text-gray-500">Cancelled</span>`;
                } else {
                    statusHTML = `<div class="flex items-center gap-2">
                        <button data-class-id="${c.id}" data-status="Present" class="attendance-btn border-green-500 text-green-500 hover:bg-green-500 hover:text-white">Present</button>
                        <button data-class-id="${c.id}" data-status="Absent" class="attendance-btn border-red-500 text-red-500 hover:bg-red-500 hover:text-white">Absent</button>
                        <button data-class-id="${c.id}" data-status="Cancelled" class="attendance-btn border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white">Cancel</button>
                    </div>`;
                }
                li.innerHTML = `<div><span class="font-semibold">${c.name}</span> <span class="text-sm" style="color: var(--text-secondary);">(${c.start})</span></div> ${statusHTML}`;
                upcomingClassesList.appendChild(li);
            });
        } else {
            upcomingClassesList.innerHTML = `<li class="text-center py-4" style="color: var(--text-secondary);">No classes scheduled for today. Relax!</li>`;
        }
    }

    function renderAssignments() {
        assignmentsList.innerHTML = '';
        upcomingAssignmentsList.innerHTML = '';

        if (state.schedule.length === 0) {
            const emptyState = `
                <div class="text-center py-16 card rounded-xl p-6 no-hover">
                    <svg class="mx-auto h-24 w-24 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 6.75 6h.75c.621 0 1.125.504 1.125 1.125v3.026a2.25 2.25 0 0 1-2.25 2.25h-1.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-1.5a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 18 19.5h1.5a2.25 2.25 0 0 0 2.25-2.25V6.75Z" />
                    </svg>
                    <h3 class="mt-4 text-xl font-semibold text-white">No assignments yet</h3>
                    <p class="mt-1 text-gray-400">Please add a course from 'My Schedule' to start adding assignments.</p>
                </div>`;
            assignmentsList.innerHTML = emptyState;
            upcomingAssignmentsList.innerHTML = `<li class="text-center py-4" style="color: var(--text-secondary);">No courses available.</li>`;
            return;
        }

        const sortedAssignments = [...state.assignments].sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
        const now = new Date();

        if (sortedAssignments.length > 0) {
             sortedAssignments.forEach(a => {
                const dueDate = new Date(a.dueDate + 'T23:59:59'); // Consider end of day for due date
                const isPast = dueDate < now;
                const daysRemaining = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

                let colorClass = 'text-green-500';
                if (daysRemaining <= 3) colorClass = 'text-yellow-500';
                if (daysRemaining <= 1) colorClass = 'text-red-500';

                const itemHTML = `
                    <div class="assignment-item p-4 bg-white/5 rounded-lg flex flex-col sm:flex-row justify-between items-start gap-4 ${isPast ? 'opacity-60' : ''}" data-search-content="${a.title.toLowerCase()} ${a.course.toLowerCase()}">
                        <div>
                            <span class="px-2 py-1 text-xs font-semibold rounded-full ${ a.type === 'Exam' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400' }">${a.type}</span>
                            <h4 class="text-lg font-bold mt-2">${a.title}</h4>
                            <p class="text-sm" style="color: var(--text-secondary);">${a.course} - Due: ${new Date(a.dueDate + 'T00:00:00').toLocaleDateString()}</p>
                        </div>
                        <div class="flex items-center gap-4 flex-shrink-0">
                            ${!isPast ? `<span class="font-bold ${colorClass}">${daysRemaining}d left</span>` : '<span class="font-bold" style="color: var(--text-secondary);">Past Due</span>'}
                            <div class="flex gap-2">
                                <button class="edit-assignment-btn p-2" style="color: var(--text-secondary);" data-assignment-id="${a.id}"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
                                <button class="delete-assignment-btn p-2" style="color: var(--text-secondary);" data-assignment-id="${a.id}"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                            </div>
                        </div>
                    </div>
                `;
                assignmentsList.innerHTML += itemHTML;

                if (!isPast) {
                     upcomingAssignmentsList.innerHTML += `
                        <li class="flex justify-between items-center p-2 rounded-lg">
                            <div>
                                <span class="font-semibold">${a.title}</span>
                                <span class="text-sm" style="color: var(--text-secondary);">(${a.course})</span>
                            </div>
                            <span class="font-bold ${colorClass}">${daysRemaining}d left</span>
                        </li>`;
                }
            });
        } else {
            assignmentsList.innerHTML = `<p class="text-center py-8" style="color: var(--text-secondary);">No assignments or exams added yet.</p>`;
        }

        if (upcomingAssignmentsList.innerHTML === '') {
            upcomingAssignmentsList.innerHTML = `<li class="text-center py-4" style="color: var(--text-secondary);">No upcoming deadlines. You're all caught up!</li>`;
        }
    }


    // --- HANDLERS ---
    function handleClassFormSubmit(e) {
        e.preventDefault();

        // Validation
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const errorDiv = document.getElementById('time-validation-error');
        const endTimeInput = document.getElementById('end-time');

        if (endTime <= startTime) {
            errorDiv.classList.remove('hidden');
            endTimeInput.classList.add('is-invalid');
            return; // Stop submission
        } else {
            errorDiv.classList.add('hidden');
            endTimeInput.classList.remove('is-invalid');
        }

        const editingId = parseFloat(document.getElementById('editing-class-id').value);
        const classData = {
            name: document.getElementById('course-name').value,
            day: document.getElementById('day-of-week').value,
            type: document.getElementById('course-type').value,
            start: startTime,
            end: endTime,
        };

        if (editingId) {
            const index = state.schedule.findIndex(c => c.id === editingId);
            if (index > -1) {
                const oldClassName = state.schedule[index].name;
                const newClassName = classData.name;

                // Update the single class entry
                state.schedule[index] = { ...state.schedule[index], ...classData };

                // If name changed, update everything associated with that course name
                if (oldClassName !== newClassName) {
                    // Update other schedule entries for the same course
                    state.schedule.forEach(c => {
                        if (c.name === oldClassName) {
                            c.name = newClassName;
                        }
                    });
                    // Update associated assignments
                    state.assignments.forEach(a => {
                        if (a.course === oldClassName) {
                            a.course = newClassName;
                        }
                    });
                    showToast(`Renamed course '${oldClassName}' to '${newClassName}'.`);
                }
            }
        } else {
            state.schedule.push({ id: Date.now(), ...classData });
        }

        state.schedule.sort((a,b) => a.start.localeCompare(b.start));
        checkAchievements();
        saveData();
        updateAllViews();
        toggleModal(classModal, false);
    }

    function handleAssignmentFormSubmit(e) {
        e.preventDefault();
        const editingId = document.getElementById('editing-assignment-id').value;
        const assignmentData = {
            title: document.getElementById('assignment-title').value,
            course: document.getElementById('assignment-course').value,
            type: document.getElementById('assignment-type').value,
            dueDate: document.getElementById('assignment-due-date').value
        };

        if (editingId) {
            const index = state.assignments.findIndex(a => a.id === editingId);
            if (index > -1) state.assignments[index] = { ...state.assignments[index], ...assignmentData };
        } else {
            state.assignments.push({ id: `asg-${Date.now()}`, ...assignmentData });
        }
        saveData();
        updateAllViews();
        toggleModal(assignmentModal, false);
    }

    function handleGpaFormSubmit(e) {
        e.preventDefault();
        const editingId = document.getElementById('editing-gpa-id').value;
        const gpaData = {
            name: document.getElementById('gpa-course-name').value,
            credits: parseFloat(document.getElementById('gpa-credits').value),
            grade: parseInt(document.getElementById('gpa-grade').value),
            date: new Date().toISOString().slice(0,10) // Add date for trend chart
        };

        if (editingId) {
            const index = state.gpaCourses.findIndex(c => c.id === editingId);
            if (index > -1) {
                 // Keep original date when editing
                gpaData.date = state.gpaCourses[index].date;
                state.gpaCourses[index] = { ...state.gpaCourses[index], ...gpaData };
            }
        } else {
            state.gpaCourses.push({ id: `gpa-${Date.now()}`, ...gpaData });
        }
        saveData();
        renderGpaCalculator();
        toggleModal(gpaModal, false);
    }

    function handleAttendanceAction(classId, status) {
        const today = new Date().toISOString().slice(0, 10);
        const classInfo = state.schedule.find(c => c.id === classId);
        const alreadyMarkedIndex = state.history.findIndex(entry => entry.classId === classId && entry.date === today);

        if (alreadyMarkedIndex > -1) {
            state.history[alreadyMarkedIndex].status = status;
        } else {
            state.history.push({ id: Date.now(), classId: classId, date: today, status: status, note: '' });
        }
        checkAchievements(classInfo?.name);
        saveData();
        updateAllViews();
    }

    function handleDeleteClass(classId) {
        const classToDelete = state.schedule.find(c => c.id === classId);
        if (!classToDelete) return;

        const title = `Delete '${classToDelete.name}'?`;
        const message = `Are you sure? This specific class entry will be deleted. If this is the last class for this course, all its assignments will be removed too.`;

        showConfirmationModal(title, message, () => {
            const courseName = classToDelete.name;

            // Filter out the class to be deleted
            state.schedule = state.schedule.filter(c => c.id !== classId);
            state.history = state.history.filter(h => h.classId !== classId);

            // Check if any other classes for this course exist
            const isLastClassOfCourse = !state.schedule.some(c => c.name === courseName);

            if (isLastClassOfCourse) {
                const originalAssignmentCount = state.assignments.length;
                state.assignments = state.assignments.filter(a => a.course !== courseName);
                const assignmentsRemoved = originalAssignmentCount > state.assignments.length;
                if (assignmentsRemoved) {
                     showToast(`Removed last class for '${courseName}' and its assignments.`);
                } else {
                    showToast(`Class from '${courseName}' deleted.`);
                }
            } else {
                showToast(`Class from '${courseName}' deleted.`);
            }

            saveData();
            updateAllViews();
        });
    }

    function handleDeleteAssignment(assignmentId) {
         const assignment = state.assignments.find(a => a.id === assignmentId);
         if (!assignment) return;
         const title = `Delete '${assignment.title}'?`;
         const message = `This assignment will be permanently removed.`;
         showConfirmationModal(title, message, () => {
            state.assignments = state.assignments.filter(a => a.id !== assignmentId);
            saveData();
            updateAllViews();
            showToast('Assignment deleted.');
         });
    }

    function handleDeleteGpaCourse(gpaId) {
        const course = state.gpaCourses.find(c => c.id === gpaId);
        if (!course) return;
        const title = `Delete '${course.name}'?`;
        const message = `This GPA entry will be permanently removed.`;
        showConfirmationModal(title, message, () => {
            state.gpaCourses = state.gpaCourses.filter(c => c.id !== gpaId);
            saveData();
            renderGpaCalculator();
            showToast('GPA entry deleted.');
        });
    }

    function handleSidebarNav(e) {
        e.preventDefault();
        const link = e.target.closest('a.sidebar-link');
        if (!link) return;
        navigateTo(link.getAttribute('href').substring(1));

        // Close sidebar on mobile after navigation
        if (window.innerWidth < 768) {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden', 'opacity-0');
        }
    }

    function navigateTo(viewId) {
         document.querySelectorAll('#sidebar-nav a').forEach(a => a.classList.remove('active'));
        const link = document.querySelector(`#sidebar-nav a[href="#${viewId}"]`);
        if(link) link.classList.add('active');

        const targetId = viewId + '-view';
        document.querySelectorAll('.dashboard-view').forEach(view => {
            const wasActive = view.classList.contains('active');
            const isActive = view.id === targetId;
            view.classList.toggle('active', isActive);
            // If view is becoming active, re-render charts
            if (isActive && !wasActive && (targetId === 'reports-view' || targetId === 'overview-view')) {
                 setTimeout(() => {
                    renderReports();
                 }, 50); // Delay for animation
            }
        });
    }

    // --- MODAL OPENERS ---
    function openClassModal(day = null, type = 'Class') {
        document.getElementById('class-form').reset();
        document.getElementById('editing-class-id').value = '';
        document.getElementById('class-modal-title').textContent = `Add a New ${type}`;
        document.getElementById('course-type').value = type;
        if (day) document.getElementById('day-of-week').value = day;

        // Clear any previous validation errors
        document.getElementById('time-validation-error').classList.add('hidden');
        document.getElementById('end-time').classList.remove('is-invalid');

        toggleModal(classModal, true);
    }

    function populateModalForEdit(classId) {
        const classToEdit = state.schedule.find(c => c.id === classId);
        if (!classToEdit) return;
        document.getElementById('editing-class-id').value = classToEdit.id;
        document.getElementById('class-modal-title').textContent = 'Edit Class';
        document.getElementById('course-name').value = classToEdit.name;
        document.getElementById('day-of-week').value = classToEdit.day;
        document.getElementById('course-type').value = classToEdit.type;
        document.getElementById('start-time').value = classToEdit.start;
        document.getElementById('end-time').value = classToEdit.end;

        // Clear any previous validation errors
        document.getElementById('time-validation-error').classList.add('hidden');
        document.getElementById('end-time').classList.remove('is-invalid');

        toggleModal(classModal, true);
    }

    function openAssignmentModal(assignmentId = null) {
        const form = document.getElementById('assignment-form');
        form.reset();
        document.getElementById('editing-assignment-id').value = '';

        const courseSelect = document.getElementById('assignment-course');
        const uniqueCourses = [...new Set(state.schedule.map(item => item.name))];
        courseSelect.innerHTML = uniqueCourses.map(name => `<option value="${name}">${name}</option>`).join('');

        if (assignmentId) {
            const assignment = state.assignments.find(a => a.id === assignmentId);
            if (assignment) {
                document.getElementById('assignment-modal-title').textContent = 'Edit Assignment';
                document.getElementById('editing-assignment-id').value = assignment.id;
                document.getElementById('assignment-title').value = assignment.title;
                document.getElementById('assignment-course').value = assignment.course;
                document.getElementById('assignment-type').value = assignment.type;
                document.getElementById('assignment-due-date').value = assignment.dueDate;
            }
        } else {
            document.getElementById('assignment-modal-title').textContent = 'Add New Assignment';
        }
        toggleModal(assignmentModal, true);
    }

    function openGpaModal(gpaId = null) {
        const form = document.getElementById('gpa-form');
        form.reset();
        document.getElementById('editing-gpa-id').value = '';
        const courseNameInput = document.getElementById('gpa-course-name');

        if (gpaId) {
            const course = state.gpaCourses.find(c => c.id === gpaId);
            if (course) {
                document.getElementById('gpa-modal-title').textContent = 'Edit GPA Entry';
                document.getElementById('editing-gpa-id').value = course.id;
                courseNameInput.value = course.name;
                document.getElementById('gpa-credits').value = course.credits;
                document.getElementById('gpa-grade').value = course.grade;
            }
        } else {
             document.getElementById('gpa-modal-title').textContent = 'Add Course for GPA';
        }
        toggleModal(gpaModal, true);
    }

    // --- TIMETABLE SCANNER ---
    function openTimetableScanner() {
        // Reset to the first step
        scanTimetableModal.querySelector('#scan-upload-view').classList.remove('hidden');
        scanTimetableModal.querySelector('#scan-processing-view').classList.add('hidden');
        scanTimetableModal.querySelector('#scan-correction-view').classList.add('hidden');
        document.getElementById('timetable-file-input').value = '';
        toggleModal(scanTimetableModal, true);
    }

    function handleTimetableScan(event) {
        if (!event.target.files || !event.target.files[0]) return;

        // Show processing view
        scanTimetableModal.querySelector('#scan-upload-view').classList.add('hidden');
        scanTimetableModal.querySelector('#scan-processing-view').classList.remove('hidden');

        // --- SIMULATED OCR PROCESS ---
        console.log("Simulating OCR scan...");
        setTimeout(() => {
            console.log("OCR Simulation complete.");
            // This is where a real API call to an OCR service would happen.
            // We'll return mock data with intentional errors for demonstration.
            const mockScannedData = [
                { day: 'Monday', start: '09:30', end: '10:20', name: 'OOPS' },
                { day: 'Monday', start: '10:20', end: '11:10', name: 'DLCD' },
                { day: 'Monday', start: '11:10', end: '12:50', name: 'DS Lab' },
                { day: 'Tuesday', start: '09:30', end: '11:10', name: 'DM' },
                { day: 'Wednesday', start: '09:30', end: '10:20', name: 'CM' },
                { day: 'Thursday', start: '13:40', end: '15:20', name: 'OOPS Lab' },
                { day: 'Friday', start: '14:30', end: '15:20', name: 'IKS' },
                { day: '', start: '', end: '', name: '' }, // Simulate an empty row
            ];
            renderCorrectionView(mockScannedData);
        }, 2500); // Simulate a 2.5 second scan time
    }

    function renderCorrectionView(scannedData) {
        const container = document.getElementById('correction-grid-container');
        container.innerHTML = `
            <table class="w-full text-left">
                <thead>
                    <tr class="border-b border-white/10">
                        <th class="p-2">Day</th>
                        <th class="p-2">Start Time</th>
                        <th class="p-2">End Time</th>
                        <th class="p-2">Subject Name</th>
                    </tr>
                </thead>
                <tbody id="correction-tbody"></tbody>
            </table>
        `;
        const tbody = document.getElementById('correction-tbody');
        scannedData.forEach((entry, index) => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-white/5';
            tr.innerHTML = `
                <td class="p-1"><input type="text" value="${entry.day}" class="form-input p-2" data-field="day"></td>
                <td class="p-1"><input type="time" value="${entry.start}" class="form-input p-2" data-field="start"></td>
                <td class="p-1"><input type="time" value="${entry.end}" class="form-input p-2" data-field="end"></td>
                <td class="p-1"><input type="text" value="${entry.name}" class="form-input p-2" data-field="name"></td>
            `;
            tbody.appendChild(tr);
        });

        // Switch to correction view
        scanTimetableModal.querySelector('#scan-processing-view').classList.add('hidden');
        scanTimetableModal.querySelector('#scan-correction-view').classList.remove('hidden');
    }

    function handleSaveScannedSchedule() {
        const tbody = document.getElementById('correction-tbody');
        const rows = tbody.querySelectorAll('tr');
        let newClassesAdded = 0;
        const newSchedule = []; // Use a temporary array to build the new schedule

        rows.forEach(row => {
            const nameInput = row.querySelector('input[data-field="name"]');
            const dayInput = row.querySelector('input[data-field="day"]');
            const startInput = row.querySelector('input[data-field="start"]');
            const endInput = row.querySelector('input[data-field="end"]');

            if (nameInput.value && dayInput.value && startInput.value && endInput.value) {
                 const classData = {
                    id: Date.now() + Math.random(), // Unique ID
                    name: nameInput.value,
                    day: dayInput.value,
                    type: nameInput.value.toLowerCase().includes('lab') ? 'Lab' : 'Class',
                    start: startInput.value,
                    end: endInput.value,
                };
                newSchedule.push(classData);
                newClassesAdded++;
            }
        });

        if (newClassesAdded > 0) {
            state.schedule = newSchedule;
            state.history = [];
            state.assignments = [];

            state.schedule.sort((a,b) => a.start.localeCompare(b.start));
            checkAchievements();
            saveData();
            updateAllViews();
            toggleModal(scanTimetableModal, false);
            showToast(`${newClassesAdded} classes added, replacing your old schedule!`);
        } else {
            showToast("No valid classes were found to save.", "error");
        }
    }


    // --- NOTES ---
    function openNoteModal(historyId) {
        const historyEntry = state.history.find(h => h.id === historyId);
        if (!historyEntry) return;
        document.getElementById('note-history-id').value = historyId;
        document.getElementById('note-textarea').value = historyEntry.note || '';
        toggleModal(notesModal, true);
    }

    function handleNoteSubmit(e) {
        e.preventDefault();
        const historyId = parseInt(document.getElementById('note-history-id').value);
        const noteText = document.getElementById('note-textarea').value;
        const historyIndex = state.history.findIndex(h => h.id === historyId);
        if (historyIndex > -1) {
            state.history[historyIndex].note = noteText;
            saveData();
            toggleModal(notesModal, false);
            const courseDetailsTitle = document.getElementById('course-details-title').textContent;
            if (!courseDetailsModal.classList.contains('opacity-0')) {
                showCourseDetails(courseDetailsTitle);
            }
        }
    }


    // --- NOTIFICATIONS ---
    function handleNotificationToggle(e) {
        const isEnabled = e.target.checked;
        state.settings.notifications = isEnabled;
        if (isEnabled) {
            requestNotificationPermission();
        }
        saveData();
    }

    const checkNotificationStatus = () => {
        const toggle = document.getElementById('notification-toggle');
        const statusText = document.getElementById('notification-status-text');

        if (!("Notification" in window)) {
            toggle.disabled = true;
            statusText.textContent = "Notifications are not supported by your browser.";
            return;
        }

        toggle.checked = state.settings.notifications && Notification.permission === 'granted';

        if (Notification.permission === "granted") {
            statusText.textContent = "Reminders are enabled.";
        } else if (Notification.permission === "denied") {
            statusText.textContent = "Reminders are blocked in your browser settings.";
            toggle.disabled = true;
        } else {
             statusText.textContent = "Allow notifications to get class reminders.";
        }
    };

    const requestNotificationPermission = async () => {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            showToast("Notifications enabled!");
            state.settings.notifications = true;
        } else {
            showToast("Notifications were not enabled.", "error");
            state.settings.notifications = false;
        }
        saveData();
        checkNotificationStatus();
    };

    // --- ONBOARDING TOUR ---
    function startOnboardingTour() {
        const intro = introJs();
        intro.setOptions({
            steps: [
                {
                    element: document.querySelector('#sidebar'),
                    intro: "Welcome to Attendora! This is your navigation sidebar. Let's take a quick look around.",
                    position: 'right'
                },
                {
                    element: document.querySelector('a[href="#schedule"]'),
                    intro: "First, head to 'My Schedule' to add your classes. You can add them manually or scan your timetable image."
                },
                {
                    element: document.querySelector('#todays-schedule-card'),
                    intro: "Once classes are added, your daily schedule will appear here. You can mark your attendance with a single click.",
                    position: 'top'
                },
                {
                     element: document.querySelector('a[href="#courses"]'),
                    intro: "The 'My Courses' view will give you a detailed breakdown of your attendance for each subject."
                },
                {
                     element: document.querySelector('#settings-btn'),
                    intro: "Finally, you can customize your experience in the Settings menu. Change themes, manage data, and more.",
                     position: 'top'
                }
            ],
            showProgress: true,
            showBullets: false
        });

        intro.oncomplete(() => {
            state.settings.hasCompletedTour = true;
            saveData();
        });

        intro.onexit(() => {
            state.settings.hasCompletedTour = true;
            saveData();
        });

        intro.start();
    }

    // --- FILTERING ---
    function filterGrid(searchTerm, gridSelector, itemSelector) {
        const term = searchTerm.toLowerCase();
        const items = document.querySelector(gridSelector).querySelectorAll(itemSelector);
        items.forEach(item => {
            const content = item.dataset.searchContent || item.textContent.toLowerCase();
            item.style.display = content.includes(term) ? '' : 'none';
        });
    }

    function filterTable(searchTerm, tbodySelector) {
        const term = searchTerm.toLowerCase();
        const rows = document.querySelector(tbodySelector).querySelectorAll('tr');
        rows.forEach(row => {
            const content = row.dataset.searchContent || row.textContent.toLowerCase();
            row.style.display = content.includes(term) ? '' : 'none';
        });
    }

    // --- UNCHANGED HELPER & RENDER FUNCTIONS ---

    function updateOverviewStats() {
        const presentCount = state.history.filter(h => h.status === 'Present').length;
        const absentCount = state.history.filter(h => h.status === 'Absent').length;
        const total = presentCount + absentCount;
        const percentage = total === 0 ? 100 : Math.round((presentCount / total) * 100);
        const uniqueCourses = [...new Set(state.schedule.map(item => item.name))];
        const unlockedAchievements = Object.values(state.achievements).filter(a => a.unlocked).length;
        const activeStreaks = uniqueCourses.reduce((acc, courseName) => {
            if (calculateStreak(courseName) > 0) acc++;
            return acc;
        }, 0);
        document.getElementById('overview-attendance').textContent = `${percentage}%`;
        document.getElementById('overview-courses').textContent = uniqueCourses.length;
        document.getElementById('overview-streaks').textContent = `${activeStreaks} 🔥`;
        document.getElementById('overview-achievements').textContent = `${unlockedAchievements} 🏆`;
        document.getElementById('overview-pomodoro-sessions').textContent = state.pomodoro.sessionsCompleted;

    }

    function renderCourses() {
        const uniqueCourses = [...new Set(state.schedule.map(item => item.name))];
        coursesGrid.innerHTML = '';
        if (uniqueCourses.length > 0) {
            uniqueCourses.forEach(courseName => {
                const stats = calculateAttendanceForCourse(courseName);
                const streak = calculateStreak(courseName);

                let percentageColorClass = 'text-red-500';
                if (stats.percentage >= 85) percentageColorClass = 'text-green-500';
                else if (stats.percentage >= 75) percentageColorClass = 'text-yellow-500';

                const courseCard = document.createElement('button');
                courseCard.className = 'card course-card-clickable p-6 rounded-xl text-left';
                courseCard.dataset.courseName = courseName;
                courseCard.dataset.searchContent = courseName.toLowerCase();
                courseCard.innerHTML = `
                    <div class="flex justify-between items-start">
                        <h3 class="text-xl font-bold pointer-events-none">${courseName}</h3>
                        ${streak > 0 ? `<div class="text-lg font-bold text-orange-400 pointer-events-none">${streak} 🔥</div>` : ''}
                    </div>
                    <p class="mb-4 pointer-events-none" style="color: var(--text-secondary);">Click to see details</p>
                    <div class="w-full bg-gray-700/30 rounded-full h-2.5 pointer-events-none">
                        <div class="h-2.5 rounded-full" style="width: ${stats.percentage}%; background-color: var(--primary-color-start);"></div>
                    </div>
                    <p class="text-right font-bold mt-2 pointer-events-none ${percentageColorClass}">${stats.percentage}% Attendance</p>
                 `;
                 coursesGrid.appendChild(courseCard);
            });
        } else {
             coursesGrid.innerHTML = `<div class="col-span-full text-center py-16">
                <svg class="mx-auto h-24 w-24 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
                <h3 class="mt-4 text-xl font-semibold text-white">No Courses Found</h3>
                <p class="mt-1" style="color: var(--text-secondary);">You haven't added any courses yet. Go to 'My Schedule' to add a class.</p>
            </div>`;
        }
    }

    function renderSchedule() {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const today = new Date().toLocaleString('en-us', { weekday: 'long' });

        const scheduleContainer = document.querySelector('#schedule-view .overflow-x-auto');
        scheduleContainer.innerHTML = `<div class="grid grid-cols-7 min-w-[700px] gap-2 md:gap-4" id="schedule-grid"></div>`;
        const scheduleGrid = document.getElementById('schedule-grid');

        days.forEach(day => {
            const dayCol = document.createElement('div');
            dayCol.className = `space-y-4 p-2 rounded-lg ${day === today ? 'bg-white/5' : ''}`;
            dayCol.innerHTML = `<h3 class="text-xl font-bold text-center border-b-2 pb-2" style="border-color: var(--card-border);">${day}</h3>`;
            const classesForDay = state.schedule.filter(c => c.day === day).sort((a, b) => a.start.localeCompare(b.start));
            if (classesForDay.length > 0) {
                classesForDay.forEach(c => {
                    let typeIndicator = '';
                    if (c.type === 'Lab') typeIndicator = `<div class="absolute top-2 left-2 text-xs font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Lab</div>`;
                    else if (c.type === 'Class & Lab') typeIndicator = `<div class="absolute top-2 left-2 text-xs font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">Hybrid</div>`;
                    const classCard = document.createElement('div');
                    classCard.className = 'p-3 bg-white/5 rounded-lg relative group pt-8';
                    classCard.innerHTML = `
                        ${typeIndicator}
                        <div class="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="edit-class-btn p-2" data-class-id="${c.id}" title="Edit" style="color: var(--text-secondary);"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
                            <button class="delete-class-btn p-2 text-red-400" data-class-id="${c.id}" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                        </div>
                        <p class="font-semibold">${c.name}</p>
                        <p class="text-sm" style="color: var(--text-secondary);">${c.start} - ${c.end}</p>
                    `;
                    dayCol.appendChild(classCard);
                });
            } else {
                dayCol.innerHTML += `<div class="text-center text-sm py-4 h-full flex items-center justify-center" style="color: var(--text-secondary);">No Classes</div>`;
            }
            scheduleGrid.appendChild(dayCol);
        });

        // Show empty state prompt if no classes
        const scheduleEmptyPrompt = document.getElementById('schedule-empty-prompt');
        if (state.schedule.length === 0) {
            scheduleContainer.classList.add('hidden');
            scheduleEmptyPrompt.classList.remove('hidden');
        } else {
            scheduleContainer.classList.remove('hidden');
            scheduleEmptyPrompt.classList.add('hidden');
        }
    }

    function renderCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        const header = document.getElementById('month-year-header');
        calendarGrid.innerHTML = '';
        const date = state.currentCalendarDate;
        const year = date.getFullYear();
        const month = date.getMonth();
        header.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 0; i < firstDay; i++) {
            calendarGrid.innerHTML += `<div class="calendar-day empty"></div>`;
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const historyForDay = state.history.filter(h => h.date === dateStr);
            const assignmentsForDay = state.assignments.filter(a => a.dueDate === dateStr);

            let bgColor = 'bg-white/5';
            if (historyForDay.length > 0) {
                const present = historyForDay.filter(h => h.status === 'Present').length;
                const absent = historyForDay.filter(h => h.status === 'Absent').length;
                if (absent > 0) bgColor = 'bg-red-500/50';
                else if (present > 0) bgColor = 'bg-green-500/50';
            }
            dayEl.className = `calendar-day ${bgColor} flex items-center justify-center font-bold`;
            dayEl.textContent = day;

            if (assignmentsForDay.length > 0) {
                dayEl.innerHTML += `<div class="assignment-dot" title="${assignmentsForDay.map(a => a.title).join(', ')}"></div>`;
            }

            calendarGrid.appendChild(dayEl);
        }
    }

    function renderReports() {
        const container = document.getElementById('subject-chart-container');
        container.innerHTML = '';
         Object.values(chartInstances).forEach(chart => {
            if(chart && typeof chart.destroy === 'function') chart.destroy();
         });
        chartInstances = {};

        const uniqueCourses = [...new Set(state.schedule.map(item => item.name))];
        if(uniqueCourses.length === 0) {
            container.innerHTML = `<p class="col-span-full text-center" style="color: var(--text-secondary);">No courses to generate a report for.</p>`;
            const trendsCtx = document.getElementById('trends-chart').getContext('2d');
            if(chartInstances.trends) chartInstances.trends.destroy();
            trendsCtx.clearRect(0, 0, trendsCtx.canvas.width, trendsCtx.canvas.height);
            return;
        }

        const gridTextColor = getComputedStyle(document.body).getPropertyValue('--text-secondary');
        const chartBorderColor = getComputedStyle(document.body).getPropertyValue('--background-color');

        uniqueCourses.forEach(courseName => {
            const stats = calculateAttendanceForCourse(courseName);
            const chartWrapper = document.createElement('div');
            chartWrapper.className = 'card rounded-xl p-4 flex flex-col items-center no-hover';
            chartWrapper.innerHTML = `
                <h4 class="text-lg font-bold mb-2">${courseName}</h4>
                <canvas id="chart-${courseName.replace(/\s+/g, '')}"></canvas>
            `;
            container.appendChild(chartWrapper);

            const ctx = document.getElementById(`chart-${courseName.replace(/\s+/g, '')}`).getContext('2d');
            chartInstances[courseName] = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Present', 'Absent', 'Cancelled'],
                    datasets: [{
                        label: 'Attendance',
                        data: [stats.present, stats.absent, stats.cancelled],
                        backgroundColor: ['#22c55e', '#ef4444', '#6b7280'],
                        borderColor: chartBorderColor,
                        borderWidth: 4,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: gridTextColor }
                        },
                        title: { display: true, text: `${stats.percentage}% Overall`, color: gridTextColor }
                    }
                }
            });
        });

        // Render Trends Chart
        const trendsCtx = document.getElementById('trends-chart').getContext('2d');
        const historyByDate = state.history.reduce((acc, h) => {
            if (h.status === 'Present' || h.status === 'Absent') {
               (acc[h.date] = acc[h.date] || []).push(h.status);
            }
            return acc;
        }, {});

        const sortedDates = Object.keys(historyByDate).sort((a,b) => new Date(a) - new Date(b));
        const trendData = [];
        let p = 0, a = 0;
        sortedDates.forEach(date => {
            const presentToday = historyByDate[date].filter(s => s === 'Present').length;
            const absentToday = historyByDate[date].filter(s => s === 'Absent').length;
            p += presentToday;
            a += absentToday;
            trendData.push({ x: date, y: Math.round((p / (p + a)) * 100) });
        });

        if(chartInstances.trends) chartInstances.trends.destroy();
        chartInstances.trends = new Chart(trendsCtx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Overall Attendance %',
                    data: trendData,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color-start'),
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    x: { type: 'time', time: { unit: 'day' }, grid: { color: gridTextColor+'30' }, ticks: { color: gridTextColor } },
                    y: { beginAtZero: true, max: 100, grid: { color: gridTextColor+'30' }, ticks: { color: gridTextColor } }
                },
                plugins: { legend: { labels: { color: gridTextColor } } }
            }
        });
    }

    function autoMarkMissedClasses() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        const yesterdayDayName = yesterday.toLocaleString('en-us', { weekday: 'long' });
        const yesterdayClasses = state.schedule.filter(c => c.day === yesterdayDayName);
        let missedCount = 0;
        yesterdayClasses.forEach(c => {
            const isMarked = state.history.some(h => h.classId === c.id && h.date === yesterdayStr);
            if (!isMarked) {
                state.history.push({
                    id: Date.now() + Math.random(),
                    classId: c.id,
                    date: yesterdayStr,
                    status: 'Absent',
                    note: 'Automatically marked as absent.'
                });
                missedCount++;
            }
        });
        if (missedCount > 0) {
            showToast(`Automatically marked ${missedCount} missed classes from yesterday.`);
            saveData();
        }
    }

    const ALL_ACHIEVEMENTS = {
        'firstStep': { title: 'First Step', desc: 'Add your first class.', icon: '👟', goal: 1 },
        'dedicated': { title: 'Dedicated', desc: 'Mark attendance for 30 straight days.', icon: '🎯', goal: 30 },
        'perfectWeek': { title: 'Perfect Week', desc: 'Attend every class for a full week.', icon: '📅', goal: 7 },
        'comebackKing': { title: 'Comeback King', desc: 'Raise a subject from below 75% to above 75%.', icon: '👑', goal: 1},
        'labRat': { title: 'Lab Rat', desc: 'Achieve 100% attendance in labs for a month.', icon: '🔬', goal: 1 },
    };

    function checkAchievements(courseName = null) {
        let newAchievement = false;
        // First Step
        if (!state.achievements.firstStep?.unlocked && state.schedule.length > 0) {
            state.achievements.firstStep = { unlocked: true, date: new Date(), progress: 1 };
            showToast("🏆 Achievement Unlocked: First Step!");
            newAchievement = true;
        }
        // Comeback King
        if (courseName && !state.achievements.comebackKing?.unlocked) {
            const stats = calculateAttendanceForCourse(courseName);
            if(stats.percentage >= 75 && stats.wasBelow75) {
                state.achievements.comebackKing = { unlocked: true, date: new Date(), progress: 1 };
                showToast("🏆 Achievement Unlocked: Comeback King!");
                newAchievement = true;
            }
        }
        // Dedicated
        const uniqueDays = new Set(state.history.map(h => h.date)).size;
        state.achievements.dedicated = { ...state.achievements.dedicated, progress: uniqueDays };
        if(!state.achievements.dedicated?.unlocked && uniqueDays >= 30) {
             state.achievements.dedicated.unlocked = true;
             state.achievements.dedicated.date = new Date();
             showToast("🏆 Achievement Unlocked: Dedicated!");
             newAchievement = true;
        }

        if (newAchievement) {
            saveData();
            updateAllViews();
        }
    }

    function renderAchievements() {
        achievementsGrid.innerHTML = '';
        for (const id in ALL_ACHIEVEMENTS) {
            const achievement = ALL_ACHIEVEMENTS[id];
            const data = state.achievements[id] || { unlocked: false, progress: 0 };
            const progress = data.unlocked ? 100 : Math.round((data.progress / achievement.goal) * 100);

            const badge = document.createElement('div');
            badge.className = `card p-4 text-center achievement-badge ${!data.unlocked ? 'locked' : ''}`;
            badge.innerHTML = `
                <div class="text-5xl mb-2">${achievement.icon}</div>
                <h3 class="font-bold">${achievement.title}</h3>
                <p class="text-sm h-10" style="color: var(--text-secondary);">${achievement.desc}</p>
                ${data.unlocked ? `<p class="text-xs text-green-500 mt-2">Unlocked on ${new Date(data.date).toLocaleDateString()}</p>` : `
                <div class="w-full bg-gray-700/50 rounded-full h-2.5 mt-2">
                    <div class="bg-yellow-500 h-2.5 rounded-full" style="width: ${progress}%"></div>
                </div>
                <p class="text-xs mt-1" style="color: var(--text-secondary);">${data.progress || 0} / ${achievement.goal}</p>
                `}
            `;
            achievementsGrid.appendChild(badge);
        }
    }

    const calculateAttendanceForCourse = (courseName) => {
        const courseInstances = state.schedule.filter(s => s.name === courseName);
        const courseInstanceIds = courseInstances.map(i => i.id);
        const historyForCourse = state.history.filter(h => courseInstanceIds.includes(h.classId));
        const presentCount = historyForCourse.filter(h => h.status === 'Present').length;
        const absentCount = historyForCourse.filter(h => h.status === 'Absent').length;
        const cancelledCount = historyForCourse.filter(h => h.status === 'Cancelled').length;
        const totalTracked = presentCount + absentCount;
        const percentage = totalTracked === 0 ? 100 : Math.round((presentCount / totalTracked) * 100);
        let wasBelow75 = false;
        for(let i=1; i < historyForCourse.length; i++) {
            const pastSlice = historyForCourse.slice(0, i);
            const pastPresent = pastSlice.filter(h => h.status === 'Present').length;
            const pastAbsent = pastSlice.filter(h => h.status === 'Absent').length;
            if((pastPresent + pastAbsent) > 0 && (pastPresent / (pastPresent + pastAbsent)) < 0.75) {
                wasBelow75 = true;
                break;
            }
        }
        return { present: presentCount, absent: absentCount, cancelled: cancelledCount, total: totalTracked, percentage, wasBelow75 };
    };

    const calculateStreak = (courseName) => {
        const courseInstances = state.schedule.filter(s => s.name === courseName);
        const courseInstanceIds = courseInstances.map(i => i.id);
        const historyForCourse = state.history.filter(h => courseInstanceIds.includes(h.classId))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        let streak = 0;
        for (const record of historyForCourse) {
            if (record.status === 'Present') streak++;
            else if (record.status === 'Absent') break;
        }
        return streak;
    };

    function updateGoalOrientedCard() {
        const card = document.getElementById('goal-oriented-card');
        const text = document.getElementById('goal-text');
        const uniqueCourses = [...new Set(state.schedule.map(item => item.name))];
        const lowAttendanceCourse = uniqueCourses.find(courseName => {
            const stats = calculateAttendanceForCourse(courseName);
            return stats.percentage < 75 && stats.total > 0;
        });
        if (lowAttendanceCourse) {
            const stats = calculateAttendanceForCourse(lowAttendanceCourse);
            const needed = Math.ceil((0.75 * stats.absent - 0.25 * stats.present) / 0.25);
            if(needed > 0) {
                text.textContent = `You need to attend the next ${needed} classes of ${lowAttendanceCourse} to reach 75% attendance.`;
                text.style.color = state.settings.isLightMode ? '#ca8a04' : '#facc15'; // Yellow
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        } else {
            card.classList.add('hidden');
        }
    }

    function showCourseDetails(courseName) {
        document.getElementById('course-details-title').textContent = courseName;
        const goalInput = document.getElementById('attendance-goal');
        const whatIfInput = document.getElementById('what-if-input');
        const whatIfOutput = document.getElementById('what-if-output');
        whatIfInput.value = 0;
        whatIfOutput.textContent = '';


        const updateDetails = () => {
            const goal = parseInt(goalInput.value) || 75;
            const stats = calculateAttendanceForCourse(courseName);

            let bunksAvailableText = '';
            if (stats.percentage < goal) {
                 const needed = Math.ceil(( (goal/100) * stats.absent - (1 - (goal/100)) * stats.present) / (1 - (goal/100)) );
                 bunksAvailableText = `<p style="color: var(--text-secondary);">Need to attend</p><p class="text-4xl font-bold text-yellow-400">${needed > 0 ? needed : 0}</p><p style="color: var(--text-secondary);">more classes to reach ${goal}%.</p>`;
            } else {
                const bunksAvailable = Math.floor( (stats.present - (goal/100) * stats.total) / (goal/100) );
                bunksAvailableText = `<p style="color: var(--text-secondary);">You can miss</p><p class="text-4xl font-bold text-cyan-400">${bunksAvailable}</p><p style="color: var(--text-secondary);">more classes and stay above ${goal}%.</p>`;
            }

            document.getElementById('bunk-planner-output').innerHTML = bunksAvailableText;

            const logContainer = document.getElementById('course-log-container');
            logContainer.innerHTML = '';

            const courseInstances = state.schedule.filter(s => s.name === courseName);
            const courseInstanceIds = courseInstances.map(i => i.id);
            const historyForCourse = state.history.filter(h => courseInstanceIds.includes(h.classId)).sort((a,b) => new Date(b.date) - new Date(a.date));

            if (historyForCourse.length > 0) {
                historyForCourse.forEach(h => {
                     let statusClass = h.status === 'Present' ? 'text-green-500' : 'text-red-500';
                     if(h.status === 'Cancelled') statusClass = 'text-gray-500';
                     const logEntry = document.createElement('div');
                     logEntry.className = 'flex justify-between items-center p-2 bg-white/5 rounded mb-1';
                     logEntry.innerHTML = `
                        <div>
                            <span>${new Date(h.date + 'T00:00:00').toLocaleDateString()}</span>
                            <span class="font-bold ml-4 ${statusClass}">${h.status}</span>
                            ${h.note ? `<p class="text-xs italic mt-1" style="color: var(--text-secondary);">${h.note}</p>` : ''}
                        </div>
                        <button class="add-note-btn text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md" data-history-id="${h.id}" style="color: var(--text-secondary);">
                            ${h.note ? 'Edit Note' : 'Add Note'}
                        </button>
                     `;
                     logContainer.appendChild(logEntry);
                });
            } else {
                logContainer.innerHTML = `<p style="color: var(--text-secondary);">No attendance marked yet.</p>`;
            }
        };

        const updateWhatIf = () => {
             const stats = calculateAttendanceForCourse(courseName);
             const missedClasses = parseInt(whatIfInput.value) || 0;
             if (missedClasses >= 0) {
                const futureAbsent = stats.absent + missedClasses;
                const futureTotal = stats.total + missedClasses;
                const futurePercentage = futureTotal === 0 ? 100 : Math.round((stats.present / futureTotal) * 100);
                whatIfOutput.textContent = `Your attendance would be ${futurePercentage}%.`;
                whatIfOutput.style.color = futurePercentage < (parseInt(goalInput.value) || 75) ? '#ef4444' : '#22c55e';
             }
        }

        goalInput.oninput = () => { updateDetails(); updateWhatIf(); };
        whatIfInput.oninput = updateWhatIf;
        updateDetails();
        toggleModal(courseDetailsModal, true);
    }

    function exportHistoryToCSV() {
        let csvContent = "data:text/csv;charset=utf-8,Date,Course,Status,Note\n";
        state.history.forEach(h => {
            const course = state.schedule.find(c => c.id === h.classId);
            if (course) {
                const row = [h.date, course.name, h.status, `"${h.note || ''}"`].join(",");
                csvContent += row + "\r\n";
            }
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "attendora_history.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("History exported!");
    }

    function exportData() {
        const dataStr = JSON.stringify(state, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const link = document.createElement("a");
        link.setAttribute("href", dataUri);
        link.setAttribute("download", "attendora_backup.json");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Data backup exported!");
    }

    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedState = JSON.parse(e.target.result);
                if (importedState.schedule && importedState.history) {
                    state = { ...state, ...importedState };
                    saveData();
                    showToast("Data imported successfully! Reloading...");
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                   showToast("Invalid data file.", "error");
                }
            } catch (error) {
                 showToast("Error reading the file. Make sure it's a valid JSON backup.", "error");
                 console.error("Import error:", error);
            }
        };
        reader.readAsText(file);
    }

    // --- GPA CALCULATOR ---
    function renderGpaCalculator() {
        const tbody = document.getElementById('gpa-courses-tbody');
        tbody.innerHTML = '';

        if (state.gpaCourses.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8" style="color: var(--text-secondary);">
                <svg class="mx-auto h-24 w-24 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
                <h3 class="mt-4 text-xl font-semibold text-white">No grades added yet</h3>
                <p class="mt-1">Add courses to start calculating your GPA.</p>
            </td></tr>`;
        } else {
            state.gpaCourses.forEach(course => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-white/5';
                tr.dataset.searchContent = course.name.toLowerCase();
                tr.innerHTML = `
                    <td class="p-4 font-semibold">${course.name}</td>
                    <td class="p-4 text-center">${course.credits}</td>
                    <td class="p-4 text-center">${course.grade}</td>
                    <td class="p-4 text-center">
                        <button class="edit-gpa-btn p-2" data-gpa-id="${course.id}" title="Edit" style="color: var(--text-secondary);"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
                        <button class="delete-gpa-btn p-2 text-red-400" data-gpa-id="${course.id}" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        const { totalCredits, gpa } = calculateGpa();
        document.getElementById('gpa-total-credits').textContent = totalCredits;
        document.getElementById('gpa-current-gpa').textContent = gpa.toFixed(2);
        document.getElementById('gpa-total-courses').textContent = state.gpaCourses.length;
    }

    function calculateGpa() {
        const totalPoints = state.gpaCourses.reduce((acc, course) => acc + (course.grade * course.credits), 0);
        const totalCredits = state.gpaCourses.reduce((acc, course) => acc + course.credits, 0);
        const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
        return { totalCredits, gpa };
    }

    // --- POMODORO TIMER ---
    function togglePomodoro() {
        state.pomodoro.isPomodoroVisible = !state.pomodoro.isPomodoroVisible;
        document.getElementById('pomodoro-timer').classList.toggle('visible', state.pomodoro.isPomodoroVisible);
    }

    function updatePomodoroDisplay() {
        const minutes = Math.floor(state.pomodoro.timeLeft / 60);
        const seconds = state.pomodoro.timeLeft % 60;
        document.getElementById('pomodoro-display').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function startPomodoro() {
        if (state.pomodoro.isRunning) return;
        state.pomodoro.isRunning = true;
        state.pomodoro.timerId = setInterval(() => {
            state.pomodoro.timeLeft--;
            updatePomodoroDisplay();
            if (state.pomodoro.timeLeft <= 0) {
                clearInterval(state.pomodoro.timerId);
                state.pomodoro.isRunning = false;
                state.pomodoro.sessionsCompleted++;
                showToast("Pomodoro session finished!");
                resetPomodoro();
                updateOverviewStats();
                saveData();
            }
        }, 1000);
    }

    function pausePomodoro() {
        clearInterval(state.pomodoro.timerId);
        state.pomodoro.isRunning = false;
    }

    function resetPomodoro() {
        pausePomodoro();
        state.pomodoro.timeLeft = 25 * 60;
        updatePomodoroDisplay();
    }

    function updateNextClassCountdown() {
        if (countdownInterval) clearInterval(countdownInterval);
        const countdownEl = document.getElementById('overview-countdown');
        const countdownNameEl = document.getElementById('overview-countdown-classname');

        const now = new Date();
        const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        let nextClass = null;

        for (let i = 0; i < 7; i++) {
            const checkDate = new Date(now);
            checkDate.setDate(now.getDate() + i);
            const dayName = dayMap[checkDate.getDay()];

            const classesOnDay = state.schedule
                .filter(c => c.day === dayName)
                .sort((a, b) => a.start.localeCompare(b.start));

            for (const c of classesOnDay) {
                const [hours, minutes] = c.start.split(':');
                const classTime = new Date(checkDate);
                classTime.setHours(hours, minutes, 0, 0);

                if (classTime > now) {
                    nextClass = { ...c, time: classTime };
                    break;
                }
            }
            if (nextClass) break;
        }

        if (!nextClass) {
            countdownEl.textContent = 'No upcoming classes';
            countdownNameEl.textContent = '';
            return;
        }

        countdownNameEl.textContent = `is ${nextClass.name}`;

        const update = () => {
            const diff = nextClass.time - new Date();
            if (diff <= 0) {
                countdownEl.textContent = 'Starting now!';
                clearInterval(countdownInterval);
                return;
            }

            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            if (d > 0) countdownEl.textContent = `${d}d ${h}h`;
            else if (h > 0) countdownEl.textContent = `${h}h ${m}m`;
            else if (m > 0) countdownEl.textContent = `${m}m ${s}s`;
            else countdownEl.textContent = `${s}s`;
        };

        update();
        countdownInterval = setInterval(update, 1000);
    }

    // --- SEMESTER WRAPPED ---
    function generateSemesterWrapped() {
        const container = document.getElementById('wrapped-content');

        if (state.history.length < 5) {
            container.innerHTML = `<p class="text-center" style="color: var(--text-secondary);">Not enough data for a summary yet. Keep tracking your attendance!</p>`;
            toggleModal(semesterWrappedModal, true);
            return;
        }

        const presentCount = state.history.filter(h => h.status === 'Present').length;
        const absentCount = state.history.filter(h => h.status === 'Absent').length;
        const total = presentCount + absentCount;
        const overallPercentage = total === 0 ? 100 : Math.round((presentCount / total) * 100);

        const courseStats = [...new Set(state.schedule.map(c => c.name))].map(name => ({
            name,
            stats: calculateAttendanceForCourse(name),
            streak: calculateStreak(name)
        }));

        const bestCourse = courseStats.reduce((best, current) => current.stats.percentage > best.stats.percentage ? current : best, {stats: {percentage: -1}});
        const worstCourse = courseStats.reduce((worst, current) => current.stats.percentage < worst.stats.percentage ? current : worst, {stats: {percentage: 101}});
        const longestStreak = Math.max(0, ...courseStats.map(c => c.streak));
        const unlockedAchievements = Object.values(state.achievements).filter(a => a.unlocked).length;

        container.innerHTML = `
            <div class="p-3 bg-white/5 rounded-lg"><strong>Overall Attendance:</strong> <span class="font-bold text-green-400">${overallPercentage}%</span></div>
            <div class="p-3 bg-white/5 rounded-lg"><strong>Total Classes Attended:</strong> <span class="font-bold">${presentCount}</span></div>
            <div class="p-3 bg-white/5 rounded-lg"><strong>Total Classes Missed:</strong> <span class="font-bold text-red-400">${absentCount}</span></div>
            <div class="p-3 bg-white/5 rounded-lg"><strong>Most Attended Course:</strong> <span class="font-bold text-cyan-400">${bestCourse.name} (${bestCourse.stats.percentage}%)</span></div>
            <div class="p-3 bg-white/5 rounded-lg"><strong>Needs Improvement:</strong> <span class="font-bold text-yellow-400">${worstCourse.name} (${worstCourse.stats.percentage}%)</span></div>
            <div class="p-3 bg-white/5 rounded-lg"><strong>Longest Attendance Streak:</strong> <span class="font-bold text-orange-400">${longestStreak} classes 🔥</span></div>
            <div class="p-3 bg-white/5 rounded-lg"><strong>Achievements Unlocked:</strong> <span class="font-bold text-yellow-300">${unlockedAchievements} 🏆</span></div>
        `;
        toggleModal(semesterWrappedModal, true);
    }

    function shareSemesterWrapped() {
        const content = document.getElementById('wrapped-content').innerText;
        const summary = `My Attendora Semester Wrapped:\n\n${content.replace(/:\s/g, ': ')}\n\nTracked with #Attendora`;

        if (navigator.share) {
            navigator.share({
                title: 'My Semester Wrapped!',
                text: summary,
            }).catch(err => console.error("Share failed:", err));
        } else {
            navigator.clipboard.writeText(summary).then(() => {
                showToast('Summary copied to clipboard!');
            }).catch(err => {
                showToast('Failed to copy summary.', 'error');
            });
        }
    }

    // --- DRAGGABLE OVERVIEW CARDS ---
    function setupDraggableOverviewCards() {
        const grid = document.getElementById('overview-grid');
        let draggedItem = null;

        grid.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('overview-card')) {
                draggedItem = e.target;
                setTimeout(() => e.target.classList.add('dragging'), 0);
            }
        });

         grid.addEventListener('dragend', (e) => {
            if (draggedItem) {
                setTimeout(() => {
                    draggedItem.classList.remove('dragging');
                    draggedItem = null;

                    // Update state with new order
                    const newOrder = [...grid.querySelectorAll('.overview-card')].map(card => card.id);
                    state.settings.dashboardOrder = newOrder;
                    saveData();
                }, 0);
            }
        });

        grid.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(grid, e.clientY);
            if (draggedItem) {
                if (afterElement == null) {
                    grid.appendChild(draggedItem);
                } else {
                    grid.insertBefore(draggedItem, afterElement);
                }
            }
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.overview-card:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function renderOverviewCards() {
        const grid = document.getElementById('overview-grid');
        grid.innerHTML = ''; // Clear existing cards

        const cardHTML = {
            'overview-card-attendance': `<div id="overview-card-attendance" class="card p-6 rounded-xl overview-card" draggable="true"><h3 class="text-lg pointer-events-none" style="color: var(--text-secondary);">Overall Attendance</h3><p id="overview-attendance" class="text-4xl font-bold text-green-400 pointer-events-none">-%</p></div>`,
            'overview-card-courses': `<div id="overview-card-courses" class="card p-6 rounded-xl overview-card" draggable="true"><h3 class="text-lg pointer-events-none" style="color: var(--text-secondary);">Courses Enrolled</h3><p id="overview-courses" class="text-4xl font-bold pointer-events-none">0</p></div>`,
            'overview-card-streaks': `<div id="overview-card-streaks" class="card p-6 rounded-xl overview-card" draggable="true"><h3 class="text-lg pointer-events-none" style="color: var(--text-secondary);">Current Streaks</h3><p id="overview-streaks" class="text-4xl font-bold text-orange-400 pointer-events-none">0 🔥</p></div>`,
             'overview-card-achievements': `<div id="overview-card-achievements" class="card p-6 rounded-xl overview-card" draggable="true"><h3 class="text-lg pointer-events-none" style="color: var(--text-secondary);">Achievements</h3><p id="overview-achievements" class="text-4xl font-bold text-yellow-400 pointer-events-none">0 🏆</p></div>`,
            'overview-card-pomodoro': `<div id="overview-card-pomodoro" class="card p-6 rounded-xl overview-card" draggable="true"><h3 class="text-lg pointer-events-none" style="color: var(--text-secondary);">Pomodoro Stats</h3><p id="overview-pomodoro-sessions" class="text-4xl font-bold pointer-events-none">0</p><p class="text-sm pointer-events-none" style="color: var(--text-secondary);">Sessions Completed</p></div>`,
            'overview-card-countdown': `<div id="overview-card-countdown" class="card p-6 rounded-xl overview-card" draggable="true"><h3 class="text-lg pointer-events-none" style="color: var(--text-secondary);">Next Class In</h3><p id="overview-countdown" class="text-2xl font-bold text-cyan-400 pointer-events-none">No upcoming classes</p><p id="overview-countdown-classname" class="text-sm pointer-events-none" style="color: var(--text-secondary);"></p></div>`
        };

        // Ensure default order if not set
         if (!state.settings.dashboardOrder || state.settings.dashboardOrder.length < 4) {
            state.settings.dashboardOrder = ['overview-card-attendance', 'overview-card-courses', 'overview-card-streaks', 'overview-card-achievements'];
        }

        state.settings.dashboardOrder.forEach(cardId => {
            if(cardHTML[cardId]) {
                grid.innerHTML += cardHTML[cardId];
            }
        });
    }


    // --- LET'S GO ---
    initializeApp();
});