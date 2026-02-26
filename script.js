// --- SYSTÉMOVÁ DATA ---
const defaultGenres = ["Beletrie", "Sci-fi", "Fantasy", "Detektivka", "Thriller", "Horor", "Romantika", "Historický román", "Odborná literatura", "Osobní rozvoj", "Biografie", "Poezie", "Komiks / Manga", "Klasika"];

// --- STAV APLIKACE ---
let users = []; // Formát: { username: 'test', password: '123' }
let allBooks = []; // Všechny knihy všech uživatelů
let currentUser = null; // Kdo je zrovna přihlášený

// --- INICIALIZACE A NAČTÁNÍ Z LOCALSTORAGE ---
function loadData() {
    const savedUsers = localStorage.getItem('library_users');
    const savedBooks = localStorage.getItem('library_books');
    const savedSession = localStorage.getItem('library_session');

    if (savedUsers) users = JSON.parse(savedUsers);
    if (savedBooks) allBooks = JSON.parse(savedBooks);

    initGenresCheckbox();

    if (savedSession) {
        currentUser = savedSession;
        showApp();
    } else {
        showLogin();
    }
}

function saveData() {
    localStorage.setItem('library_users', JSON.stringify(users));
    localStorage.setItem('library_books', JSON.stringify(allBooks));
}

// --- PŘIHLAŠOVÁNÍ ---
function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appScreen').style.display = 'none';
}

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'flex'; 
    document.getElementById('loggedUserName').innerText = currentUser;
    renderBooks();
}

function login() {
    const u = document.getElementById('usernameInput').value.trim();
    const p = document.getElementById('passwordInput').value;
    const errorLabel = document.getElementById('loginError');

    const userFound = users.find(user => user.username === u && user.password === p);
    
    if (userFound) {
        currentUser = u;
        localStorage.setItem('library_session', u);
        errorLabel.style.display = 'none';
        document.getElementById('usernameInput').value = '';
        document.getElementById('passwordInput').value = '';
        showApp();
    } else {
        errorLabel.innerText = "Špatné jméno nebo heslo.";
        errorLabel.style.display = 'block';
    }
}

function register() {
    const u = document.getElementById('usernameInput').value.trim();
    const p = document.getElementById('passwordInput').value;
    const errorLabel = document.getElementById('loginError');

    if (u.length < 3 || p.length < 3) {
        errorLabel.innerText = "Jméno i heslo musí mít alespoň 3 znaky.";
        errorLabel.style.display = 'block';
        return;
    }

    if (users.find(user => user.username === u)) {
        errorLabel.innerText = "Tento uživatel už existuje.";
        errorLabel.style.display = 'block';
        return;
    }

    users.push({ username: u, password: p });
    saveData();
    
    currentUser = u;
    localStorage.setItem('library_session', u);
    errorLabel.style.display = 'none';
    document.getElementById('usernameInput').value = '';
    document.getElementById('passwordInput').value = '';
    showApp();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('library_session');
    showLogin();
}

// --- ZÍSKÁNÍ KNIH AKTUÁLNÍHO UŽIVATELE ---
function getUserBooks() {
    return allBooks.filter(b => b.owner === currentUser);
}

function initGenresCheckbox() {
    const container = document.getElementById('bGenresContainer');
    container.innerHTML = defaultGenres.map(g => `<label><input type="checkbox" value="${g}" class="genre-checkbox"> ${g}</label>`).join('');
}

function setActiveMenu(element) {
    document.querySelectorAll('#menuList li').forEach(li => li.classList.remove('active'));
    if(element) element.classList.add('active');
    document.getElementById('pageTitle').innerText = element ? element.innerText : 'Všechny knihy';
}

// --- VYKRESLOVÁNÍ KNIH ---
function renderBooks(booksToRender = getUserBooks()) {
    const grid = document.getElementById('booksGrid');
    grid.innerHTML = '';

    if(booksToRender === getUserBooks()) {
        booksToRender = booksToRender.filter(b => b.ownership !== 'Wishlist');
    }

    booksToRender.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.onclick = () => editBook(book.id);
        
        let coverHtml = book.cover ? `<img src="${book.cover}" class="book-cover" alt="Obálka">` : `<div class="book-cover"><span>${book.title}</span></div>`;
        let formatClass = book.format === 'E-book' ? 'badge-ebook' : 'badge-physical';
        let genresHtml = (book.genres || []).map(g => `<span class="badge badge-genre">${g}</span>`).join('');

        card.innerHTML = `
            ${coverHtml}
            <div class="book-info">
                <div class="book-title">${book.title}</div>
                <div class="book-author">${book.author}</div>
                <div class="book-badges">
                    <span class="badge ${formatClass}">${book.format}</span>
                    <span class="badge badge-lang">🌐 ${book.language || 'Neznámo'}</span>
                    ${book.readStatus === 'Dočteno' ? '<span class="badge" style="background:#fef08a; color:#854d0e;">⭐ ' + (book.rating || '-') + '</span>' : ''}
                </div>
                <div class="book-badges" style="margin-top: 5px;">${genresHtml}</div>
            </div>
        `;
        grid.appendChild(card);
    });

    updateFiltersAndAuthors();
}

// --- FILTRY ---
function searchBooks() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = getUserBooks().filter(b => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query));
    renderBooks(filtered);
}

function filterByFormat(format) { renderBooks(getUserBooks().filter(b => b.format === format)); }
function filterByReadingStatus(status) { renderBooks(getUserBooks().filter(b => b.readStatus === status)); }
function filterByOwnership(status) { renderBooks(getUserBooks().filter(b => b.ownership === status)); }
function filterWishlist() { renderBooks(getUserBooks().filter(b => b.ownership === 'Wishlist')); }
function filterByGenre(genre) { renderBooks(getUserBooks().filter(b => b.genres && b.genres.includes(genre))); }
function filterByLanguage(lang) { renderBooks(getUserBooks().filter(b => b.language === lang)); }

function updateFiltersAndAuthors() {
    const userBooks = getUserBooks();
    
    let allGenres = [];
    userBooks.forEach(b => { if(b.genres) allGenres.push(...b.genres); });
    const uniqueGenres = [...new Set(allGenres)].sort();
    document.getElementById('genreList').innerHTML = uniqueGenres.map(g => `<li onclick="filterByGenre('${g}')">${g}</li>`).join('');

    const uniqueLangs = [...new Set(userBooks.map(b => b.language).filter(Boolean))].sort();
    document.getElementById('languageList').innerHTML = uniqueLangs.map(l => `<li onclick="filterByLanguage('${l}')">${l}</li>`).join('');

    const authors = [...new Set(userBooks.map(b => b.author))].sort();
    document.getElementById('authorDatalist').innerHTML = authors.map(a => `<option value="${a}">`).join('');
}

// --- MODÁLNÍ OKNO A FORMULÁŘ ---
function openModal() {
    document.getElementById('bookForm').reset();
    document.getElementById('bookId').value = '';
    document.getElementById('modalTitle').innerText = 'Přidat novou knihu';
    document.getElementById('deleteBtnContainer').style.display = 'none';
    document.querySelectorAll('.genre-checkbox').forEach(cb => cb.checked = false);
    document.getElementById('bookModal').style.display = 'flex';
}

function closeModal() { document.getElementById('bookModal').style.display = 'none'; }

function editBook(id) {
    const book = getUserBooks().find(b => b.id === id);
    if(!book) return;

    document.getElementById('bookId').value = book.id;
    document.getElementById('bTitle').value = book.title;
    document.getElementById('bAuthor').value = book.author;
    document.getElementById('bCover').value = book.cover || '';
    document.getElementById('bLanguage').value = book.language || 'Čeština';
    document.getElementById('bFormat').value = book.format;
    document.getElementById('bOwnership').value = book.ownership;
    document.getElementById('bReadStatus').value = book.readStatus;
    document.getElementById('bRating').value = book.rating || '';
    
    document.querySelectorAll('.genre-checkbox').forEach(cb => { cb.checked = (book.genres || []).includes(cb.value); });
    
    document.getElementById('modalTitle').innerText = 'Upravit knihu';
    document.getElementById('deleteBtnContainer').style.display = 'block';
    document.getElementById('bookModal').style.display = 'flex';
}

function saveBook(e) {
    e.preventDefault();
    const id = document.getElementById('bookId').value;
    const selectedGenres = Array.from(document.querySelectorAll('.genre-checkbox:checked')).map(cb => cb.value);

    const bookData = {
        owner: currentUser,
        title: document.getElementById('bTitle').value,
        author: document.getElementById('bAuthor').value,
        cover: document.getElementById('bCover').value,
        language: document.getElementById('bLanguage').value,
        genres: selectedGenres,
        format: document.getElementById('bFormat').value,
        ownership: document.getElementById('bOwnership').value,
        readStatus: document.getElementById('bReadStatus').value,
        rating: document.getElementById('bRating').value
    };

    if (id) {
        const index = allBooks.findIndex(b => b.id == id);
        allBooks[index] = { ...allBooks[index], ...bookData };
    } else {
        bookData.id = Date.now();
        allBooks.push(bookData);
    }

    saveData();
    closeModal();
    setActiveMenu(document.querySelector('#menuList li:first-child'));
    renderBooks();
}

function deleteBook() {
    const id = document.getElementById('bookId').value;
    if(confirm('Opravdu chcete tuto knihu smazat?')) {
        allBooks = allBooks.filter(b => b.id != id);
        saveData();
        closeModal();
        renderBooks();
    }
}

// Start aplikace
window.onload = loadData;
