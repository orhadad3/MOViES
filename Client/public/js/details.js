import { generateFormattedDate, generateStars, setupPagination, showAlert, truncateText, validURL, createConfirmationModal } from "./utils.js";
import { MovieAPI } from "./main.js";
let imdbId;

document.addEventListener("DOMContentLoaded", async () => {
    // Cache DOM elements for better performance
    const spinner = document.getElementById("spinner");
    const addFavoriteBtn = document.getElementById("favorite");
    const delFavoriteBtn = document.getElementById("del_favorite");
    const detailsContainer = document.getElementById("details-container");
    const displayFade = document.getElementById("displayFade");

    // Extract movie ID from URL path
    const pathParts = window.location.pathname.split('/');
    imdbId = pathParts[pathParts.length - 1];

    /**
     * Checks if a movie is in user favorites
     * @param {string} movieId - The IMDB ID of the movie
     * @returns {Promise<boolean>} Whether the movie is in favorites
    */
    async function checkMovieFavorite(movieId) {
        try {
            const response = await fetch(`/details/check-movie/${movieId}`);

            if (!response.ok) {
                console.error("Failed to fetch movie.");
            }

            const data = await response.json();

            return data.isFavorite;
        } catch (error) {
            console.error("Error checking favorite status: ", error.message);
            return false; 
        }
    }

    /**
     * Removes a movie from user favorites
     * @param {string} movieId - The IMDB ID of the movie to remove
     * @returns {Promise<void>}
    */
    async function deleteMovieFavorite(movieId) {
        try {
            const response = await fetch(`/favorites/remove/${movieId}`, { method: "DELETE" });

            const result = await response.json();

            if (!response.ok) {
                console.error("Failed to delete movie.");
            }
        } catch (error) {
            console.error("Error deleting favorite: ", error.message);
            throw error;
        }
    }

    try {
        spinner.classList.remove("d-none");

        // Fetch movie details
        const movieData = await MovieAPI.fetchMoviesDetails(imdbId);
        
        // Fetch trailer and favorite status in parallel
        const [trailer, isFavorite] = await Promise.all([
            MovieAPI.fetchYouTubeTrailer(movieData.title),
            checkMovieFavorite(imdbId)
        ]);

        document.title = "MOViES - " + movieData.title;
        displayMovieDetails(movieData, detailsContainer, trailer);

        // Check favorite status and update UI
        if (isFavorite) {
            const linksTab = document.getElementById("Links-tab");
            linksTab.classList.remove("d-none");
            linksTab.addEventListener("click", async () => {
                await renderLinks(imdbId);
            });
            addFavoriteBtn.classList.add("d-none");
            delFavoriteBtn.classList.remove("d-none");
        } else {
            addFavoriteBtn.classList.remove("d-none");
            delFavoriteBtn.classList.add("d-none");
        }

        // Add to Favorites handler
        addFavoriteBtn.addEventListener("click", async () => {
            try {
                const response = await fetch('/favorites/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ movie: movieData }),
                });

                const result = await response.json();

                // Update UI elements
                if (result.success) {
                    showAlert(`<i class="bi bi-plus-square"></i> <strong class="text-break">${movieData.title}</strong> has been added to your favorites.`);
                    addFavoriteBtn.classList.add("d-none");
                    delFavoriteBtn.classList.remove("d-none");

                    const linksTab = document.getElementById("Links-tab");
                    linksTab?.classList.remove("d-none");
                    linksTab?.addEventListener("click", () => renderLinks(imdbId));
                } else {
                    throw new Error(result.error || 'Failed to add favorite');
                }
            } catch (error) {
                console.error('Error adding favorite: ', error);
                showAlert('Error adding movie to favorites.');
            }
        });

        // Delete from Favorites handler
        delFavoriteBtn.addEventListener("click", () => {
            createConfirmationModal({
                title: "Remove Favorite",
                body: `Are you sure you want to remove <strong>${movieData.title}</strong> from your favorites?`,
                confirmButtonText: "Yes, Remove",
                onConfirm: async () => {
                    try {
                        await deleteMovieFavorite(imdbId);
                        showAlert(`<i class="bi bi-trash"></i> <strong class="text-break">${movieData.title}</strong> has been removed from your favorites.`);
                        
                        // Update UI elements
                        delFavoriteBtn.classList.add("d-none");
                        addFavoriteBtn.classList.remove("d-none");
    
                        // Handle Links tab visibility and state
                        const linksTab = document.getElementById("Links-tab");
                        linksTab.classList.add("d-none");
    
                        // Switch to Prob tab if currently on Links tab
                        if (linksTab?.classList.contains("active")) {
                            switchToProbTab();
                        }
                    } catch (error) {
                        console.error('Error deleting favorite: ', error);
                        showAlert('Error removing movie from favorites.');
                    }
                },
            });
        });
    } catch (error) {
        console.error("Error loading movie details: ", error);
        detailsContainer.innerHTML = "<p class='text-danger text-center'>Error loading details.</p>";
    } finally {
        spinner.classList.add("d-none");
        displayFade.classList.add("show");
    }
});

/**
 * Switches active tab to Prob tab
*/
function switchToProbTab() {
    const probTab = document.getElementById("prob-tab");
    const probContent = document.getElementById("prob");
    const linksContent = document.getElementById("links");

    probTab?.classList.add("active");
    probContent?.classList.add("show", "active");
    linksContent?.classList.remove("show", "active");
}

// Return Home button
document.getElementById("return").addEventListener("click", () => {
    localStorage.setItem("isReturningHome", "true");
    window.location.href = "/";
});

// Add details to page
function displayMovieDetails(movie, container, youtubeTrailer) {
    const details = `
    <div class="row">
        <div class="col-md-3 text-center mb-4">
            <img src="${movie.poster}" alt="${movie.title}" class="img-thumbnail">
        </div>

        <div class="col-md-9">
            <h1 class="fw-bold">${movie.title}</h1>
            <p><strong>Release Data:</strong> ${movie.releaseData}</p>
            <p><strong>Genre:</strong> ${movie.genre}</p>
            <p><strong>Director:</strong> ${movie.director}</p>
            <p><strong>Actors:</strong> ${movie.actors}</p>
            <p><strong>Rating:</strong> ${movie.rating}</p>
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <ul class="nav nav-tabs card-header-tabs">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="prob-tab" data-bs-toggle="tab" data-bs-target="#prob" type="button" role="tab" aria-controls="prob" aria-selected="true">Prob</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="trailer-tab" data-bs-toggle="tab" data-bs-target="#trailer" type="button" role="tab" aria-controls="trailer" aria-selected="false">Trailer</button>
                </li>
                <li class="nav-item" role="presentation">
                    <a class="nav-link" href="https://imdb.com/title/${movie.imdbid}" target="_blank">IMDB</a>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link d-none" id="Links-tab" data-bs-toggle="tab" data-bs-target="#links" type="button" role="tab" aria-controls="links" aria-selected="false">Links</button>
                </li>
            </ul>
        </div>
        <div class="card-body tab-content" id="myTabContent">
            <div class="tab-pane fade show active" id="prob" role="tabpanel" aria-labelledby="prob-tab">
                <p class="card-text">
                    ${movie.plot}
                </p>
            </div>
            <div class="tab-pane fade" id="trailer" role="tabpanel" aria-labelledby="trailer-tab">
                ${youtubeTrailer ? `
                    <div class="ratio ratio-21x9">
                        <iframe src="https://www.youtube.com/embed/${youtubeTrailer.id}" title="${youtubeTrailer.videoTitle}" allowfullscreen></iframe>
                    </div>
                    ` : `<p class="text-muted m-0">Trailer not available at this time.</p>`
        }
            </div>
            <div class="tab-pane fade" id="links" role="tabpanel" aria-labelledby="links-tab"></div>
        </div>
    </div>
    `;

    container.insertAdjacentHTML('beforeend', details);
}

async function renderLinks(imdbId) {
    const linksContainer = document.getElementById("links");
    linksContainer.innerHTML = `
        <div class="mb-3">
            <button class="btn btn-success" id="addLinkBtn">Add Link</button>
        </div>

        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Link</th>
                    <th>Description</th>
                    <th class="text-center">Added by</th>
                    <th class="text-center" role="button" id="ratingSort">Rating <span id="sortIcon"><i class="bi bi-funnel"></i></span></th>
                    <th class="text-center">Actions</th>
                </tr>
            </thead>
            <tbody id="linksTableBody"></tbody>
        </table>

        <div id="paginationContainer" class="pagination-container text-center mt-3"></div>
    `;

    const tableBody = document.getElementById("linksTableBody");

    try {
        // Fetch the links for this movie.
        const response = await fetch(`/links/${imdbId}`);
        const data = await response.json();
        const links = data.links || [];

        // Create an array to hold row elements.
        const rowElements = [];

        // Attach listener to the Add Link button.
        const addLinkBtn = document.getElementById("addLinkBtn");
        const newAddLinkBtn = addLinkBtn.cloneNode(true);
        addLinkBtn.parentNode.replaceChild(newAddLinkBtn, addLinkBtn);
        newAddLinkBtn.addEventListener("click", async () => {
            await openLinkModal(imdbId);
        });

        if (links.length === 0) {
            linksTableBody.innerHTML = `
                <tr>
                    <td class="text-center text-dark-emphasis" colspan="6">
                        No links available yet.
                    </td>
                </tr>
            `;
            return;
        }

        // For each link, create a table row (<tr>) with the data.
        links.forEach(link => {
            const privacyIcon = data.username === link.user ? (link.isPublic? `<i class="bi bi-unlock" data-bs-toggle="tooltip" data-bs-title="Public"></i>` : `<i class="bi bi-lock" data-bs-toggle="tooltip" data-bs-title="Private"></i>`) : '';
            const tr = document.createElement("tr");
            // Update the rating column with the link.rating (if available) or "N/A"
            tr.innerHTML = `
                <td class="text-break">${privacyIcon} ${truncateText(link.name, 35)}</td>
                <td class="text-break"><a href="${link.url}" target="_blank">${link.url}</a></td>
                <td class="text-break">${truncateText(link.description, 45)}</td>
                <td class="text-break text-center">${link.user}</td>
                <td class="text-break text-center col-1">${link.avgRating != null ? link.avgRating.toFixed(1) : "N/A"}</td>
                <td class="text-break text-center col-1">
                ${data.username === link.user ? `
                    <a href="#" class="edit-link-btn link-light me-2 text-decoration-none" data-id="${data.useMongoDB ? link._id : link.id}" data-bs-toggle="tooltip" data-bs-title="Edit">
                        <i class="bi bi-pencil-square fs-5"></i>
                    </a>
                    <a href="#" class="delete-link-btn link-danger me-2 text-decoration-none" data-id="${data.useMongoDB ? link._id : link.id}" data-bs-toggle="tooltip" data-bs-title="Delete">
                        <i class="bi bi-trash fs-5"></i>
                    </a>
                ` : ``}
                    <a href="#" class="review-link-btn link-warning text-decoration-none" data-id="${data.useMongoDB ? link._id : link.id}" data-bs-toggle="tooltip" data-bs-title="Reviews">
                        <i class="bi bi-star fs-5"></i>
                    </a>
                </td>
            `;

            // Attach event listener for the Edit button if present.
            const editBtn = tr.querySelector(".edit-link-btn");
            if (editBtn) {
                editBtn.addEventListener("click", async (e) => {
                    e.preventDefault();
                    const linkId = e.target.closest('.edit-link-btn').dataset.id;
                    await openLinkModal(imdbId, linkId);
                });
            }
            // Attach event listener for the Delete button if present.
            const deleteBtn = tr.querySelector(".delete-link-btn");
            if (deleteBtn) {
                deleteBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    const linkId = e.target.closest('.delete-link-btn').dataset.id;
                    confirmDeleteLink(imdbId, linkId);
                });
            }
            // Attach event listener for the Review button.
            const reviewBtn = tr.querySelector(".review-link-btn");
            if (reviewBtn) {
                reviewBtn.addEventListener("click", async (e) => {
                    e.preventDefault();
                    const linkId = e.target.closest('.review-link-btn').dataset.id;
                    await openReviewModal(linkId);
                });
            }

            // Add the row to the array.
            rowElements.push(tr);
        });

        // Use the setupPagination function to render rows into the table body.
        const paginationContainer = document.getElementById("paginationContainer");
        setupPagination(rowElements, tableBody, 5, paginationContainer);

        // (Re-)Initialize tooltips for any new elements.
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        [...tooltipTriggerList].forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

        // Sorting by Rating
        let ascending = true;
        const ratingSort = document.getElementById("ratingSort");
        const sortIcon = document.getElementById("sortIcon");

        ratingSort.addEventListener("click", () => {
            if (!rowElements.length) return;

            rowElements.sort((rowA, rowB) => {
                const ratingA = parseFloat(rowA.cells[4].innerText) || 0;
                const ratingB = parseFloat(rowB.cells[4].innerText) || 0;

                return ascending ? ratingA - ratingB : ratingB - ratingA;
            });

            ascending = !ascending;

            sortIcon.innerHTML = ascending ? '<i class="bi bi-sort-up"></i>' : '<i class="bi bi-sort-down"></i>';

            setupPagination(rowElements, document.getElementById("linksTableBody"), 5, document.getElementById("paginationContainer"));
        });
    } catch (error) {
        console.error("Error loading links: ", error);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Failed to load links.</td></tr>`;
    }
}

async function openLinkModal(imdbId, linkId = null) {
    // Clean up any existing modals first
    document.querySelectorAll(".modal").forEach(modal => modal.remove());

    // Initialize default link data
    let link = {
        name: "",
        linkProtocol: "https://", 
        url: "", 
        description: "", 
        isPublic: false
    };

    // If editing existing link, fetch its data
    if (linkId) {
        try {
            const response = await fetch(`/links/get-link/${linkId}`);
            const linkData = await response.json();

            if (!response.ok) {
                console.error("Error fetching link data:", linkData.message);
                showAlert('<i class="bi bi-exclamation-circle"></i> Failed to load link data.');
                return;
            }

            link = linkData || link;

            if (!link) {
                console.error("Error: Link not found.");
                showAlert('<i class="bi bi-exclamation-circle"></i> Link not found.');
                return;
            }
        } catch (error) {
            console.error("Error fetching link data: ", error.message);
        }
    }

    // Safely get URL without protocol for the input field
    const urlWithoutProtocol = link.url ? link.url.replace(/^https?:\/\//, '') : '';

    const modalHTML = `
        <div class="modal fade" id="linkModal-${linkId || "new"}" tabindex="-1" aria-labelledby="linkModalLabel-${linkId || "new"}" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="linkModalLabel-${linkId || "new"}">${linkId ? "Edit Link" : "Add Link"}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="linkName-${linkId || "new"}" class="form-label">Name</label>
                            <input type="text" class="form-control" id="linkName-${linkId || "new"}" value="${link.name}">
                        </div>
                        <label for="linkUrl-${linkId || "new"}" class="form-label">URL</label>
                        <div class="input-group mb-3">
                            <select class="form-select w-25" id="linkProtocol-${linkId || "new"}">
                                <option value="https://" ${link.url.startsWith("https://")? "selected" : ""}>https://</option>
                                <option value="http://" ${link.url.startsWith("http://")? "selected" : ""}>http://</option>
                            </select>
                            <input type="text" class="form-control w-75" id="linkUrl-${linkId || "new"}" value="${urlWithoutProtocol}">
                        </div>
                        <div class="mb-3">
                            <label for="linkDescription-${linkId || "new"}" class="form-label">Description</label>
                            <textarea class="form-control" id="linkDescription-${linkId || "new"}">${link.description}</textarea>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="publicLink-${linkId || "new"}" ${link.isPublic ? "checked" : ""}>
                            <label class="form-check-label" for="publicLink-${linkId || "new"}">
                                Public Link
                            </label>
                        </div>
                        <div class="text-danger text-center d-none" id="linkError-${linkId || "new"}"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="saveLinkBtn-${linkId || "new"}">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal to DOM and show it
    const modalContainer = document.createElement("div");
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    const linkModal = new bootstrap.Modal(document.getElementById(`linkModal-${linkId || "new"}`));
    linkModal.show();

    // Handle save button click
    document.getElementById(`saveLinkBtn-${linkId || "new"}`).addEventListener("click", async () => {
        const modal = document.getElementById(`linkModal-${linkId || "new"}`);
        const name = modal.querySelector(`#linkName-${linkId || "new"}`).value.trim();
        const linkProtocol = modal.querySelector(`#linkProtocol-${linkId || "new"}`).value;
        const url = modal.querySelector(`#linkUrl-${linkId || "new"}`).value.trim();
        const description = modal.querySelector(`#linkDescription-${linkId || "new"}`).value.trim();
        const isPublic = modal.querySelector(`#publicLink-${linkId || "new"}`).checked;
        const errorElement = modal.querySelector(`#linkError-${linkId || "new"}`);

        // // Validate inputs
        if (!name || !url || !description) {
            errorElement.textContent = "All fields are required!";
            errorElement.classList.remove("d-none");
            return;
        }

        // Validate URL format
        const checkUrl = validURL(linkProtocol + url);
        if (!checkUrl) {
            errorElement.textContent = "Please enter a valid URL";
            errorElement.classList.remove("d-none");
            return;
        }

        errorElement.classList.add("d-none");

        // Prepare updated link data
        const updatedLink = {
            name, 
            description, 
            url: linkProtocol + url, 
            isPublic 
        };

        // Save the link and update UI
        try {
            // Remove focus before hiding
            const focusedElement = modal.querySelector(':focus');
            if (focusedElement) {
                focusedElement.blur();
            }

            await updateOrAddLink(imdbId, updatedLink, linkId);
            linkModal.hide();
            await renderLinks(imdbId);
        } catch (error) {
            errorElement.textContent = "Failed to save link. Please try again.";
            errorElement.classList.remove("d-none");
        }
    });
}

async function openReviewModal(linkId) {
    closeAllModals();

    try {
        // Create modal container
        const modalHTML = `
            <div class="modal fade" id="reviewModal" tabindex="-1" aria-labelledby="reviewModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="reviewModalLabel">Reviews</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-5 border-end review-form-container"></div>
                                <div class="col-md-7">
                                    <div class="review-list-container"></div>
                                    <div class="pagination-container text-center mt-3"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Create temporary div and set its HTML
        const modalContainer = document.createElement("div");
        modalContainer.innerHTML = modalHTML;

        // Get the actual modal element
        const modalElement = modalContainer.firstElementChild;

        // Add modal to body
        document.body.appendChild(modalElement);

        // Get reference to containers after modal is in DOM
        const reviewTitleElement = modalElement.querySelector("#reviewModalLabel");
        const reviewListContainer = modalElement.querySelector(".review-list-container");
        const reviewFormContainer = modalElement.querySelector(".review-form-container");
        const paginationContainer = modalElement.querySelector(".pagination-container");

        // Fetch link data
        const linkResponse = await fetch(`/links/get-link/${linkId}`);
        const linkData = await linkResponse.json();
        const linkName = linkData.name || "Link";

        // Set modal title
        reviewTitleElement.textContent = `Reviews for "${linkName}"`;

        // Fetch reviews
        const response = await fetch(`/reviews/${linkId}`);
        const data = await response.json();
        const reviews = Array.isArray(data.reviews) ? data.reviews : [];
        const currentUser = data.username;

        // Handle empty reviews
        if (reviews.length === 0) {
            reviewListContainer.innerHTML = `<p class="text-center text-muted">No reviews yet. Be the first to add one!</p>`;
        }

        const userReview = reviews.find(review => review.username === currentUser);

        // Setup review form or show existing review
        if (userReview) {
            reviewFormContainer.innerHTML = `
                <p class="text-muted text-center">You have already submitted a review.</p>
                <button class="btn btn-danger w-100 mt-2" id="deleteReviewBtn">Delete Review</button>
            `;

            const reviewId = data.useMongoDB ? userReview._id : userReview.id;
            const deleteBtn = modalElement.querySelector("#deleteReviewBtn");
            
            if (deleteBtn) {
                deleteBtn.addEventListener("click", () => deleteReview(reviewId, linkId));
            }
        } else {
            reviewFormContainer.innerHTML = `
                <div class="rating">
                    <input type="radio" name="rating" value="5" id="star5"><label for="star5"><i class="bi bi-star text-warning"></i></label>
                    <input type="radio" name="rating" value="4" id="star4"><label for="star4"><i class="bi bi-star text-warning"></i></label>
                    <input type="radio" name="rating" value="3" id="star3"><label for="star3"><i class="bi bi-star text-warning"></i></label>
                    <input type="radio" name="rating" value="2" id="star2"><label for="star2"><i class="bi bi-star text-warning"></i></label>
                    <input type="radio" name="rating" value="1" id="star1"><label for="star1"><i class="bi bi-star text-warning"></i></label>
                </div>
                <label class="form-label">Comment:</label>
                <textarea class="form-control mb-3" id="comment" rows="3" placeholder="Write your review..."></textarea>
                <button class="btn btn-success" id="submitReviewBtn">Send Review</button>
            `;

            const submitBtn = modalElement.querySelector("#submitReviewBtn");
            if (submitBtn) {
                submitBtn.addEventListener("click", () => submitReview(linkId));
            }
        }

        // Create and append review elements
        const reviewElements = reviews.map(review => {
            const div = document.createElement("div");
            const ownerReview = review.username === currentUser;
            div.innerHTML = `
                <div class="review${ownerReview ? " user-review" : ""}">
                    <div class="row justify-content-between">
                        <div class="col-8">
                            <strong>${review.username}</strong><br />
                            <span class="text-secondary-emphasis small">
                                ${generateFormattedDate(review.createdAt)}
                            </span>
                        </div>
                        <div class="col text-end text-warning">
                            ${generateStars(review.rating)}
                        </div>
                    </div>
                    <p class="text-break">${review.comment || "No comment provided."}</p>
                </div>
                <hr />
            `;
            return div;
        });

        // Setup pagination for reviews
        setupPagination(reviewElements, reviewListContainer, 6, paginationContainer);

        // Initialize and show the modal
        const reviewModal = new bootstrap.Modal(modalElement);
        reviewModal.show();
    } catch (error) {
        console.error("Error loading reviews:", error.message);
        showAlert(`<i class="bi bi-exclamation-circle"></i> Error loading reviews`);
    }
}

async function submitReview(linkId) {
    // Get the selected rating and comment
    const ratingElement = document.querySelector('input[name="rating"]:checked');
    const rating = ratingElement ? ratingElement.value : null;
    const commentElement = document.getElementById("comment");
    const comment = commentElement ? commentElement.value.trim() : null;

    // Create or get error message element
    let ratingError = document.getElementById("rating-error");
    if (!ratingError) {
        ratingError = document.createElement("span");
        ratingError.id = "rating-error";
        ratingError.classList.add("text-danger", "d-block", "mt-1");
        document.querySelector(".rating").after(ratingError);
    }

    // Validate rating
    if (!rating) {
        ratingError.innerText = "Please select a rating.";
        return;
    }
    ratingError.innerText = "";

    try {
        // Submit review to server
        const response = await fetch("/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ linkId, rating, comment })
        });

        if (response.ok) {
            // If successful, update UI and show success message
            await renderLinks(imdbId);
            closeAllModals();
            showAlert(`<i class="bi bi-check-circle"></i> Review submitted successfully.`);
            await openReviewModal(linkId);
        } else {
            // Handle server validation errors
            const error = await response.json();
            ratingError.innerText = error.message;
        }
    } catch (error) {
        console.error("Error submitting review:", error.message);
    }
}

async function deleteReview(reviewId, linkId) {
    try {
        // Send delete request to server
        const response = await fetch(`/reviews/delete-review/${reviewId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            const errorData = await response.json();
            showAlert(`<i class="bi bi-exclamation-circle"></i> ${errorData.message}`, "danger");
            return;
        }

        // If successful, update UI and show success message
        showAlert(`<i class="bi bi-trash"></i> Your review has been deleted.`);
        await renderLinks(imdbId);
        await openReviewModal(linkId);
    } catch (error) {
        console.error("Error deleting review: ", error.message);
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modalEl => {
        if (modalEl.contains(document.activeElement)) {
            document.activeElement.blur();
            document.body.focus();
        }

        // Get the Bootstrap modal instance
        let bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) {
            bsModal.hide(); // Let Bootstrap handle the hide transition
            // Once the modal is fully hidden, remove it from the DOM
            modalEl.addEventListener('hidden.bs.modal', () => {
                modalEl.remove();
            }, { once: true });
        } else {
            // If no Bootstrap instance is present, remove the element directly.
            modalEl.remove();
        }
    });
}

async function updateOrAddLink(imdbId, updatedLink, linkId = null) {
    try {
        const response = await fetch(`/links/${imdbId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ linkId, updatedLink })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Failed to update or add link.");
        } else {
            showAlert(`<i class="bi bi-check-circle"></i> Link ${linkId ? "updated" : "added"} successfully.`);
            await renderLinks(imdbId);
        }
    } catch (error) {
        console.error("Error updating or adding link:", error.message);
    }
}

async function confirmDeleteLink(imdbId, linkId) {
    if (!linkId) {
        console.error("Error: linkId is undefined.");
        return;
    }

    createConfirmationModal({
        title: "Delete Link",
        body: `Are you sure you want to delete this link?`,
        confirmButtonText: "Delete",
        onConfirm: async () => {
            try {
                const response = await fetch(`/links/${linkId}`, { method: "DELETE" });

                if (!response.ok) throw new Error("Failed to delete the link.");

                showAlert(`<i class="bi bi-trash"></i> Link has been removed.`);
                await renderLinks(imdbId);
            } catch (error) {
                console.error("Error deleting link:", error.message);
            }
        },
    });
}