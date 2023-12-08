// Functions
async function handleUserFormSubmission(event) {
  event.preventDefault(); // Prevent the default form submission

  const userName = document.getElementById("userName").value;
  try {
    const response = await createUser(userName);
    if (response && response.userId) {
      localStorage.setItem("userId", response.userId);
      alert("User created successfully. User ID: " + response.userId);

      // Redirect to playlists page
      window.location.href = "/playlists"; // Change '/playlists' to the actual route you have for displaying playlists
    }
  } catch (error) {
    console.error("Error creating user:", error);
    alert("Error creating user");
  }
}

// Function to handle the playlist creation form submission
async function handlePlaylistFormSubmission(event) {
  event.preventDefault();
  const playlistName = document.getElementById("playlistName").value;
  const userId = localStorage.getItem("userId");

  try {
    const response = await createPlaylist(playlistName, userId);
    if (response) {
      alert("Playlist created successfully");
      loadPlaylists(); // Reload the playlist display
    }
  } catch (error) {
    console.error("Error creating playlist:", error);
    alert("Error creating playlist");
  }
}

// Function to handle the search form submission
async function handleSearchFormSubmission(event) {
  event.preventDefault(); // Prevent the default form submission
  const searchInput = document.getElementById("search").value;
  const playlistId = document.getElementById("playlistId").value;

  try {
    const searchResults = await searchCinemeta(searchInput);
    loadSearchResults(searchResults, playlistId);
  } catch (error) {
    console.error("Error searching:", error);
    alert("Error searching");
  }
}

// Function to load and display playlists
async function loadPlaylists() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  try {
    const playlists = await getPlaylists(userId);
    const playlistsContainer = document.getElementById("playlists");
    playlistsContainer.innerHTML = ""; // Clear existing playlists

    playlists.forEach((playlist) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `/playlist/${playlist.id}`;
      a.textContent = playlist.playlist_name;
      li.appendChild(a);

      // Create a delete button
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.onclick = async function () {
        try {
          await deletePlaylist(playlist.id);
          alert("Playlist deleted successfully");
          loadPlaylists(); // Reload playlists to reflect changes
        } catch (error) {
          console.error("Error deleting playlist:", error);
          alert("Error deleting playlist");
        }
      };

      li.appendChild(deleteButton);
      playlistsContainer.appendChild(li);
    });
  } catch (error) {
    console.error("Error retrieving playlists:", error);
  }
}

async function loadPlaylistItems(playlistId) {
  try {
    const items = await getPlaylistItems(playlistId);
    const itemsContainer = document.getElementById("playlistItems");
    itemsContainer.innerHTML = ""; // Clear existing items

    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item.metadata.name;

      // Create a delete button for each item
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.onclick = async function () {
        try {
          await deletePlaylistItem(playlistId, item.id);
          alert("Playlist item deleted successfully");
          loadPlaylistItems(playlistId); // Reload playlist items to reflect changes
        } catch (error) {
          console.error("Error deleting playlist item:", error);
          alert("Error deleting playlist item");
        }
      };

      li.appendChild(deleteButton);
      itemsContainer.appendChild(li);
    });
  } catch (error) {
    console.error("Error retrieving playlist items:", error);
  }
}

// Function to display search results
function loadSearchResults(results, playlistId) {
  const searchMoviesContainer = document.getElementById("searchMovies");
  const searchSeriesContainer = document.getElementById("searchSeries");

  // Clear existing search results
  searchMoviesContainer.innerHTML = "";
  searchSeriesContainer.innerHTML = "";

  // Function to handle adding items to the playlist
  async function handleAddToPlaylist(meta, contentType) {
    try {
      const response = await addPlaylistItem(playlistId, meta.id, contentType);
      alert("Added to playlist successfully");
      loadPlaylistItems(playlistId);
    } catch (error) {
      console.error("Error adding to playlist:", error);
      if (error.response && error.response.status === 400) {
        alert("This item is already in the playlist");
      } else {
        alert("Error adding to playlist");
      }
    }
  }

  // Handling movie results
  if (results.movies && results.movies.length > 0) {
    results.movies.forEach(function (meta) {
      const li = document.createElement("li");
      const title = document.createElement("span");
      title.textContent = meta.name;
      li.appendChild(title);

      // Create the "Add to Playlist" button for movies
      const addToPlaylistButton = document.createElement("button");
      addToPlaylistButton.textContent = "Add to Playlist";
      addToPlaylistButton.addEventListener("click", function () {
        handleAddToPlaylist(meta, "movie");
      });
      li.appendChild(addToPlaylistButton);
      searchMoviesContainer.appendChild(li);
    });
  } else {
    const noResultsMessage = document.createElement("p");
    noResultsMessage.textContent = "No movie results found.";
    searchMoviesContainer.appendChild(noResultsMessage);
  }

  // Handling series results
  if (results.series && results.series.length > 0) {
    results.series.forEach(function (meta) {
      const li = document.createElement("li");
      const title = document.createElement("span");
      title.textContent = meta.name;
      li.appendChild(title);

      // Create the "Add to Playlist" button for series
      const addToPlaylistButton = document.createElement("button");
      addToPlaylistButton.textContent = "Add to Playlist";
      addToPlaylistButton.addEventListener("click", function () {
        handleAddToPlaylist(meta, "series");
      });
      li.appendChild(addToPlaylistButton);
      searchSeriesContainer.appendChild(li);
    });
  } else {
    const noResultsMessage = document.createElement("p");
    noResultsMessage.textContent = "No series results found.";
    searchSeriesContainer.appendChild(noResultsMessage);
  }
}

// Event listeners
document.addEventListener("DOMContentLoaded", function () {
  // Check if userForm exists before adding event listener
  var userForm = document.getElementById("userForm");
  if (userForm) {
    userForm.addEventListener("submit", handleUserFormSubmission);
  }

  // Check if playlistForm exists before adding event listener
  var playlistForm = document.getElementById("playlistForm");
  if (playlistForm) {
    playlistForm.addEventListener("submit", handlePlaylistFormSubmission);
  }

  // Check if searchForm exists before adding event listener
  var searchForm = document.getElementById("searchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", handleSearchFormSubmission);
  }

  var backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", function () {
      window.location.href = "/playlists"; // Redirect to the /playlist route
    });
  }
});
