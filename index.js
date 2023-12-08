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
  let sql = "SELECT playlist_name FROM Playlist WHERE id = ?";
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
  let sql = "INSERT INTO Playlist (playlist_name, user_id) VALUES (?, ?)";
  try {
    await executeSQL(sql, [playlist_name, user_id]);
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
  let sql = "SELECT * FROM Playlist WHERE user_id = ?";
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
  }
);

app.get("/api/playlist/:playlistId/items", async function (req, res) {
  const { playlistId } = req.params;
  let sql = "SELECT * FROM PlaylistItem WHERE playlist_id = ?";
  try {
    const items = await executeSQL(sql, [playlistId]);

    // Separate content_ids based on type (movie or series)
    const movieContentIds = [];
    const seriesContentIds = [];

    items.forEach((item) => {
      if (item.type === "movie") {
        movieContentIds.push(item.content_id);
      } else if (item.type === "series") {
        seriesContentIds.push(item.content_id);
      }
    });

    // Function to fetch metadata for content_ids and type
    async function fetchMetadata(contentIds, type) {
      if (contentIds.length === 0) {
        return [];
      }

      const cinemetaResponse = await fetch(
        `https://v3-cinemeta.strem.io/catalog/${type}/last-videos/lastVideosIds=${contentIds.join(
          ","
        )}.json`
      );

      if (!cinemetaResponse.ok) {
        throw new Error(
          `Cinemeta API request failed with status: ${cinemetaResponse.status}`
        );
      }

      const cinemetaData = await cinemetaResponse.json();
      const { metasDetailed } = cinemetaData;

      return metasDetailed;
    }

    // Fetch metadata for movies and series separately
    const movieMetadata = await fetchMetadata(movieContentIds, "movie");
    const seriesMetadata = await fetchMetadata(seriesContentIds, "series");

    // Merge metadata with playlist items
    const itemsWithMetadata = items.map((item) => {
      let matchingMeta = null;
      if (item.type === "movie") {
        matchingMeta = movieMetadata.find(
          (meta) => meta.imdb_id === item.content_id
        );
      } else if (item.type === "series") {
        matchingMeta = seriesMetadata.find(
          (meta) => meta.imdb_id === item.content_id
        );
      }

      return {
        ...item,
        metadata: matchingMeta || null,
      };
    });

    res.status(200).json(itemsWithMetadata);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving playlist items with metadata");
  }
});

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

    const combinedResults = {
      movies: movieData.metas || [],
      series: seriesData.metas || [],
    };

    res.json(combinedResults);
  } catch (error) {
    console.error("Error during search:", error);
    res.status(500).send("Error performing search");
  }
});

//start server
app.listen(3000, () => {
  console.log("Expresss server running...");
});
