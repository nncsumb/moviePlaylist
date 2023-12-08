// api.js

// Function to create a new users
async function createUser(userName) {
  try {
    const response = await axios.post("/api/user", { name: userName });
    console.log("User created:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

// Function to create a new playlist
async function createPlaylist(playlistName, userId) {
  try {
    const response = await axios.post("/api/playlist/new", {
      playlist_name: playlistName,
      user_id: userId,
    });
    console.log("Playlist created:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating playlist:", error);
    throw error;
  }
}

async function deletePlaylist(playlistId) {
  try {
    const response = await axios.delete(`/api/playlist/${playlistId}`);
    console.log("Playlist deleted:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error deleting playlist:", error);
    throw error;
  }
}

// Function to get playlists for a user
async function getPlaylists(userId) {
  try {
    const response = await axios.get(`/api/playlist/${userId}`);
    console.log("Playlists:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error retrieving playlists:", error);
    throw error;
  }
}

// Function to add an item to a playlist
async function addPlaylistItem(playlistId, contentId, type) {
  try {
    const response = await axios.post(`/api/playlist/${playlistId}/items`, {
      content_id: contentId,
      type: type,
    });
    console.log("Playlist item added:", response.data);

    if (response.status !== 201) {
      throw new Error(`Error: ${response.status}, ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error("Error adding playlist item:", error);
    throw error;
  }
}

async function deletePlaylistItem(playlistId, itemId) {
  try {
    const response = await axios.delete(
      `/api/playlist/${playlistId}/items/${itemId}`
    );
    console.log("Playlist item deleted:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error deleting playlist item:", error);
    throw error;
  }
}

// Function to get playlist items
async function getPlaylistItems(playlistId) {
  try {
    const response = await axios.get(`/api/playlist/${playlistId}/items`);
    console.log("Playlist items:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error retrieving playlist items:", error);
    throw error;
  }
}

// Function to search movies and series
async function searchCinemeta(searchTerm) {
  try {
    const response = await axios.get(
      `/api/search/${encodeURIComponent(searchTerm)}`
    );
    console.log("Search results:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error during search:", error);
    throw error;
  }
}
