CREATE TABLE IF NOT EXISTS User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Playlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playlist_name VARCHAR(255) NOT NULL,
    user_id INT,
    playlist_order INT,
    color VARCHAR(255) DEFAULT 'white',
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS PlaylistItem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_id VARCHAR(255) NOT NULL,
    type ENUM('movie', 'series') NOT NULL,
    playlist_id INT,
    FOREIGN KEY (playlist_id) REFERENCES Playlist(id) ON DELETE CASCADE
);

TASK
Add sorting on /api/playlist/:playlistId/items for sorting by movie, tv show or movie & tv show using checkbox - DONE

Add sorting on /api/playlist/:playlistId/items for sorting by genre using select-  DONE

Add for /api/playlist/new to update playlist_order by taking max order + 1 and rank by input

Add for delete /api/playlist/:playlistId to update order of exisiting playlists

Add new endpoint for edit playlist add endpoint axios call to api.js - DONE

Edit endpoint should swap order of playlist you are editing and playlist that currently has that order value

Add edit button to loadPlaylists function in script.js - DONE

Either add modal or new route for edit playlist and prefil data with playlist_name, playlist_order, playlist_rank - DONE(need order and rank still)

Display poster of playlist items DONE

Styling frontend using bootstrap (DONE)


NOTE: For sorting you cant use database to sort you need to sort after metadata is fetched use query params and javascript to sort in the endpoint. The sorting checkbox and select will apply the query param.


const genres = ["All Genres", "Action", "Adventure", "Animation", "Anime", "Comedy", "Crime", "Disaster", "Documentary", "Donghua", "Drama", "Eastern", "Family", "Fan-film", "Fantasy", "Film-noir", "History", "Holiday", "Horror", "Indie", "Music", "Musical", "Mystery", "None", "Road", "Romance", "Science-fiction", "Short", "Sports", "Sporting-event", "Suspense", "Thriller", "Tv-movie", "War", "Western",];