import { generateFormattedDate, showAlert, setupPagination, showModal, fetchConfig } from "../utils.js";

document.addEventListener("DOMContentLoaded", async () => {
    const userTableBody = document.getElementById("userTableBody");
    const searchInput = document.getElementById("searchUser");
    const userManage = document.getElementById("userManage");
    const spinner = document.getElementById("spinner");
    const paginationContainer = document.createElement("div");
    userManage.after(paginationContainer);

    let allUsers = [];

    async function loadUsers() {
        try {
            const response = await fetch("/admin/users/getUsers");

            if (!response.ok) {
                console.log("Failed to fetch users");
                return;
            }

            allUsers = await response.json();
            await renderUsers(allUsers);

        } catch (error) {
            console.error("Error fetching users:", error);
            showAlert(`<i class="bi bi-exclamation-square"></i> Error fetching users`);
        } finally {
            spinner.classList.add("d-none");
            userManage.classList.remove("d-none");
        }
    }

    async function renderUsers(users) {
        userTableBody.innerHTML = "";
        
        const useMongoDB = await fetchConfig();

        const userElements = users.map(user => {
            const userId = useMongoDB ? user._id : user.id;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td valign="middle" class="text-center">${user.username}</td>
                <td><input type="email" class="form-control emailUser" value="${user.email}" data-id="${userId}"></td>
                <td>
                    <select class="form-select userType" data-id="${userId}">
                        <option value="user" ${user.type === "user" ? "selected" : ""}>User</option>
                        <option value="admin" ${user.type === "admin" ? "selected" : ""}>Admin</option>
                    </select>
                </td>
                <td valign="middle" class="text-center">${ generateFormattedDate(user.createdAt) }</td>
                <td valign="middle" class="text-center">
                    <button class="btn btn-sm btn-light edit-btn" data-id="${userId}">
                        <i class="bi bi-floppy"></i>
                    </button>

                    <button class="btn btn-sm btn-danger delete-btn" data-id="${userId}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            return row;
        });

        setupPagination(userElements, userTableBody, 6, paginationContainer);
        addEventListeners();
    }

    function addEventListeners() {
        document.querySelectorAll(".edit-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const buttonElement = e.target.closest("button");
                const userId = buttonElement.dataset.id;

                if (!userId) {
                    showAlert(`<i class="bi bi-exclamation-square"></i> User ID not found`);
                    return;
                }

                const email = document.querySelector(`.emailUser[data-id='${userId}']`).value;
                const type = document.querySelector(`.userType[data-id='${userId}']`).value;

                showModal("Are you sure you want to update this user?", async () => {
                    try {
                        const response = await fetch(`/admin/users/updateUser/${userId}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email, type })
                        });

                        let result = await response.json();

                        if (response.ok) {
                            loadUsers();
                        }

                        showAlert(`<i class="bi bi-person-check"></i> ${result.message}`);

                    } catch (error) {
                        console.error("Error updating user:", error);
                        showAlert(`<i class="bi bi-exclamation-square"></i> Error updating user`);
                    }
                });
            });
        });

        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const userId = e.target.dataset.id;

                showModal("Are you sure you want to delete this user?", async () => {
                    try {
                        const response = await fetch(`/admin/users/deleteUser/${userId}`, { method: "DELETE" });
                        let result = await response.json();

                        if (response.ok) {
                            showAlert(`<i class="bi bi-person-dash"></i> User deleted successfully`);
                            loadUsers();
                        } else {
                            showAlert(result.message);
                        }

                    } catch (error) {
                        console.error("Error deleting user:", error);
                        showAlert(`<i class="bi bi-exclamation-square"></i> Error updating user`);
                    }
                });
            });
        });
    }

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        const filteredUsers = allUsers.filter(user => user.username.toLowerCase().includes(query));
        renderUsers(filteredUsers);
    });
    await fetchConfig();
    loadUsers();
});