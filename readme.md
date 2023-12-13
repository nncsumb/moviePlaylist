DB SQL:

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