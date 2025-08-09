import { MovieAPI } from "./main.js";
let searchInput = null; // Save Search value from input
let searchResults = []; // Store search results globally
let moviesPerPage = Infinity; // Default to show all movies
let currentPage = 1; // Track the current page

document.addEventListener("DOMContentLoaded", () => {
    searchInput = document.getElementById("search-movie");
    const isReturningHome = localStorage.getItem("isReturningHome");

    if (isReturningHome === "true") {
        const lastSearch = localStorage.getItem("lastSearch");
        if (lastSearch) {
            searchInput.value = lastSearch;
            searchFunc();
        }
        localStorage.removeItem("isReturningHome");
    } else {
        searchInput.value = "";
    }

    searchInput.addEventListener("input", (e) => {
        localStorage.setItem("lastSearch", e.target.value);
        searchFunc();
    });

    setupDropdown(); // Initialize dropdown functionality
});

// Initialize dropdown for selecting movies per page
function setupDropdown() {
    const dropdownItems = document.querySelectorAll("#sort-list .dropdown-item");

    // Set the default active state to "All"
    dropdownItems.forEach(item => {
        item.classList.remove("active");
        if (item.id === "page-all") {
            item.classList.add("active");
        }
    });

    dropdownItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();

            // Remove active class from all items
            dropdownItems.forEach(i => i.classList.remove("active"));

            // Add active class to the selected item
            item.classList.add("active");

            const value = item.id.split('-')[1];
            moviesPerPage = value === "all" ? Infinity : parseInt(value, 10);
            currentPage = 1; // Reset to the first page
            updateDropdownText(item.textContent); // Update dropdown text
            updateMoviesAndPagination();
        });
    });
}

// Update dropdown button text
function updateDropdownText(text) {
    const dropdownButton = document.getElementById("sort-button");
    dropdownButton.textContent = `Movies per page: ${text}`;
}

// Perform search and update movies and pagination
function searchFunc() {
    let containerMoviesDiv = document.getElementById("movies-container");
    let query = searchInput.value;
    const headerSearch = document.getElementById("title-page");
    const titleSearch = document.getElementById("titleSearch");
    const pagesNav = document.getElementById("pages-nav");

    localStorage.setItem("lastSearchQuery", query); // Save Search query in LocalStorage

    if (query.length > 3) {
        containerMoviesDiv.innerHTML = "";
        try {
            MovieAPI.fetchMovies(query).then(movies => {
                searchResults = movies; // Save search results globally
                currentPage = 1; // Reset to the first page
                updateMoviesAndPagination();
                headerSearch.classList.remove("d-none");
                pagesNav.classList.remove("d-none");
                titleSearch.innerText = query;
            });
        } catch (error) {
            console.error("Error loading movies: ", error);
        }
    } else {
        containerMoviesDiv.innerHTML = "";
        headerSearch.classList.add("d-none");
        pagesNav.classList.add("d-none");
    }
}

// Update movies and pagination
function updateMoviesAndPagination() {
    const totalMovies = searchResults.length;
    const totalPages = Math.ceil(totalMovies / moviesPerPage);
    const start = (currentPage - 1) * moviesPerPage;
    const end = currentPage * moviesPerPage;

    renderMovies(searchResults.slice(start, end)); // Render movies for the current page
    renderPagination(totalPages); // Render pagination
}

// Render movies in the container
function renderMovies(movies) {
    const containerMoviesDiv = document.getElementById("movies-container");
    containerMoviesDiv.innerHTML = ""; // Clear previous results
    RenderMoviesCard(movies, containerMoviesDiv);
}

function renderPagination(totalPages) {
    const pagesNav = document.getElementById("pages-nav");
    const paginationList = pagesNav.querySelector(".pagination");
    paginationList.innerHTML = ""; // Clear previous pagination

    // Show the pagination nav even if there is only 1 page
    pagesNav.classList.remove("d-none");

    // Previous button
    const prevItem = document.createElement("li");
    prevItem.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevItem.innerHTML = `
        <a class="page-link" href="#" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
        </a>`;
    prevItem.addEventListener("click", (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            updateMoviesAndPagination();
        }
    });
    paginationList.appendChild(prevItem);

    // Page numbers (always show at least one page)
    if (totalPages === 0) {
        totalPages = 1; // Ensure there is at least one page to display
    }

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement("li");
        pageItem.className = `page-item ${currentPage === i ? "active" : ""}`;
        pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageItem.addEventListener("click", (e) => {
            e.preventDefault();
            currentPage = i;
            updateMoviesAndPagination();
        });
        paginationList.appendChild(pageItem);
    }

    // Next button
    const nextItem = document.createElement("li");
    nextItem.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    nextItem.innerHTML = `
        <a class="page-link" href="#" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
        </a>`;
    nextItem.addEventListener("click", (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            updateMoviesAndPagination();
        }
    });
    paginationList.appendChild(nextItem);

    // Hide pagination if no results
    if (totalPages <= 1 && searchResults.length === 0) {
        pagesNav.classList.add("d-none");
    }
}

// Update Cards in index page
function RenderMoviesCard(movies, container) {
    movies.forEach(movie => {
        const card = `
        <div class="col-md-3 mb-4">
            <div class="card h-100 movie_card">
                <div class="ratio ratio-1x1">
                    <img src="${movie.poster}" class="card-img-top img-fluid object-fit-cover" alt="${movie.title}">
                </div>
                <div class="card-body flex-grow-1">
                    <h5 class="text-white">${movie.title}</h5>
                    <p class="card-text fs-6">
                        <strong>Release Date:</strong> ${movie.year}
                    </p>
                </div>
                <div class="card-footer bg-transparent border-0">
                    <a href="details/${movie.imdbid}" class="btn btn-primary w-100">Details</a>
                </div>
            </div>
        </div>
        `; 
        container.insertAdjacentHTML('beforeend', card);
    });
}