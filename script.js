const defaultGenres = ["Beletrie", "Sci-fi", "Fantasy", "Detektivka", "Thriller", "Horor", "Romantika", "Historický román", "Odborná literatura", "Osobní rozvoj", "Biografie", "Poezie", "Komiks / Manga", "Klasika"];

let users = []; 
let allBooks = []; 
let currentUser = null; 

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

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appScreen').style.display = 'none';
}

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'flex'; 
    document.getElementById('loggedUserName').innerText = currentUser;
    renderHome();
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

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

function toggleFilters() {
    document.getElementById('filtersPanel').classList.toggle('hidden');
}

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
    if(window.innerWidth <= 850) toggleSidebar();
}

// Zobrazí hlavní stránku (včetně seskupených sérií)
function renderHome() {
    document.getElementById('pageTitle').innerText = 'Všechny knihy';
    renderBooks(getUserBooks(), false, "", true);
}

// Zobrazí POUZE seznam sérií
function renderSeriesView() {
    document.getElementById('pageTitle').innerText = 'Knižní série';
    const grid = document.getElementById('booksGrid');
    grid.innerHTML = '';
    document.getElementById('backToBooksBtn').style.display = 'none';

    const userBooks = getUserBooks();
    const seriesGroups = {};
    userBooks.forEach(b => {
        if (b.series && b.series.trim() !== "") {
            if (!seriesGroups[b.series]) seriesGroups[b.series] = [];
            seriesGroups[b.series].push(b);
        }
    });

    for (const sName in seriesGroups) {
        const sBooks = seriesGroups[sName];
        const card = document.createElement('div');
        card.className = 'book-card series-card';
        card.onclick = () => renderBooks(sBooks, true, sName, false); 
        
        card.innerHTML = `
            <div class="book-cover" style="background: linear-gradient(135deg, #334155, #0f172a);">
                <div style="text-align:center;">
                    <div class="series-icon">📚</div>
                    <span>${sBooks.length} knih v sérii</span>
                </div>
            </div>
            <div class="book-info">
                <div class="book-title">${sName}</div>
                <div class="book-author">Knižní série</div>
            </div>
        `;
        grid.appendChild(card);
    }
}

function renderBooks(booksToRender = getUserBooks(), isInsideSeries = false, seriesName = "", groupSeries = false) {
    const grid = document.getElementById('booksGrid');
    grid.innerHTML = '';
    
    document.getElementById('backToBooksBtn').style.display = isInsideSeries ? 'block' : 'none';

    if(booksToRender === getUserBooks() && !isInsideSeries) {
        booksToRender = booksToRender.filter(b => b.ownership !== 'Wishlist');
    }

    if (isInsideSeries) {
        document.getElementById('pageTitle').innerText = 'Série: ' + seriesName;
        booksToRender.sort((a, b) => (parseInt(a.seriesOrder) || 999) - (parseInt(b.seriesOrder) || 999));
    }

    let standaloneBooks = [];

    if (groupSeries && !isInsideSeries) {
        const seriesGroups = {};
        booksToRender.forEach(b => {
            if (b.series && b.series.trim() !== "") {
                if (!seriesGroups[b.series]) seriesGroups[b.series] = [];
                seriesGroups[b.series].push(b);
            } else {
                standaloneBooks.push(b);
            }
        });

        for (const sName in seriesGroups) {
            const sBooks = seriesGroups[sName];
            const card = document.createElement('div');
            card.className = 'book-card series-card';
            card.onclick = () => renderBooks(sBooks, true, sName, false); 
            
            card.innerHTML = `
                <div class="book-cover" style="background: linear-gradient(135deg, #334155, #0f172a);">
                    <div style="text-align:center;">
                        <div class="series-icon">📚</div>
                        <span>${sBooks.length} knih v sérii</span>
                    </div>
                </div>
                <div class="book-info">
                    <div class="book-title">${sName}</div>
                    <div class="book-author">Knižní série</div>
                </div>
            `;
            grid.appendChild(card);
        }
        booksToRender = standaloneBooks;
    }

    booksToRender.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.onclick = () => editBook(book.id);
        
        let coverClass = (book.format === 'E-book') ? 'book-cover cover-ebook' : 'book-cover';
        let coverHtml = book.cover ? `<img src="${book.cover}" class="${coverClass}" alt="Obálka">` : `<div class="${coverClass}"><span>${book.title}</span></div>`;
        
        // Obojí = oba odznáčky
        let formatBadges = '';
        if (book.format === 'Obojí') {
            formatBadges = `<span class="badge badge-physical">Fyzická</span> <span class="badge badge-ebook">E-book</span>`;
        } else if (book.format === 'E-book') {
            formatBadges = `<span class="badge badge-ebook">E-book</span>`;
        } else {
            formatBadges = `<span class="badge badge-physical">Fyzická</span>`;
        }

        let genresHtml = (book.genres || []).map(g => `<span class="badge badge-genre">${g}</span>`).join('');
        let rozborHtml = book.rozborUrl ? `<a href="${book.rozborUrl}" target="_blank" class="link-rozbor" onclick="event.stopPropagation()">📄 Otevřít rozbor</a>` : '';
        let reviewHtml = book.review ? `<div class="book-review-preview">"${book.review}"</div>` : '';

        let displayTitle = book.title;
        if (isInsideSeries && book.seriesOrder) {
            displayTitle = `#${book.seriesOrder} - ` + book.title;
        }

        card.innerHTML = `
            ${coverHtml}
            <div class="book-info">
                <div class="book-title">${displayTitle}</div>
                <div class="book-author">${book.author}</div>
                <div class="book-badges">
                    ${formatBadges}
                    <span class="badge badge-lang">🌐 ${book.language || 'Neznámo'}</span>
                    ${book.purpose === 'Povinná četba' ? '<span class="badge" style="background:#fee2e2; color:#b91c1c;">🎓 Povinná četba</span>' : ''}
                    ${book.readStatus === 'Dočteno' ? '<span class="badge badge-read">✓ Přečteno</span>' : ''}
                    ${book.rating ? '<span class="badge badge-read">⭐ ' + book.rating + '</span>' : ''}
                </div>
                <div class="book-badges" style="margin-top: 5px;">${genresHtml}</div>
                ${rozborHtml}
                ${reviewHtml}
            </div>
        `;
        grid.appendChild(card);
    });

    updateFiltersAndAuthors();
}

function searchBooks() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = getUserBooks().filter(b => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query) || (b.series && b.series.toLowerCase().includes(query)));
    renderBooks(filtered, false, "", false); 
}

function filterByFormat(format) { 
    if(!format) { renderHome(); return; }
    renderBooks(getUserBooks().filter(b => b.format === format), false, "", false); 
}
function filterByReadingStatus(status) { 
    if(!status) { renderHome(); return; }
    renderBooks(getUserBooks().filter(b => b.readStatus === status), false, "", false); 
}
function filterByOwnership(status) { 
    document.getElementById('pageTitle').innerText = status === 'Vlastní' ? 'Moje knihy' : status;
    renderBooks(getUserBooks().filter(b => b.ownership === status), false, "", false); 
}
function filterWishlist() { 
    document.getElementById('pageTitle').innerText = 'Wishlist';
    renderBooks(getUserBooks().filter(b => b.ownership === 'Wishlist'), false, "", false); 
}
function filterByGenre(genre) { 
    if(!genre) { renderHome(); return; }
    renderBooks(getUserBooks().filter(b => b.genres && b.genres.includes(genre)), false, "", false); 
}
function filterByLanguage(lang) { 
    if(!lang) { renderHome(); return; }
    renderBooks(getUserBooks().filter(b => b.language === lang), false, "", false); 
}
function filterByPurpose(purpose) {
    document.getElementById('pageTitle').innerText = purpose;
    // Zobrazí knihy individuálně (bez slučování do sérií), aby šly dobře rolovat
    renderBooks(getUserBooks().filter(b => b.purpose === purpose), false, "", false);
}

function updateFiltersAndAuthors() {
    const userBooks = getUserBooks();
    
    let allGenres = [];
    userBooks.forEach(b => { if(b.genres) allGenres.push(...b.genres); });
    const uniqueGenres = [...new Set(allGenres)].sort();
    document.getElementById('filterGenre').innerHTML = '<option value="">Všechny žánry</option>' + uniqueGenres.map(g => `<option value="${g}">${g}</option>`).join('');

    const uniqueLangs = [...new Set(userBooks.map(b => b.language).filter(Boolean))].sort();
    document.getElementById('filterLanguage').innerHTML = '<option value="">Všechny jazyky</option>' + uniqueLangs.map(l => `<option value="${l}">${l}</option>`).join('');

    const authors = [...new Set(userBooks.map(b => b.author))].sort();
    document.getElementById('authorDatalist').innerHTML = authors.map(a => `<option value="${a}">`).join('');
}

document.getElementById('bCoverFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('bCoverBase64').value = e.target.result;
            document.getElementById('bCoverUrl').value = ''; 
        };
        reader.readAsDataURL(file);
    }
});

function openModal() {
    document.getElementById('bookForm').reset();
    document.getElementById('bookId').value = '';
    document.getElementById('bCoverBase64').value = ''; 
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
    
    document.getElementById('bCoverUrl').value = book.cover && book.cover.startsWith('http') ? book.cover : '';
    document.getElementById('bCoverBase64').value = book.cover && book.cover.startsWith('data:image') ? book.cover : '';
    document.getElementById('bCoverFile').value = ''; 
    
    document.getElementById('bPurpose').value = book.purpose || 'Pro radost';
    document.getElementById('bRozborUrl').value = book.rozborUrl || '';
    document.getElementById('bSeries').value = book.series || '';
    document.getElementById('bSeriesOrder').value = book.seriesOrder || '';

    document.getElementById('bLanguage').value = book.language || 'Čeština';
    document.getElementById('bFormat').value = book.format;
    document.getElementById('bOwnership').value = book.ownership;
    document.getElementById('bReadStatus').value = book.readStatus;
    document.getElementById('bRating').value = book.rating || '';
    document.getElementById('bReview').value = book.review || '';
    
    document.querySelectorAll('.genre-checkbox').forEach(cb => { cb.checked = (book.genres || []).includes(cb.value); });
    
    document.getElementById('modalTitle').innerText = 'Upravit knihu';
    document.getElementById('deleteBtnContainer').style.display = 'block';
    document.getElementById('bookModal').style.display = 'flex';
}

function saveBook(e) {
    e.preventDefault();
    const id = document.getElementById('bookId').value;
    const selectedGenres = Array.from(document.querySelectorAll('.genre-checkbox:checked')).map(cb => cb.value);

    let finalCover = document.getElementById('bCoverBase64').value;
    if (!finalCover) {
        finalCover = document.getElementById('bCoverUrl').value;
    }

    const bookData = {
        owner: currentUser,
        title: document.getElementById('bTitle').value,
        author: document.getElementById('bAuthor').value,
        cover: finalCover,
        purpose: document.getElementById('bPurpose').value,
        rozborUrl: document.getElementById('bRozborUrl').value,
        series: document.getElementById('bSeries').value,
        seriesOrder: document.getElementById('bSeriesOrder').value,
        language: document.getElementById('bLanguage').value,
        genres: selectedGenres,
        format: document.getElementById('bFormat').value,
        ownership: document.getElementById('bOwnership').value,
        readStatus: document.getElementById('bReadStatus').value,
        rating: document.getElementById('bRating').value,
        review: document.getElementById('bReview').value 
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
    renderHome(); // Po uložení se automaticky vrátí na domovskou stránku
    setActiveMenu(document.querySelector('#menuList li:first-child'));
}

function deleteBook() {
    const id = document.getElementById('bookId').value;
    if(confirm('Opravdu chcete tuto knihu smazat?')) {
        allBooks = allBooks.filter(b => b.id != id);
        saveData();
        closeModal();
        renderHome();
    }
}

// Start aplikace
window.onload = loadData;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => { console.log('SW úspěšně zaregistrován'); })
            .catch(error => { console.log('SW chyba:', error); });
    });
}
