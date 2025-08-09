const API_KEY = "fca3b23c";
const BASE_URL = "http://www.omdbapi.com/";
const YOUTUBE_API_KEY = "AIzaSyDZ7hhNm-YdfC3lb9uSrC8h8o6qh_IeqSk";
const YOUTUBE_URL = "https://www.googleapis.com/youtube/v3/search";

class Movie {
    constructor(webType, title, year, type, imdbid, poster, releasedata, genre, director, actors, rating, plot) {
        this.title = title;
        this.year = year;
        this.type = type;
        this.imdbid = imdbid;
        this.poster = poster;

        this.links = [];

        if(webType === "details") {
            this.releaseData = releasedata;
            this.genre = genre;
            this.director = director;
            this.actors = actors;
            this.rating = rating;
            this.plot = plot;
        }
    }

    // Add link to each movie
    addLink(name, url, description) {
        this.links.push({name, url, description});
    }

    removeLink(name) {
        this.links = this.links.filter(link=>link.name !== name);
    }
}

class MovieAPI {
    // Get List API
    static async fetchMovies(query) {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${query}`);
        const data = await response.json();

        if (data.Response === "True") {
            let moviesListFound = data.Search;
            return moviesListFound.map(movie => {
                if(movie.Poster === "N/A") {
                    movie.Poster = "images/card_placeholder.png";
                }
                return new Movie("card", movie.Title, movie.Year, movie.Type, movie.imdbID, movie.Poster);
            });
        }
        return [];
    }

    // Get Specific Movie by imdbID
    static async fetchMoviesDetails(imdbid) {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${imdbid}`);
        const data = await response.json();

        if (data.Response === "True") {
            if(data.Poster === "N/A") {
                data.Poster = "images/card_placeholder.png";
            }

            return new Movie("details", data.Title, data.Year, data.Type, data.imdbID, data.Poster, data.Released, data.Genre, data.Director, data.Actors, data.imdbRating, data.Plot);
        }
        return null;
    }

    // Get Trailer from YouTube
    static async fetchYouTubeTrailer(title) {
        const query = `${title} official trailer`;
        const url = `${YOUTUBE_URL}?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;
    
        try {
            const response = await fetch(url);
            const data = await response.json();
    
            if (data.items && data.items.length > 0) {
                const videoId = data.items[0].id.videoId;
                const trailerTitle = data.items[0].snippet.title;
                return {id: videoId, videoTitle: trailerTitle};
            } else {
                console.log("No trailer found for:", title);
                return null;
            }
        } catch (error) {
            console.error("Error fetching YouTube trailer:", error);
            return null;
        }
    }
}

export { MovieAPI };