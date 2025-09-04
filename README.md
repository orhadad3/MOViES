# MOViES

**MOViES** is a full‑stack web application developed as part of my academic studies.  
The project demonstrates a wide range of technical skills, including backend and frontend development, database integration, API usage, and system architecture design.  

---
## Project Overview

MOViES is a movie review and management platform that allows users to:

- Search and view movies using an external API (for reviews and movie data).
- Fetch trailers directly from the **YouTube API**.
- Add **public or private links** for each movie entry.
- Comment and rate movies and shared links.
- Manage content through an **Admin Panel** (add, edit, delete movies, links, and comments).

The system is built using a clear **MVC (Model‑View‑Controller) architecture**, ensuring modularity, scalability, and maintainability.

---
## Technologies & Skills Demonstrated

### Backend Development
- **Node.js & Express.js**: Server‑side logic and route handling.
- **Middleware**: Implemented for authentication, error handling, and logging.
- **API Integration**: 
  - Movie information API for reviews and metadata.  
  - **YouTube API** for fetching trailers dynamically.

### Frontend Development
- **HTML5, CSS3, JavaScript** for building dynamic interfaces.
- **Bootstrap** for responsive and modern UI design.
- **EJS Templating** for server‑side rendering of views.

### Database & Data Management
- **MongoDB** for storing user data, reviews, links, and ratings.
- Designed **data models** for movies, users, comments, and ratings.
- CRUD operations (Create, Read, Update, Delete) implemented across the system.

### System Architecture & Design
- MVC structure (`models/`, `controllers/`, `routes/`) for clean separation of concerns.
- Configurable system settings using `config.js`.
- Admin panel with role‑based access and management features.

### Collaboration & Best Practices
- **Version control** with Git & GitHub for project management.
- Well‑structured commits and documentation.
- Modular code design for scalability and extensibility.

---
## Features

- **Movie Search & Reviews**: Powered by external APIs.  
- **Trailers**: Integrated directly from YouTube.  
- **Links Management**: Add private/public links for each movie.  
- **Comments & Ratings**: Allow user engagement and feedback.  
- **Admin Panel**: Manage movies, reviews, and user‑submitted content.  

---
## Installation & Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/orhadad3/MOViES.git
   cd MOViES
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `config.js`:
   - Port number  
   - MongoDB connection string  
   - API keys (Movie API, YouTube API)

4. Start the application:
   ```bash
   node app.js
   ```
   Or in development mode:
   ```bash
   npm run dev
   ```

5. Visit the app at:
   ```
   http://localhost:3000
   ```

---
## Future Improvements

- OAuth login (Google, GitHub, etc.) for easier user authentication.  
- Advanced recommendation system based on user history and ratings.  
- REST API endpoints for mobile or third‑party integration.  
- Cloud deployment with Docker/Kubernetes.  

---
## Purpose

This project highlights my **full‑stack development skills** and demonstrates my ability to:
- Work with **Node.js/Express.js** and backend logic.  
- Use **MongoDB** and design data models.  
- Integrate external **APIs** (YouTube, Movie DB).  
- Build responsive **frontend** with Bootstrap, HTML, CSS, and JavaScript.  
- Design systems using **MVC architecture**.  
- Apply **best practices** in coding, modularity, and version control with Git.  
