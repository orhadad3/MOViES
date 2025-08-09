import { generateFormattedDate, setupPagination, generateStars } from "./utils.js";
import { MovieAPI } from "./main.js";

document.addEventListener("DOMContentLoaded", async () => {
    const spinner = document.getElementById("spinner");
    const container = document.getElementById("top-links");
    let paginationContainer = document.getElementById("pagination");

    if (!paginationContainer) {
        paginationContainer = document.createElement("div");
        paginationContainer.id = "pagination";
        paginationContainer.classList.add("text-center", "mt-3");
        container.after(paginationContainer);
    }

    try {
        spinner.classList.remove("d-none");

        const response = await fetch("/top-links/data");
        if (!response.ok) throw new Error("Failed to fetch top links");
        
        const links = await response.json();

        await Promise.all(links.map(async (link) => {
            const movieDetails = await MovieAPI.fetchMoviesDetails(link.movieId);
            link.poster = movieDetails.poster;
            link.movieName = movieDetails.title;
        }));

        if (links.length === 0) {
            container.innerHTML = `
                <p class='text-center'>There are no public links at this time...</p>
            `;
            return;
        }

        links.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));

        container.innerHTML = "";

        const movieCards = links.map(link => {
            const movieCard =  document.createElement("div");
            movieCard.classList.add("col-md-6", "mb-4");

            movieCard.innerHTML = `
                <div class="col">
                    <div class="card mb-3 shadow-sm border-0 border-bottom ps-1">
                        <div class="row g-0">
                            <div class="col-md-4 d-flex align-items-center justify-content-center" style="max-width: 100px;">
                                <img src="${link.poster}" class="img-fluid rounded" alt="${link.movieName}">
                            </div>
                
                            <div class="col">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <h5 class="card-title mb-1">${truncateTitle(link.movieName, 22)}</h5>
                                        <div class="text-warning">
                                            ${generateStars(link.avgRating)}
                                        </div>
                                    </div>
                
                                    <p class="mb-2">
                                        <span class="fw-semibold">Link Name:</span> ${truncateTitle(link.name, 25)}<br>
                                        <span class="fw-semibold">Added By:</span> ${link.user}
                                    </p>
                
                                    <div class="d-flex gap-2">
                                        <a href="${link.url}" class="btn btn-primary btn-sm flex-grow-1">
                                            <i class="bi bi-box-arrow-up-right"></i> Visit Link
                                        </a>
                                        <a href="details/${link.movieId}" class="btn btn-outline-secondary btn-sm flex-grow-1">
                                            <i class="bi bi-info-square"></i> More info
                                        </a>
                                    </div>
                                    <p class="card-text mt-2"><small class="text-muted">Added on ${generateFormattedDate(link.addedDate)}</small></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            return movieCard;
        });

        setupPagination(movieCards, container, 6, paginationContainer);

        spinner.classList.remove("d-none");
    } catch (error) {
        console.error("Error loading top links:", error);
    } finally {
        spinner.classList.add("d-none");
    }
});

function truncateTitle(title, maxLength = 20) {
    return title.length > maxLength ? title.substring(0, maxLength) + "..." : title;
}
