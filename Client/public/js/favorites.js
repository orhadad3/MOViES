import { setupPagination } from "./utils.js";
import { MovieAPI } from "./main.js";

document.addEventListener("DOMContentLoaded", async () => {
    const moviesContainer = document.getElementById("movies-container");
    const sortButton = document.getElementById("sort-button");
    const sortList = document.getElementById("sort-list");
    const sortItems = document.querySelectorAll(".dropdown-item");
    const spinner = document.getElementById("spinner");

    async function getFavorites() {
        try {
            spinner.classList.remove("d-none"); // Show spinner
            const response = await fetch('/favorites/get-all'); // Fetch favorites from the server
            if (!response.ok) {
                throw new Error('Failed to fetch favorites');
            }
            return await response.json(); // Return the list of favorite movies
        } catch (error) {
            console.error('Error fetching favorites:', error.message);
            return [];
        } finally {
            spinner.classList.add("d-none"); // Hide spinner
        }
    }

    // Fetch details for all movies and map them
    async function fetchMoviesDetails(movies) {
        spinner.classList.remove("d-none"); // Show spinner
        const detailedMovies = [];
        try {
            for (const movie of movies) {
                const detailedMovie = await MovieAPI.fetchMoviesDetails(movie.imdbid);
                detailedMovies.push(detailedMovie);
            }
            return detailedMovies;
        } catch (error) {
            console.error('Error fetching movie details:', error);
            return [];
        } finally {
            spinner.classList.add("d-none"); // Hide spinner
        }
    }

    localStorage.removeItem("lastSearch"); // Remove last Search from LocalStorage

    const favorites = await getFavorites();

    if (favorites.length === 0) {
        moviesContainer.innerHTML = "<p class='text-center'>No favorite movies added</p>";
        return;
    }

    const detailedFavorites = await fetchMoviesDetails(favorites);
    let defaultMovies = detailedFavorites.slice();

    function renderMovies(movies) {
        return movies.map(movie => {
            const card = document.createElement("div");
            card.className = "col-md-3 mb-4";
            card.innerHTML = `
                <div class="card h-100 movie_card">
                    <div class="ratio ratio-1x1">
                        <img src="${movie.poster}" class="card-img-top img-fluid object-fit-cover" alt="${movie.title}">
                    </div>
                    <div class="card-body flex-grow-1">
                        <h5 class="text-white">${movie.title}</h5>
                        <p class="card-text fs-6">
                            <strong>Release Date:</strong> ${movie.releaseData}<br>
                            <strong>Rating:</strong> ${movie.rating}<br>
                        </p>
                    </div>
                    <div class="card-footer bg-transparent border-0">
                        <a href="details/${movie.imdbid}" class="btn btn-primary w-100">Details</a>
                    </div>
                </div>
            `;
            return card;
        });
    }

    const paginationContainer = document.getElementById("pagination-container");

    async function displayMovies(movies) {
        const movieElements = renderMovies(movies);
        setupPagination(movieElements, moviesContainer, 8, paginationContainer);
    }

    displayMovies(detailedFavorites);

    function sortByTitle(movies) {
        return movies.sort((a, b) => a.title.localeCompare(b.title));
    }

    function sortByReleaseDate(movies) {
        return movies.sort((a, b) => new Date(b.releaseData) - new Date(a.releaseData));
    }

    function sortByRating(movies) {
        return movies.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    }

    function setActive(sortType) {
        sortItems.forEach(item => {
            if (item.id === sortType) {
                item.classList.add("active");
                item.setAttribute("aria-current", "true");
            } else {
                item.classList.remove("active");
                item.removeAttribute("aria-current");
            }
        });
    }

    sortList.addEventListener("click", (e) => {
        const sortType = e.target.id;
        let sortedMovies = defaultMovies.slice();
    
        switch (sortType) {
            case "sort-title":
                sortedMovies = sortByTitle(detailedFavorites.slice());
                sortButton.textContent = "Sorted by: Title";
                break;
            case "sort-date":
                sortedMovies = sortByReleaseDate(detailedFavorites.slice());
                sortButton.textContent = "Sorted by: Release Date";
                break;
            case "sort-rating":
                sortedMovies = sortByRating(detailedFavorites.slice());
                sortButton.textContent = "Sorted by: Rating";
                break;
            case "sort-default":
            default:
                sortedMovies = defaultMovies.slice();
                sortButton.textContent = "Sorted by: Default";
                break;
        }
    
        setActive(sortType);
        displayMovies(sortedMovies);
    });

    setActive("sort-default");
});
