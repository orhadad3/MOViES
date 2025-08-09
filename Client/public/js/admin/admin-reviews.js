import { generateFormattedDate, showAlert, setupPagination, showModal, truncateText, fetchConfig } from "../utils.js";
import { MovieAPI } from "../main.js";

document.addEventListener("DOMContentLoaded", async () => {
    const reviewsTableBody = document.getElementById("reviewTableBody");
    const searchInput = document.getElementById("searchReview");
    const reviewsManage = document.getElementById("reviewManage");
    const spinner = document.getElementById("spinner");
    const paginationContainer = document.createElement("div");

    reviewsManage.after(paginationContainer);

    let allReviews = [];

    async function loadReviews() {
        try {
            const response = await fetch("/admin/reviews/getReviews");

            if (!response.ok) {
                console.error("Failed to fetch reviews");
                return;
            }

            allReviews = await response.json();

            if (allReviews.length === 0) {
                reviewsTableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">
                            No reviews available...
                        </td>
                    </tr>
                `;
                return;
            }

            await renderReviews(allReviews);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            showAlert("Error fetching reviews");
        } finally {
            spinner.classList.add("d-none");
            reviewsManage.classList.remove("d-none");
        }
    }

    async function renderReviews(reviews) {
        reviewsTableBody.innerHTML = "";

        const movieDetailsPromises = reviews.map(async (review) => {
            const movieData = await MovieAPI.fetchMoviesDetails(review.linkDetails.movieId);
            return {
                ...review,
                movieName: movieData ? movieData.title : "Unknown Movie"
            };
        });

        const reviewsWithMovies = await Promise.all(movieDetailsPromises);
        const useMongoDB = await fetchConfig();

        const reviewElements = reviewsWithMovies.map(review => {
            const row = document.createElement("tr");
            const userId = useMongoDB ? review._id : review.id;

            row.innerHTML = `
                <td valign="middle" class="text-center">${review.username}</td>
                <td valign="middle" class="text-center">${truncateText(review.comment, 30) || "No comment"}</td>
                <td valign="middle" class="text-center">${review.rating} <i class="bi bi-star fs-5 text-warning"></i></td>
                <td valign="middle" class="text-center"><a href="/details/${review.linkDetails.movieId}" class="link-light" target="_blank">${truncateText(review.movieName, 20)}</a></td>
                <td valign="middle" class="text-center"><a href="${review.linkDetails.url}" class="link-light">${truncateText(review.linkDetails.name, 15)}</a></td>
                <td valign="middle" class="text-center">${review.linkDetails.isPublic ? "<span class='badge text-bg-success'>Public</span>" : "<span class='badge text-bg-secondary'>Private</span>"}</td>
                <td valign="middle" class="text-center">${generateFormattedDate(review.createdAt)}</td>
                <td valign="middle" class="text-center">
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${userId}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            return row;
        });

        setupPagination(reviewElements, reviewsTableBody, 6, paginationContainer);
        addEventListeners();
    }

    function addEventListeners() {
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const buttonElement = e.target.closest("button");
                const reviewId = buttonElement.dataset.id;

                showModal("Are you sure you want to delete this review?", async () => {
                    try {
                        const response = await fetch(`/admin/reviews/deleteReview/${reviewId}`, { method: "DELETE" });
                        let result = await response.json();

                        if (response.ok) {
                            showAlert(`<i class="bi bi-trash3"></i> ${result.message}`);
                            loadReviews();
                        } else {
                            showAlert(result.message);
                        }
                    } catch (error) {
                        console.error("Error deleting review:", error);
                        showAlert("Error deleting review");
                    }
                });
            });
        });
    }

    searchInput.addEventListener("input", () => {
        if (allReviews.length === 0) return;
        const query = searchInput.value.toLowerCase();
        const filteredReviews = allReviews.filter(review => 
            review.username.toLowerCase().includes(query) || 
            (review.comment && review.comment.toLowerCase().includes(query))
        );

        renderReviews(filteredReviews);
    });

    loadReviews();
});