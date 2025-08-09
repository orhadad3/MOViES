import { generateFormattedDate, showAlert, setupPagination, showModal, truncateText, fetchConfig } from "../utils.js";
import { MovieAPI } from "../main.js";

document.addEventListener("DOMContentLoaded", async () => {
    const linksTableBody = document.getElementById("linksTableBody");
    const searchInput = document.getElementById("searchLink");
    const linksManage = document.getElementById("linksManage");
    const spinner = document.getElementById("spinner");
    const paginationContainer = document.createElement("div");
    linksManage.after(paginationContainer);
    
    let allLinks = [];

    async function loadLinks() {
        try {
            const response = await fetch("/admin/links/getPublicLinks");

            if (!response.ok) {
                throw new Error("Failed to fetch links");
            }

            allLinks = await response.json();

            if (allLinks.length === 0) {
                linksTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">
                            No public links...
                        </td>
                    </tr>
                `;
                return;
            }

            await renderLinks(allLinks);

        } catch (error) {
            console.error("Error fetching links:", error);
            showAlert("Error fetching links");
        } finally {
            spinner.classList.add("d-none");
            linksManage.classList.remove("d-none");
        }
    }

    async function renderLinks(links) {
        linksTableBody.innerHTML = "";

        const useMongoDB = await fetchConfig();

        const movieDetailsPromises = links.map(async (link) => {
            const movieData = await MovieAPI.fetchMoviesDetails(link.movieId);
            return {
                ...link,
                movieName: movieData ? movieData.title : "Unknown Movie"
            };
        });

        const linksWithMovies = await Promise.all(movieDetailsPromises);

        const linkElements = linksWithMovies.map(link => {
            const row = document.createElement("tr");
            const userId = useMongoDB ? link._id : link.id;

            row.innerHTML = `
                <td valign="middle" class="text-center"><a href="${link.url}" class="link-light">${truncateText(link.name, 30)}</a></td>
                <td valign="middle" class="text-center"><a href="/details/${link.movieId}" class="link-light" target="_blank">${link.movieName}</a></td>
                <td valign="middle" class="text-center">${link.user}</td>
                <td valign="middle" class="text-center">${generateFormattedDate(link.addedDate)}</td>
                <td valign="middle" class="text-center">${link.avgRating.toFixed(1)} <i class="bi bi-star fs-5 text-warning"></i></td>
                <td valign="middle" class="text-center">
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${userId}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            return row;
        });

        setupPagination(linkElements, linksTableBody, 6, paginationContainer);
        addEventListeners();
    }

    function addEventListeners() {
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const buttonElement = e.target.closest("button");
                const linkId = buttonElement.dataset.id;

                showModal("Are you sure you want to delete this link?", async () => {
                    try {
                        const response = await fetch(`/admin/links/deleteLink/${linkId}`, { method: "DELETE" });
                        let result = await response.json();

                        if (response.ok) {
                            showAlert(`<i class="bi bi-trash3"></i> ${result.message}`);
                            await loadLinks();
                        } else {
                            showAlert(result.message);
                        }
                    } catch (error) {
                        console.error("Error deleting link:", error);
                        showAlert("Error deleting link");
                    }
                });
            });
        });
    }

    searchInput.addEventListener("input", () => {
        if (allLinks.length === 0) return;
        const query = searchInput.value.toLowerCase();
        const filteredLinks = allLinks.filter(link => link.name.toLowerCase().includes(query));

        renderLinks(filteredLinks);
    });

    loadLinks();
});