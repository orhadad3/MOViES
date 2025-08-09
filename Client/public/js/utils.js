/**
 * Formats a given date into a readable string format.
 * Example output: "01 Feb 2024 at 14:30"
 * @param {Date | string} date - The date to format.
 * @returns {string} - Formatted date string.
 */
function generateFormattedDate(date) {
    return new Date(date).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).replace(",", " at");
}

/**
 * Generates HTML for a star rating system.
 * @param {number} rating - The rating value (1-5).
 * @returns {string} - HTML string representing the star rating with filled/empty stars
 */
function generateStars(rating) {
    let starsHTML = "";
    for (let i = 1; i <= 5; i++) {
        starsHTML += i <= rating ? '<i class="bi bi-star-fill"></i>' : '<i class="bi bi-star"></i>';
    }
    return starsHTML;
}

/**
 * Sets up pagination for any list of items.
 * @param {Array} items - The array of items to paginate.
 * @param {HTMLElement} container - The container where items will be displayed.
 * @param {number} itemsPerPage - Number of items per page.
 * @param {HTMLElement} paginationContainer - The container for pagination controls.
 */
function setupPagination(items, container, itemsPerPage, paginationContainer) {
    let currentPage = 1;
    const totalPages = Math.ceil(items.length / itemsPerPage);

    paginationContainer.classList.add("d-flex", "justify-content-center", "mt-3", "w-100", "text-center");

    if (items.length === 0) {
        paginationContainer.classList.add("d-none");
        return;
    } else {
        paginationContainer.classList.remove("d-none");
    }

    /**
     * Renders the items of the current page.
     * @param {number} page - The current page number.
     */
    function renderPage(page) {
        container.innerHTML = "";
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const itemsToShow = items.slice(startIndex, endIndex);

        itemsToShow.forEach(item => container.appendChild(item));

        renderPaginationControls();
    }

    /**
     * Creates pagination controls and handles navigation.
     */
    function renderPaginationControls() {
        paginationContainer.innerHTML = `
            <div class="btn-group" role="group" aria-label="Pagination">
                <button id="prevPage" class="btn btn-secondary">Previous</button>
                ${generatePageButtons()}
                <button id="nextPage" class="btn btn-secondary">Next</button>
            </div>
        `;

        const prevButton = paginationContainer.querySelector("#prevPage");
        const nextButton = paginationContainer.querySelector("#nextPage");

        prevButton.classList.toggle("disabled", currentPage === 1);
        nextButton.classList.toggle("disabled", currentPage === totalPages || items.length <= itemsPerPage);

        prevButton.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                renderPage(currentPage);
            }
        };

        nextButton.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderPage(currentPage);
            }
        };
    }

    /**
     * Generates pagination buttons based on the total number of pages.
     * @returns {string} - HTML string containing pagination buttons.
     */
    function generatePageButtons() {
        let buttonsHtml = "";
        for (let i = 1; i <= totalPages; i++) {
            buttonsHtml += `<button class="btn ${i === currentPage ? "btn-secondary active" : "btn-secondary"} page-btn" data-page="${i}">${i}</button>`;
        }
        return buttonsHtml;
    }

    paginationContainer.addEventListener("click", (event) => {
        if (event.target.classList.contains("page-btn")) {
            currentPage = parseInt(event.target.dataset.page, 10);
            renderPage(currentPage);
        }
    });

    renderPage(currentPage);
}

/**
 * Displays a temporary Bootstrap alert message
 * The alert automatically dismisses after 5 seconds
 * @param {string} message - The alert message (can include HTML)
 */
function showAlert(message) {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Create and style the alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-light alert-dismissible fade show position-fixed bottom-0 end-0 m-3`;
    alertDiv.style.zIndex = "1050";
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `${message}`;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.classList.remove('show');
        alertDiv.addEventListener('transitionend', () => alertDiv.remove());
    }, 5000);
}

/**
 * Displays a Bootstrap modal with a confirmation button.
 * @param {string} message - The message to display in the modal.
 * @param {Function} callback - The function to execute when confirmed.
 */
function showModal(message, callback) {
    document.getElementById("confirmModalText").innerText = message;
    let confirmCallback = callback;

    const confirmModal = new bootstrap.Modal(document.getElementById("confirmModal"));
    confirmModal.show();

    document.getElementById("confirmModalButton").onclick = () => {
        if (confirmCallback) confirmCallback();
        confirmModal.hide();
    };
}

/**
 * Fetches the application configuration and determines whether MongoDB or JSON is used.
 * @returns {Promise<boolean>} - Returns true if MongoDB is used, otherwise false.
 */
async function fetchConfig() {
    try {
        const response = await fetch("/admin/config");
        if (!response.ok) {
            return false; // Default: Use JSON files
        }

        const config = await response.json();
        return config.useMongoDB; // Return config boolean
    } catch (error) {
        console.error("Error fetching config:", error);
        return false; // fall back to JSON
    }
}

/**
 * Create a Bootstrap confirmation modal with custom callback.
 * 
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.body
 * @param {string} options.confirmButtonText
 * @param {Function} options.onConfirm
 */
function createConfirmationModal({ title, body, confirmButtonText, onConfirm }) {
    const existingModal = document.getElementById("confirmationModal");
    if (existingModal) {
        existingModal.remove();
    }

    const modalHTML = `
        <div class="modal fade" id="confirmationModal" tabindex="-1" 
             aria-labelledby="confirmationModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="confirmationModalLabel">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${body}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Cancel
                        </button>
                        <button type="button" class="btn btn-danger" id="confirmationModalConfirmBtn">
                            ${confirmButtonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const modalContainer = document.createElement("div");
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    const confirmationModal = new bootstrap.Modal(document.getElementById("confirmationModal"));
    confirmationModal.show();

    // On confirm, call the custom callback
    document.getElementById("confirmationModalConfirmBtn").addEventListener("click", () => {
        onConfirm();
        confirmationModal.hide();

        const modalElement = document.getElementById("confirmationModal");
        if (modalElement) {
            modalElement.remove();
        }
    }, { once: true });
}

/**
 * Truncates a given text to a specified length and adds "..." if it exceeds the limit.
 * When hovering over the text, it shows the full content using a tooltip.
 * @param {string} text - The original text to truncate.
 * @param {number} maxLength - The maximum allowed length.
 * @returns {string} - HTML string with truncated text and full text on hover.
*/
function truncateText(text, maxLength) {
    if (!text) return "";
    const isTruncated = text.length > maxLength;
    const truncatedText = isTruncated ? text.substring(0, maxLength) + "..." : text;

    return `<span title="${text.replace(/"/g, '&quot;')}">${truncatedText}</span>`;
}

/**
 * Validates a URL string
 * Checks for proper protocol, domain format, and optional components
 * @param {string} str - The URL to validate
 * @returns {boolean} True if URL is valid, false otherwise
*/
function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
}

export { 
    generateFormattedDate, 
    generateStars, 
    setupPagination, 
    showAlert, 
    showModal, 
    truncateText, 
    createConfirmationModal, 
    fetchConfig, 
    validURL 
};