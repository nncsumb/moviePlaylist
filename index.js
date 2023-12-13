//index.js

const express = require("express");
const mysql = require("mysql");
const app = express();
const util = require("util");
const pool = require("./dbPool");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // for parsing application/json

pool.query = util.promisify(pool.query);

async function executeSQL(sql, params) {
  try {
    const rows = await pool.query(sql, params);
    return rows;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

//Routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/playlists", (req, res) => {
  res.render("playlists");
});

app.get("/playlist/:playlistId", async (req, res) => {
  const playlistId = req.params.playlistId;
  let sql =
    "SELECT playlist_name FROM Playlist WHERE id = ? ORDER BY playlist_order";
  try {
    const result = await executeSQL(sql, [playlistId]);
    if (result.length > 0) {
      const playlistName = result[0].playlist_name;
      res.render("playlist", {
        playlistId: playlistId,
        playlistName: playlistName,
      });
    } else {
      res.status(404).send("Playlist not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving playlist");
  }
});

// Endpoints
app.post("/api/user", async function (req, res) {
  const { name } = req.body;
  if (!name) {
    return res.status(400).send("Name is required");
  }
  let sql = "INSERT INTO User (name) VALUES (?)";
  try {
    const result = await executeSQL(sql, [name]);
    res.status(201).json({ userId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating user");
  }
});

// Playlist Management Endpoints
app.post("/api/playlist/new", async function (req, res) {
  const { playlist_name, user_id } = req.body;
  if (!playlist_name || !user_id) {
    return res.status(400).send("Playlist name and user ID are required");
  }

  // Calculate the new playlist_order as the maximum order for the specified user_id + 1
  let maxOrderSql =
    "SELECT MAX(playlist_order) AS maxOrder FROM Playlist WHERE user_id = ?";

  try {
    const result = await executeSQL(maxOrderSql, [user_id]);
    const maxOrder = result[0].maxOrder || 0;
    const newPlaylistOrder = maxOrder + 1;

    let sql =
      "INSERT INTO Playlist (user_id, playlist_name, playlist_order) VALUES (?, ?, ?)";
    await executeSQL(sql, [user_id, playlist_name, newPlaylistOrder]);

    res.status(201).send("Playlist created successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating playlist");
  }
});

app.delete("/api/playlist/:playlistId", async function (req, res) {
  const { playlistId } = req.params;
  let sql = "DELETE FROM Playlist WHERE id = ?";
  try {
    await executeSQL(sql, [playlistId]);
    res.status(200).send("Playlist deleted successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting playlist");
  }
});

app.get("/api/playlist/:userId", async function (req, res) {
  const { userId } = req.params;
  let sql = "SELECT * FROM Playlist WHERE user_id = ? ORDER BY playlist_order";
  try {
    const playlists = await executeSQL(sql, [userId]);
    res.status(200).json(playlists);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving playlists");
  }
});

// Playlist Items Management Endpoints
app.post("/api/playlist/:playlistId/items", async function (req, res) {
  const { playlistId } = req.params;
  const { content_id, type } = req.body;
  if (!content_id || !type) {
    return res.status(400).send("Content ID and type are required");
  }

  // Check if the PlaylistItem already exists in the playlist
  let checkSql =
    "SELECT * FROM PlaylistItem WHERE content_id = ? AND type = ? AND playlist_id = ?";
  try {
    const existingItem = await executeSQL(checkSql, [
      content_id,
      type,
      playlistId,
    ]);
    if (existingItem.length > 0) {
      return res
        .status(400)
        .send("Playlist item already exists in the playlist");
    }
  } catch (checkErr) {
    console.error(checkErr);
    return res.status(500).send("Error checking existing playlist item");
  }

  // If the item doesn't exist, add it to the playlist
  let insertSql =
    "INSERT INTO PlaylistItem (content_id, type, playlist_id) VALUES (?, ?, ?)";
  try {
    await executeSQL(insertSql, [content_id, type, playlistId]);
    res.status(201).send("Playlist item added successfully");
  } catch (insertErr) {
    console.error(insertErr);
    res.status(500).send("Error adding playlist item");
  }
});
//delete item
app.delete(
  "/api/playlist/:playlistId/items/:itemId",
  async function (req, res) {
    const { playlistId, itemId } = req.params;
    let sql = "DELETE FROM PlaylistItem WHERE playlist_id = ? AND id = ?";
    try {
      await executeSQL(sql, [playlistId, itemId]);
      res.status(200).send("Playlist item deleted successfully");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting playlist item");
    }
  },
);
//display playlist
app.get("/api/playlist/:playlistId/items", async function (req, res) {
  const { playlistId } = req.params;
  const { type, genre } = req.query;

  let sql = "SELECT * FROM PlaylistItem WHERE playlist_id = ?";
  try {
    let items = await executeSQL(sql, [playlistId]);

    // Fetch metadata for movies and series separately
    const movieMetadata = await fetchMetadata(items, "movie");
    const seriesMetadata = await fetchMetadata(items, "series");

    // Combine items with their metadata
    items = items.map((item) => {
      const metadata =
        item.type === "movie"
          ? movieMetadata.find(
              (meta) => meta && meta.imdb_id === item.content_id,
            )
          : seriesMetadata.find(
              (meta) => meta && meta.imdb_id === item.content_id,
            );

      return { ...item, metadata: metadata || null };
    });

    // Filter by type if specified
    if (type && type !== "both") {
      items = items.filter((item) => item.type === type);
    }

    // Filter by genre if specified
    if (genre) {
      items = items.filter(
        (item) =>
          item.metadata &&
          Array.isArray(item.metadata.genres) &&
          item.metadata.genres.includes(genre),
      );
    }

    res.status(200).json(items);
  } catch (err) {
    console.error("Error retrieving playlist items:", err);
    res.status(500).send("Error retrieving playlist items with metadata");
  }
});

// Function to fetch metadata
async function fetchMetadata(items, type) {
  const contentIds = items
    .filter((item) => item.type === type)
    .map((item) => item.content_id);
  if (contentIds.length === 0) {
    return [];
  }

  const cinemetaResponse = await fetch(
    `https://v3-cinemeta.strem.io/catalog/${type}/last-videos/lastVideosIds=${contentIds.join(
      ",",
    )}.json`,
  );

  if (!cinemetaResponse.ok) {
    throw new Error(
      `Cinemeta API request failed with status: ${cinemetaResponse.status}`,
    );
  }

  const cinemetaData = await cinemetaResponse.json();
  return cinemetaData.metasDetailed || [];
}

app.get("/api/search/:searchTerm", async (req, res) => {
  const searchTerm = req.params.searchTerm || "";
  try {
    const movieSearchUrl = `https://v3-cinemeta.strem.io/catalog/movie/top/search=${searchTerm}.json`;
    const seriesSearchUrl = `https://v3-cinemeta.strem.io/catalog/series/top/search=${searchTerm}.json`;

    const [movieResponse, seriesResponse] = await Promise.all([
      fetch(movieSearchUrl),
      fetch(seriesSearchUrl),
    ]);

    const [movieData, seriesData] = await Promise.all([
      movieResponse.json(),
      seriesResponse.json(),
    ]);

    // Extract IDs from movies and series
    const movieIds = movieData.metas.map((movie) => movie.id);
    const seriesIds = seriesData.metas.map((series) => series.id);

    // Fetch enriched metadata for movies and series
    const [enrichedMovies, enrichedSeries] = await Promise.all([
      searchMetadata(movieIds, "movie"),
      searchMetadata(seriesIds, "series"),
    ]);

    // Prepare the enriched data to send in the response
    const enrichedResults = {
      movies: enrichedMovies,
      series: enrichedSeries,
    };

    res.json(enrichedResults);
  } catch (error) {
    console.error("Error during search:", error);
    res.status(500).send("Error performing search");
  }
});

async function searchMetadata(ids, type) {
  if (ids.length === 0) {
    return [];
  }

  const cinemetaResponse = await fetch(
    `https://v3-cinemeta.strem.io/catalog/${type}/last-videos/lastVideosIds=${ids.join(
      ",",
    )}.json`,
  );

  if (!cinemetaResponse.ok) {
    throw new Error(
      `Cinemeta API request failed with status: ${cinemetaResponse.status}`,
    );
  }

  const cinemetaData = await cinemetaResponse.json();
  return cinemetaData.metasDetailed || [];
}

app.post("/edit-playlist/:id", async (req, res) => {
  const playlistId = req.params.id;
  const { playlist_name, playlist_order, color } = req.body;

  if (!playlist_name) {
    return res.status(400).send("Playlist name is required");
  }

  try {
    const sql =
      "UPDATE Playlist SET playlist_name = ?, playlist_order = ?, color = ? WHERE id = ?";
    await executeSQL(sql, [playlist_name, playlist_order, color, playlistId]);
    res.redirect("/playlists");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating playlist");
  }
});

//start server
app.listen(3000, () => {
  console.log("Express server running...");
});
