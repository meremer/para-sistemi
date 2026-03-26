// API Base URL

if (typeof Chart !== 'undefined') Chart.defaults.color = '#a3a3a3';
if (typeof Chart !== 'undefined') Chart.defaults.borderColor = '#262626';

const API_URL = '/api';
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Store for objects to avoid passing JSON in HTML attributes
const dataStore = {
    books: {},
    users: {},
    lendings: {}
};

// ==================== UTILITY FUNCTIONS ====================
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        }
    };

    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);

        if (response.status === 401 && endpoint !== '/auth/login') {
            logout();
            throw new Error('Oturum süresi doldu, lütfen tekrar giriş yapın.');
        }

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(text || `Sunucu hatası: ${response.status}`);
        }

        if (!response.ok) {
            throw new Error(data.error || 'Bir hata oluştu');
        }

        return data;
    } catch (err) {
        showGlobalMessage(err.message, 'error');
        throw err;
    }
}

function showGlobalMessage(message, type = 'success') {
    const el = document.getElementById('globalMessage');
    const content = document.getElementById('globalMessageContent');
    content.textContent = message;
    
    el.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-2xl z-[100] transition-all transform translate-y-0 ${
        type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
    }`;
    el.classList.remove('hidden', 'translate-y-20');
    
    setTimeout(() => {
        el.classList.add('translate-y-20');
        setTimeout(() => el.classList.add('hidden'), 300);
    }, 5000);
}

// ==================== AUTHENTICATION ====================
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;


        const btn = document.getElementById('loginBtn');
        btn.disabled = true;
        btn.classList.add('loading');

        try {
            const data = await apiCall('/auth/login', 'POST', { username, password });
            
            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            initApp();
        } catch (err) {
            // Error handled in apiCall
        } finally {
            btn.disabled = false;
            btn.classList.remove('loading');
        }
    });
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.reload();
}

// ==================== NAVIGATION ====================
function switchAdminTab(tab) {
    document.querySelectorAll('[id$="Tab"]').forEach(el => el.classList.add('hidden'));
    document.getElementById(tab + 'Tab').classList.remove('hidden');
    
    document.querySelectorAll('.adminNavBtn').forEach(btn => {
        btn.classList.remove('bg-primary', 'text-zinc-950');
        btn.classList.add('text-zinc-400', 'hover:bg-zinc-900', 'hover:text-zinc-100');
    });
    
    // Find button that has onclick with the tab name
    const targetBtn = Array.from(document.querySelectorAll('.adminNavBtn')).find(btn => {
        const onclick = btn.getAttribute('onclick');
        return onclick && onclick.includes(`'${tab}'`);
    });
    if (targetBtn) {
        targetBtn.classList.add('bg-primary', 'text-zinc-950');
        targetBtn.classList.remove('text-zinc-400', 'hover:bg-zinc-900', 'hover:text-zinc-100');
    }

    const titles = { dashboard: 'Kontrol Paneli', books: 'Kitaplar', lending: 'Ödünç İşlemleri', members: 'Kullanıcılar', calendar: 'Kitap Takvimi' };
    document.getElementById('adminPageTitle').textContent = titles[tab] || 'Kontrol Paneli';

    if (tab === 'dashboard') loadAdminDashboard();
    if (tab === 'books') loadBooksTable();
    if (tab === 'lending') loadLendingTable();
    if (tab === 'members') loadMembersTable();
    if (tab === 'calendar') loadAdminCalendar();
}

function switchUserTab(tab) {
    document.getElementById('browseTab').classList.add('hidden');
    document.getElementById('borrowedTab').classList.add('hidden');
    document.getElementById('historyTab').classList.add('hidden');
    document.getElementById('userCalendarTab').classList.add('hidden');
    
    const targetId = tab === 'calendar' ? 'userCalendarTab' : tab + 'Tab';
    document.getElementById(targetId).classList.remove('hidden');

    document.querySelectorAll('.userNavBtn').forEach(btn => {
        btn.classList.remove('bg-primary', 'text-zinc-950');
        btn.classList.add('text-zinc-400', 'hover:bg-zinc-900', 'hover:text-zinc-100');
    });
    
    const targetBtn = Array.from(document.querySelectorAll('.userNavBtn')).find(btn => {
        const onclick = btn.getAttribute('onclick');
        return onclick && onclick.includes(`'${tab}'`);
    });
    if (targetBtn) {
        targetBtn.classList.add('bg-primary', 'text-zinc-950');
        targetBtn.classList.remove('text-zinc-400', 'hover:bg-zinc-900', 'hover:text-zinc-100');
    }

    const titles = { browse: 'Kitapları Gözat', borrowed: 'Ödünç Aldıklarım', history: 'Geçmiş', calendar: 'Kitap Takvimi' };
    document.getElementById('userPageTitle').textContent = titles[tab] || 'Kitapları Gözat';

    if (tab === 'browse') loadUserBrowse();
    if (tab === 'borrowed') loadUserBorrowedBooks();
    if (tab === 'history') loadUserHistory();
    if (tab === 'calendar') loadUserCalendar();
}

// ==================== ADMIN DASHBOARD ====================
async function loadAdminDashboard() {
    try {
        const books = await apiCall('/books');
        const lendings = await apiCall('/lendings');
        const stats = await apiCall('/statistics');

        const totalBooks = books.reduce((sum, b) => sum + b.totalCopies, 0);
        const lendedBooks = lendings.filter(l => l.status === 'active').length;
        const availableBooks = books.reduce((sum, b) => sum + b.availableCopies, 0);
        const overdue = lendings.filter(l => l.status === 'active' && new Date(l.returnDate) < new Date()).length;

        document.getElementById('totalBooksCount').textContent = totalBooks;
        document.getElementById('lendedBooksCount').textContent = lendedBooks;
        document.getElementById('availableBooksCount').textContent = availableBooks;
        document.getElementById('overdueCount').textContent = overdue;

        document.getElementById('totalLendingsCount').textContent = stats.summary.totalLendings;
        document.getElementById('activeLendingsCount').textContent = stats.summary.activeLendings;
        document.getElementById('returnedLendingsCount').textContent = stats.summary.returnedLendings;
        document.getElementById('pendingRequestsCount').textContent = stats.summary.pendingRequests || 0;

        updatePendingBadge();
        createBooksReadChart(stats.booksReadCount);
        createUserReadChart(stats.booksReadPerUser);
    } catch (err) {}
}

function createBooksReadChart(booksReadData) {
    const ctx = document.getElementById('booksReadChart');
    if (!ctx) return;
    if (window.booksReadChartInstance) window.booksReadChartInstance.destroy();

    const sortedBooks = Object.values(booksReadData).sort((a, b) => b.readCount - a.readCount).slice(0, 5);
    const labels = sortedBooks.map(b => b.title);
    const readData = sortedBooks.map(b => b.readCount);
    const totalData = sortedBooks.map(b => b.totalLendings);

    window.booksReadChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Okunanlar', data: readData, backgroundColor: '#16a34a' },
                { label: 'Toplam Ödünç', data: totalData, backgroundColor: '#1e40af' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { color: '#262626' }, ticks: { color: '#a3a3a3' } },
                y: { grid: { color: '#262626' }, ticks: { color: '#a3a3a3' } }
            },
            plugins: {
                legend: { labels: { color: '#f5f5f5' } }
            }
        }
    });
}

function createUserReadChart(userReadData) {
    const ctx = document.getElementById('userReadChart');
    if (!ctx) return;
    if (window.userReadChartInstance) window.userReadChartInstance.destroy();

    const sortedUsers = Object.values(userReadData).sort((a, b) => b.booksRead - a.booksRead).slice(0, 5);
    const labels = sortedUsers.map(u => u.fullname);
    const readData = sortedUsers.map(u => u.booksRead);
    const borrowData = sortedUsers.map(u => u.totalBorrowed);

    window.userReadChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Okunan Kitaplar', data: readData, backgroundColor: '#dc2626' },
                { label: 'Ödünç Alınan', data: borrowData, backgroundColor: '#7c3aed' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { color: '#262626' }, ticks: { color: '#a3a3a3' } },
                y: { grid: { color: '#262626' }, ticks: { color: '#a3a3a3' } }
            },
            plugins: {
                legend: { labels: { color: '#f5f5f5' } }
            }
        }
    });
}

// ==================== BOOKS MANAGEMENT ====================
async function loadBooksTable() {
    try {
        const search = document.getElementById('bookSearch')?.value || '';
        const category = document.getElementById('bookCategoryFilter')?.value || 'Hepsi';
        const books = await apiCall(`/books?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`);
        const tbody = document.getElementById('booksList');
        
        dataStore.books = {};
        tbody.innerHTML = books.map(book => {
            dataStore.books[book.id] = book;
            return `
                <tr>
                    <td class="px-6 py-4 font-medium">${escapeHTML(book.title)}</td>
                    <td class="px-6 py-4">${escapeHTML(book.author)}</td>
                    <td class="px-6 py-4">${book.totalCopies}</td>
                    <td class="px-6 py-4"><span class="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-semibold">${book.availableCopies}</span></td>
                    <td class="px-6 py-4">${book.totalCopies - book.availableCopies}</td>
                    <td class="px-6 py-4 flex gap-2">
                        <button onclick="openLendModal(${book.id})" class="text-primary hover:text-zinc-300 font-semibold text-sm">Ödünç Ver</button>
                        <button onclick="openEditBookModal(${book.id})" class="text-zinc-400 hover:text-zinc-200 font-semibold text-sm">Düzenle</button>
                        <button onclick="deleteBook(${book.id})" class="text-secondary-red hover:text-red-400 font-semibold text-sm">Sil</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {}
}

async function addBook() {
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const isbn = document.getElementById('bookISBN').value.trim();
    const copies = document.getElementById('bookCopies').value;
    const category = document.getElementById('bookCategory').value;
    const year = document.getElementById('bookYear').value;

    if (!title || !author || !isbn) return showGlobalMessage('Lütfen zorunlu alanları doldurunuz', 'error');

    try {
        await apiCall('/books', 'POST', {
            title,
            author,
            isbn,
            totalCopies: parseInt(copies, 10) || 1,
            category,
            year: parseInt(year, 10) || new Date().getFullYear()
        });
        closeAddBookModal();
        loadBooksTable();
        showGlobalMessage('Kitap başarıyla eklendi');
    } catch (err) {}
}

async function editBook() {
    const id = document.getElementById('editBookId').value;
    const title = document.getElementById('editBookTitle').value.trim();
    const author = document.getElementById('editBookAuthor').value.trim();
    const isbn = document.getElementById('editBookISBN').value.trim();
    const copies = document.getElementById('editBookCopies').value;
    const category = document.getElementById('editBookCategory').value;
    const year = document.getElementById('editBookYear').value;

    try {
        await apiCall(`/books/${id}`, 'PUT', {
            title,
            author,
            isbn,
            totalCopies: parseInt(copies, 10),
            category,
            year: parseInt(year, 10)
        });
        closeEditBookModal();
        loadBooksTable();
        showGlobalMessage('Kitap başarıyla güncellendi');
    } catch (err) {}
}

async function deleteBook(id) {
    if (!confirm('Bu kitabı silmek istediğinize emin misiniz?')) return;
    try {
        await apiCall(`/books/${id}`, 'DELETE');
        loadBooksTable();
        showGlobalMessage('Kitap silindi');
    } catch (err) {}
}

// ==================== USER MANAGEMENT ====================
async function loadMembersTable() {
    try {
        const users = await apiCall('/users');
        const tbody = document.getElementById('membersList');
        
        dataStore.users = {};
        tbody.innerHTML = users.map(user => {
            dataStore.users[user.id] = user;
            return `
                <tr class="hover:bg-zinc-800 transition-colors">
                    <td class="px-6 py-4 font-medium cursor-pointer" onclick="openUserStatsModal(${user.id})">${escapeHTML(user.fullname)}</td>
                    <td class="px-6 py-4">${escapeHTML(user.username)}</td>
                    <td class="px-6 py-4">${escapeHTML(user.email)}</td>
                    <td class="px-6 py-4">${new Date(user.createdAt).toLocaleDateString('tr-TR')}</td>
                    <td class="px-6 py-4 flex gap-2">
                        <button onclick="openMemberCalendarModal(${user.id})" class="text-amber-600 hover:text-amber-400 font-semibold text-sm">Takvim</button>
                        <button onclick="openEditUserModal(${user.id})" class="text-primary hover:text-zinc-300 font-semibold text-sm">Düzenle</button>
                        <button onclick="openResetPasswordModal(${user.id})" class="text-zinc-400 hover:text-zinc-200 font-semibold text-sm">Şifre Sıfırla</button>
                        <button onclick="deleteUser(${user.id})" class="text-secondary-red hover:text-red-400 font-semibold text-sm">Sil</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {}
}

let currentEditingCalendarUserId = null;

async function openMemberCalendarModal(userId) {
    try {
        currentEditingCalendarUserId = userId;
        const user = dataStore.users[userId];
        document.getElementById('memberCalendarUserName').textContent = user.fullname + ' - Kitap Takvimi';
        document.getElementById('memberCalendarModal').classList.remove('hidden');
        await loadMemberCalendar(userId);
    } catch (err) {}
}

function closeMemberCalendarModal() {
    document.getElementById('memberCalendarModal').classList.add('hidden');
    currentEditingCalendarUserId = null;
}

async function loadMemberCalendar(userId) {
    try {
        const calendar = await apiCall(`/calendar/${userId}`);
        const grid = document.getElementById('memberCalendarGrid');

        grid.innerHTML = calendar.map(entry => {
            const monthName = monthNames[entry.monthIndex - 1];
            return `
                <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-4 hover:border-primary transition-all group">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-[10px] font-bold text-primary uppercase tracking-wider">${monthName}</span>
                        <button onclick="openEditCalendarModal(${entry.id}, ${entry.monthIndex}, ${userId})" aria-label="${monthName} Ayının Kitabını Düzenle" class="text-zinc-500 hover:text-primary transition-colors">
                            <span class="material-symbols-outlined text-xs" aria-hidden="true">edit</span>
                        </button>
                    </div>
                    <div class="space-y-1">
                        <h4 class="font-bold text-zinc-100 text-xs truncate">${entry.bookId ? escapeHTML(entry.bookTitle) : '<span class="text-zinc-500 font-normal">Seçilmedi</span>'}</h4>
                        <p class="text-[10px] text-zinc-500 line-clamp-1">${entry.note ? escapeHTML(entry.note) : 'Not yok'}</p>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {}
}

async function addUser() {
    const fullname = document.getElementById('newUserName').value.trim();
    const username = document.getElementById('newUsername').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword').value;

    try {
        await apiCall('/users', 'POST', { username, password, fullname, email });
        closeAddUserModal();
        loadMembersTable();
        showGlobalMessage('Kullanıcı başarıyla eklendi');
    } catch (err) {}
}

async function editUser() {
    const id = document.getElementById('editUserId').value;
    const fullname = document.getElementById('editUserName').value.trim();
    const email = document.getElementById('editUserEmail').value.trim();

    try {
        await apiCall(`/users/${id}`, 'PUT', { fullname, email });
        closeEditUserModal();
        loadMembersTable();
        showGlobalMessage('Kullanıcı güncellendi');
    } catch (err) {}
}

async function deleteUser(id) {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
        await apiCall(`/users/${id}`, 'DELETE');
        loadMembersTable();
        showGlobalMessage('Kullanıcı silindi');
    } catch (err) {}
}

async function resetUserPassword() {
    const id = document.getElementById('resetPasswordUserId').value;
    const newPassword = document.getElementById('resetNewPassword').value;
    if (!newPassword) return showGlobalMessage('Yeni şifre giriniz', 'error');

    try {
        await apiCall(`/users/${id}/reset-password`, 'POST', { newPassword });
        closeResetPasswordModal();
        showGlobalMessage('Şifre sıfırlandı');
    } catch (err) {}
}

// ==================== LENDING MANAGEMENT ====================
async function loadLendingTable() {
    try {
        const search = document.getElementById('lendingSearch')?.value || '';
        const status = document.getElementById('lendingStatusFilter')?.value || 'Hepsi';
        const lendings = await apiCall(`/lendings?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`);
        const tbody = document.getElementById('lendingList');

        dataStore.lendings = {};
        tbody.innerHTML = lendings.map(lending => {
            dataStore.lendings[lending.id] = lending;
            const isOverdue = lending.status === 'active' && new Date(lending.returnDate) < new Date();

            let statusBadge = '';
            switch(lending.status) {
                case 'returned': statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">İADE EDİLDİ</span>'; break;
                case 'pending': statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">BEKLEMEDE</span>'; break;
                case 'rejected': statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400">REDDEDİLDİ</span>'; break;
                default:
                    statusBadge = isOverdue
                        ? '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">GEÇ KALAN</span>'
                        : '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">AKTİF</span>';
            }

            let actions = '-';
            if (lending.status === 'active') {
                actions = `<button onclick="openReturnModal(${lending.id})" class="text-primary hover:text-zinc-300 font-semibold text-sm">İade Al</button>`;
            } else if (lending.status === 'pending') {
                actions = `
                    <div class="flex gap-2">
                        <button onclick="approveRequest(${lending.id})" class="text-success hover:text-green-400 font-semibold text-sm">Onayla</button>
                        <button onclick="rejectRequest(${lending.id})" class="text-secondary-red hover:text-red-400 font-semibold text-sm">Reddet</button>
                    </div>
                `;
            }

            return `
                <tr>
                    <td class="px-6 py-4 font-medium">${escapeHTML(lending.userName)}</td>
                    <td class="px-6 py-4">${escapeHTML(lending.bookTitle)}</td>
                    <td class="px-6 py-4">${escapeHTML(lending.lendDate)}</td>
                    <td class="px-6 py-4">${escapeHTML(lending.returnDate)}</td>
                    <td class="px-6 py-4">${statusBadge}</td>
                    <td class="px-6 py-4">${actions}</td>
                </tr>
            `;
        }).join('');

        updatePendingBadge();
    } catch (err) {}
}

async function updatePendingBadge() {
    if (currentUser.role !== 'admin') return;
    try {
        const { count } = await apiCall('/lendings/pending-count');
        const badge = document.getElementById('pendingBadge');
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    } catch (err) {}
}

async function approveRequest(id) {
    try {
        await apiCall(`/lendings/${id}/approve`, 'PUT');
        showGlobalMessage('İstek onaylandı');
        loadLendingTable();
        updatePendingBadge();
    } catch (err) {}
}

async function rejectRequest(id) {
    if (!confirm('Bu isteği reddetmek istediğinize emin misiniz?')) return;
    try {
        await apiCall(`/lendings/${id}/reject`, 'PUT');
        showGlobalMessage('İstek reddedildi');
        loadLendingTable();
        updatePendingBadge();
    } catch (err) {}
}

async function submitLend() {
    const userId = document.getElementById('lendUserId').value;
    const bookId = document.getElementById('lendBookId').value;
    const lendDate = document.getElementById('lendDate').value;
    const returnDate = document.getElementById('returnDate').value;

    try {
        await apiCall('/lendings', 'POST', { userId, bookId, lendDate, returnDate });
        closeLendModal();
        loadLendingTable();
        showGlobalMessage('Kitap ödünç verildi');
    } catch (err) {}
}

async function submitReturn() {
    const lendingId = document.getElementById('returnLendingId').value;
    const read = document.getElementById('readStatus').value === 'true';

    try {
        await apiCall(`/lendings/${lendingId}/return`, 'PUT', { read });
        closeReturnModal();
        if (currentUser.role === 'admin') {
            loadLendingTable();
            loadAdminDashboard();
        } else {
            loadUserBorrowedBooks();
            loadUserHistory();
        }
        showGlobalMessage('Kitap iade alındı');
    } catch (err) {}
}

async function openUserStatsModal(userId) {
    try {
        const user = dataStore.users[userId];
        document.getElementById('userStatsName').textContent = user.fullname;
        document.getElementById('userStatsUsername').textContent = '@' + user.username;
        document.getElementById('userStatsModal').classList.remove('hidden');
        await loadUserStatistics(userId);
    } catch (err) {}
}

function closeUserStatsModal() {
    document.getElementById('userStatsModal').classList.add('hidden');
}

async function loadUserStatistics(userId) {
    try {
        const stats = await apiCall('/statistics');
        const lendings = await apiCall('/lendings');
        const books = await apiCall('/books');
        
        const userStats = stats.booksReadPerUser[userId];
        const userLendings = lendings.filter(l => l.userId === userId);
        
        if (!userStats) {
            document.getElementById('userTotalBorrowed').textContent = '0';
            document.getElementById('userBooksRead').textContent = '0';
            document.getElementById('userBorrowedBooksTable').innerHTML = '<tr><td colspan="3" class="px-4 py-4 text-center text-zinc-400">Kayıt bulunamadı</td></tr>';
            return;
        }

        document.getElementById('userTotalBorrowed').textContent = userStats.totalBorrowed;
        document.getElementById('userBooksRead').textContent = userStats.booksRead;

        createUserDetailChart(userStats, userLendings);

        const tbody = document.getElementById('userBorrowedBooksTable');
        tbody.innerHTML = userLendings.map(lending => {
            const book = books.find(b => b.id === lending.bookId);
            return `
                <tr>
                    <td class="px-4 py-3">${escapeHTML(book?.title || 'Silinmiş Kitap')}</td>
                    <td class="px-4 py-3"><span class="px-2 py-1 rounded text-xs ${lending.status === 'active' ? 'bg-primary text-zinc-950' : 'bg-green-500/10 text-green-400 border border-green-500/20'}">${lending.status === 'active' ? 'Aktif' : 'İade Edildi'}</span></td>
                    <td class="px-4 py-3">${lending.read ? '✓ Evet' : '✗ Hayır'}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {}
}

function createUserDetailChart(userStats, userLendings) {
    const ctx = document.getElementById('userStatsChart');
    if (!ctx) return;
    if (window.userDetailChartInstance) window.userDetailChartInstance.destroy();

    const readBooks = userLendings.filter(l => l.read).length;
    const unreadBooks = userLendings.length - readBooks;
    const activeBooks = userLendings.filter(l => l.status === 'active').length;
    const returnedBooks = userLendings.filter(l => l.status === 'returned').length;

    window.userDetailChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Okunan', 'Okunmayan', 'Aktif', 'Geri Alındı'],
            datasets: [{
                data: [readBooks, unreadBooks, activeBooks, returnedBooks],
                backgroundColor: ['#16a34a', '#f59e0b', '#3b82f6', '#10b981']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { color: '#262626' }, ticks: { color: '#a3a3a3' } },
                y: { grid: { color: '#262626' }, ticks: { color: '#a3a3a3' } }
            },
            plugins: {
                legend: { labels: { color: '#f5f5f5' } }
            }
        }
    });
}

// ==================== USER PANEL ====================
async function loadUserBrowse() {
    try {
        const search = document.getElementById('userBookSearch')?.value || '';
        const category = document.getElementById('userBookCategoryFilter')?.value || 'Hepsi';
        const [books, lendings] = await Promise.all([
            apiCall(`/books?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`),
            apiCall('/lendings')
        ]);
        const tbody = document.getElementById('userBrowseList');
        
        const pendingOrActive = lendings.filter(l => l.status === 'pending' || l.status === 'active');

        tbody.innerHTML = books.map(book => {
            const isRequested = pendingOrActive.find(l => l.bookId === book.id);
            let actionBtn = '';

            if (isRequested) {
                if (isRequested.status === 'pending') {
                    actionBtn = `<span class="text-amber-600 font-semibold text-sm">İstek Gönderildi</span>`;
                } else {
                    actionBtn = `<span class="text-green-600 font-semibold text-sm">Zaten Sizde</span>`;
                }
            } else {
                actionBtn = `<button onclick="userBorrowBook(${book.id})" class="text-primary hover:text-zinc-300 font-semibold text-sm">İstek Et</button>`;
            }

            return `
                <tr>
                    <td class="px-6 py-4 font-medium">${escapeHTML(book.title)}</td>
                    <td class="px-6 py-4">${escapeHTML(book.author)}</td>
                    <td class="px-6 py-4">${escapeHTML(book.category)}</td>
                    <td class="px-6 py-4">
                        ${book.availableCopies > 0
                            ? `<span class="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-semibold">${book.availableCopies} mevcut</span>`
                            : `<span class="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-xs font-semibold">Mevcut değil</span>`
                        }
                    </td>
                    <td class="px-6 py-4">${actionBtn}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {}
}

async function userBorrowBook(bookId) {
    const today = new Date().toISOString().split('T')[0];
    const returnDate = new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0];
    
    try {
        await apiCall('/lendings', 'POST', { userId: currentUser.id, bookId, lendDate: today, returnDate });
        loadUserBrowse();
        showGlobalMessage('Kitap isteği iletildi, admin onayı bekleniyor');
    } catch (err) {}
}

async function loadUserBorrowedBooks() {
    try {
        const lendings = await apiCall('/lendings');
        const activeOrPending = lendings.filter(l => l.status === 'active' || l.status === 'pending');
        const tbody = document.getElementById('userBorrowedList');

        const activeCount = lendings.filter(l => l.status === 'active').length;
        const read = lendings.filter(l => l.status === 'returned' && l.read).length;
        const overdue = lendings.filter(l => l.status === 'active' && new Date(l.returnDate) < new Date()).length;

        document.getElementById('userBorrowedCount').textContent = activeCount;
        document.getElementById('userReadCount').textContent = read;
        document.getElementById('userOverdueCount').textContent = overdue;

        dataStore.lendings = {};
        tbody.innerHTML = activeOrPending.map(lending => {
            dataStore.lendings[lending.id] = lending;
            const isOverdue = lending.status === 'active' && new Date(lending.returnDate) < new Date();
            return `
                <tr>
                    <td class="px-6 py-4 font-medium">${escapeHTML(lending.bookTitle)}</td>
                    <td class="px-6 py-4">${escapeHTML(lending.lendDate)}</td>
                    <td class="px-6 py-4">${escapeHTML(lending.returnDate)}</td>
                    <td class="px-6 py-4">
                        <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                            lending.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            (isOverdue ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-primary text-zinc-950')
                        }">
                            ${lending.status === 'pending' ? 'ONAY BEKLİYOR' : (isOverdue ? 'GEÇ KALAN' : 'AKTİF')}
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        ${lending.status === 'active' ? `<button onclick="openReturnModal(${lending.id})" class="text-primary hover:text-zinc-300 font-semibold text-sm">İade Et</button>` : '-'}
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {}
}

async function loadUserHistory() {
    try {
        const lendings = await apiCall('/lendings');
        const returned = lendings.filter(l => l.status === 'returned');
        const tbody = document.getElementById('userHistoryList');

        tbody.innerHTML = returned.map(lending => `
            <tr>
                <td class="px-6 py-4 font-medium">${escapeHTML(lending.bookTitle)}</td>
                <td class="px-6 py-4">${escapeHTML(lending.lendDate)}</td>
                <td class="px-6 py-4">${escapeHTML(lending.actualReturnDate)}</td>
                <td class="px-6 py-4">
                    <span class="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                        ${lending.read ? '✓ Okunmuş' : 'Okunmamış'}
                    </span>
                </td>
            </tr>
        `).join('');
    } catch (err) {}
}

// ==================== CALENDAR MANAGEMENT ====================
const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

async function loadAdminCalendar() {
    try {
        const calendar = await apiCall('/calendar');
        const grid = document.getElementById('adminCalendarGrid');
        
        grid.innerHTML = calendar.map(entry => {
            const monthName = monthNames[entry.monthIndex - 1];
            return `
                <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-5 hover:border-primary transition-all group">
                    <div class="flex justify-between items-start mb-4">
                        <span class="text-xs font-bold text-primary uppercase tracking-wider">${monthName}</span>
                        <button onclick="openEditCalendarModal(${entry.id}, ${entry.monthIndex})" aria-label="${monthName} Ayının Kitabını Düzenle" class="text-zinc-500 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
                            <span class="material-symbols-outlined text-sm" aria-hidden="true">edit</span>
                        </button>
                    </div>
                    <div class="space-y-2">
                        <h4 class="font-bold text-zinc-100">${entry.bookId ? escapeHTML(entry.bookTitle) : '<span class="text-zinc-500 font-normal">Kitap seçilmedi</span>'}</h4>
                        <p class="text-xs text-zinc-500 line-clamp-2">${entry.note ? escapeHTML(entry.note) : 'Açıklama yok'}</p>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {}
}

async function loadUserCalendar() {
    try {
        const calendar = await apiCall('/calendar');
        const grid = document.getElementById('userCalendarGrid');
        
        grid.innerHTML = calendar.map(entry => {
            const monthName = monthNames[entry.monthIndex - 1];
            return `
                <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-primary transition-all group">
                    <div class="flex justify-between items-start mb-3">
                        <span class="text-xs font-bold text-primary uppercase tracking-wider">${monthName}</span>
                        <button onclick="openEditCalendarModal(${entry.id}, ${entry.monthIndex})" aria-label="${monthName} Ayının Kitabını Düzenle" class="text-zinc-500 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
                            <span class="material-symbols-outlined text-sm" aria-hidden="true">edit</span>
                        </button>
                    </div>
                    <div class="space-y-3">
                        <div class="p-3 bg-slate-50 rounded-lg">
                            <h4 class="font-bold text-zinc-100 text-sm">${entry.bookId ? escapeHTML(entry.bookTitle) : '<span class="text-zinc-500 font-normal">Kitap seçilmedi</span>'}</h4>
                            <p class="text-xs text-zinc-500">${entry.bookId ? escapeHTML(entry.bookAuthor) : ''}</p>
                        </div>
                        ${entry.note ? `<p class="text-xs text-zinc-400 italic">"${escapeHTML(entry.note)}"</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {}
}

async function openEditCalendarModal(id, monthIndex, userId = null) {
    try {
        const endpoint = userId ? `/calendar/${userId}` : '/calendar';
        const calendar = await apiCall(endpoint);
        const entry = calendar.find(e => e.id === id);
        const books = await apiCall('/books');
        
        document.getElementById('editCalendarId').value = id;
        document.getElementById('editCalendarMonthName').textContent = monthNames[monthIndex - 1] + ' Ayının Kitabı';
        
        const select = document.getElementById('editCalendarBookId');
        select.innerHTML = '<option value="">Kitap Seçin (Yok)</option>';
        books.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.textContent = b.title;
            if (b.id === entry.bookId) opt.selected = true;
            select.appendChild(opt);
        });
        
        document.getElementById('editCalendarNote').value = entry.note || '';
        document.getElementById('editCalendarModal').classList.remove('hidden');
    } catch (err) {}
}

function closeEditCalendarModal() {
    document.getElementById('editCalendarModal').classList.add('hidden');
}

async function updateCalendar() {
    const id = document.getElementById('editCalendarId').value;
    const bookId = document.getElementById('editCalendarBookId').value;
    const note = document.getElementById('editCalendarNote').value.trim();

    try {
        await apiCall(`/calendar/${id}`, 'PUT', { bookId: bookId ? parseInt(bookId, 10) : null, note });
        closeEditCalendarModal();
        if (currentUser.role === 'admin') {
            if (currentEditingCalendarUserId && currentEditingCalendarUserId !== currentUser.id) {
                loadMemberCalendar(currentEditingCalendarUserId);
            } else {
                loadAdminCalendar();
            }
        } else {
            loadUserCalendar();
        }
        showGlobalMessage('Takvim güncellendi');
    } catch (err) {}
}

// ==================== PROFILE ====================
async function openProfileModal() {
    try {
        const user = await apiCall('/profile');
        document.getElementById('profileFullname').value = user.fullname;
        document.getElementById('profileEmail').value = user.email;
        document.getElementById('profileModal').classList.remove('hidden');
    } catch (err) {}
}

async function updateProfile() {
    const fullname = document.getElementById('profileFullname').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    try {
        await apiCall('/profile', 'PUT', { fullname, email });
        currentUser.fullname = fullname;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        const usernameEl = document.getElementById(currentUser.role + 'Username');
        if (usernameEl) usernameEl.textContent = fullname;
        
        closeProfileModal();
        showGlobalMessage('Profil güncellendi');
    } catch (err) {}
}

async function changePassword() {
    const currentPassword = document.getElementById('profileCurrentPassword').value;
    const newPassword = document.getElementById('profileNewPassword').value;
    if (!currentPassword || !newPassword) return showGlobalMessage('Tüm şifre alanlarını doldurun', 'error');

    try {
        await apiCall('/profile/password', 'PUT', { currentPassword, newPassword });
        document.getElementById('profileCurrentPassword').value = '';
        document.getElementById('profileNewPassword').value = '';
        showGlobalMessage('Şifre değiştirildi');
    } catch (err) {}
}

// ==================== MODALS ====================
function openAddBookModal() { document.getElementById('addBookModal').classList.remove('hidden'); }
function closeAddBookModal() { document.getElementById('addBookModal').classList.add('hidden'); }

function openEditBookModal(bookId) {
    const book = dataStore.books[bookId];
    if (!book) return;
    document.getElementById('editBookId').value = book.id;
    document.getElementById('editBookTitle').value = book.title;
    document.getElementById('editBookAuthor').value = book.author;
    document.getElementById('editBookISBN').value = book.isbn;
    document.getElementById('editBookCopies').value = book.totalCopies;
    document.getElementById('editBookCategory').value = book.category;
    document.getElementById('editBookYear').value = book.year;
    document.getElementById('editBookModal').classList.remove('hidden');
}
function closeEditBookModal() { document.getElementById('editBookModal').classList.add('hidden'); }

function openAddUserModal() { document.getElementById('addUserModal').classList.remove('hidden'); }
function closeAddUserModal() { document.getElementById('addUserModal').classList.add('hidden'); }

function openEditUserModal(userId) {
    const user = dataStore.users[userId];
    if (!user) return;
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserName').value = user.fullname;
    document.getElementById('editUserEmail').value = user.email;
    document.getElementById('editUserModal').classList.remove('hidden');
}
function closeEditUserModal() { document.getElementById('editUserModal').classList.add('hidden'); }

async function openLendModal(bookId) {
    const book = dataStore.books[bookId];
    if (!book) return;
    if (book.availableCopies <= 0) return showGlobalMessage('Mevcut kopya yok', 'error');

    const users = await apiCall('/users');
    document.getElementById('lendBookId').value = bookId;
    document.getElementById('lendBookTitle').value = book.title;
    
    const select = document.getElementById('lendUserId');
    select.innerHTML = '<option value="">Seçiniz</option>';
    users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = u.fullname;
        select.appendChild(opt);
    });
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('lendDate').value = today;
    document.getElementById('returnDate').value = new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0];
    document.getElementById('lendBookModal').classList.remove('hidden');
}
function closeLendModal() { document.getElementById('lendBookModal').classList.add('hidden'); }

function openReturnModal(lendingId) {
    const lending = dataStore.lendings[lendingId];
    if (!lending) return;
    document.getElementById('returnLendingId').value = lendingId;
    document.getElementById('returnBookTitle').value = lending.bookTitle;
    document.getElementById('returnBookModal').classList.remove('hidden');
}
function closeReturnModal() { document.getElementById('returnBookModal').classList.add('hidden'); }

function openResetPasswordModal(userId) {
    const user = dataStore.users[userId];
    if (!user) return;
    document.getElementById('resetPasswordUserId').value = user.id;
    document.getElementById('resetPasswordUsername').textContent = user.username;
    document.getElementById('resetPasswordModal').classList.remove('hidden');
}
function closeResetPasswordModal() { document.getElementById('resetPasswordModal').classList.add('hidden'); }

function closeProfileModal() { document.getElementById('profileModal').classList.add('hidden'); }

// ==================== APP INIT ====================
function initApp() {
    if (authToken && currentUser) {
        document.getElementById('loginPage').classList.add('hidden');
        document.title = currentUser.role === 'admin' ? 'Argeta Admin' : 'Argeta User';
        const sidebarTitle = document.getElementById(currentUser.role === 'admin' ? 'adminSidebarTitle' : 'userSidebarTitle');
        if (sidebarTitle) sidebarTitle.textContent = currentUser.role === 'admin' ? 'Argeta Admin' : 'Argeta User';
        if (currentUser.role === 'admin') {
            document.getElementById('adminDashboard').classList.remove('hidden');
            document.getElementById('adminUsername').textContent = currentUser.fullname;
            switchAdminTab('dashboard');
            updatePendingBadge();
        } else {
            document.getElementById('userDashboard').classList.remove('hidden');
            document.getElementById('userUsername').textContent = currentUser.fullname;
            switchUserTab('browse');
        }
    } else {
        document.getElementById('loginPage').classList.remove('hidden');
        document.getElementById('adminDashboard').classList.add('hidden');
        document.getElementById('userDashboard').classList.add('hidden');
    }
}

window.addEventListener('load', initApp);
