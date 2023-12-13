//script.js

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
      window.location.href = "/playlists";
    }
  } catch (error) {
    console.error("Error creating user:", error);
    alert("Error creating user");
  }
}

function applySorting(playlistId) {
  const filterMovies = document.getElementById("filterMovies").checked;
  const filterSeries = document.getElementById("filterSeries").checked;
  const selectedGenre = document.getElementById("genreSelect").value;

  let type = "";
  if (filterMovies && filterSeries) {
    type = "";
  } else if (filterMovies) {
    type = "movie";
  } else if (filterSeries) {
    type = "series";
  }

  loadPlaylistItems(playlistId, type, selectedGenre);
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

    // Check if playlistsContainer exists on the page
    const playlistsContainer = document.getElementById("playlists");
    if (!playlistsContainer) return;

    // Only manipulate playlistsContainer if there are playlists
    if (playlists && playlists.length > 0) {
      const playlistsContainer = document.getElementById("playlists");
      playlistsContainer.innerHTML = "";
      playlistsContainer.className = "list-group";

      playlists.forEach((playlist) => {
        const li = document.createElement("li");
        li.className =
          "list-group-item d-flex justify-content-between align-items-center";
        li.style.backgroundColor = playlist.color;

        const a = document.createElement("a");
        a.href = `/playlist/${playlist.id}`;
        a.textContent = playlist.playlist_name;
        a.className = "playlist-link";
        li.appendChild(a);

        const buttonContainer = document.createElement("div");

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "btn btn-danger btn-sm mx-1";
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
        buttonContainer.appendChild(deleteButton);

        // Edit button
        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "btn btn-primary btn-sm mx-1";
        editButton.onclick = function () {
          // Open edit modal
          const editModal = new bootstrap.Modal(
            document.getElementById("editPlaylistModal"),
          );
          document.getElementById("editPlaylistName").value =
            playlist.playlist_name;
          document.getElementById("editPlaylistOrder").value =
            playlist.playlist_order;
          document.getElementById("editPlaylistColor").value = playlist.color;
          editModal.show();

          document.getElementById("editPlaylistForm").onsubmit =
            async function (event) {
              event.preventDefault();
              try {
                // Call API to update the playlist
                await editPlaylist(
                  playlist.id,
                  document.getElementById("editPlaylistName").value,
                  document.getElementById("editPlaylistOrder").value,
                  document.getElementById("editPlaylistColor").value,
                );
                alert("Playlist updated successfully");
                loadPlaylists(); // Reload playlists to reflect changes
                editModal.hide();
              } catch (error) {
                console.error("Error updating playlist:", error);
                alert("Error updating playlist");
              }
            };
        };
        buttonContainer.appendChild(editButton);

        li.appendChild(buttonContainer);
        playlistsContainer.appendChild(li);
      });
    }
  } catch (error) {
    console.error("Error retrieving playlists:", error);
  }
}

async function loadPlaylistItems(
  playlistId,
  typeFilter = "",
  genreFilter = "",
) {
  try {
    let items = await getPlaylistItems(playlistId, typeFilter);
    const itemsContainer = document.getElementById("playlistItems");
    itemsContainer.innerHTML = "";

    if (typeFilter !== "") {
      items = items.filter((item) => item.type === typeFilter);
    }

    if (genreFilter !== "") {
      items = items.filter((item) => item.genre === genreFilter);
    }

    items.forEach((item) => {
      const cardCol = createPlaylistItemCard(item);
      itemsContainer.appendChild(cardCol);
    });
  } catch (error) {
    console.error("Error retrieving playlist items:", error);
  }
}

function createPlaylistItemCard(item) {
  const col = document.createElement("div");
  col.className = "col-md-2 mb-3";

  const card = document.createElement("div");
  card.className = "card";

  if (item.metadata && item.metadata.poster) {
    const img = document.createElement("img");
    img.src = item.metadata.poster;
    img.alt = item.metadata.name;
    img.className = "card-img-top";
    card.appendChild(img);
  }

  const cardBody = document.createElement("div");
  cardBody.className = "card-body";

  const title = document.createElement("h5");
  title.className = "card-title";
  title.textContent = item.metadata ? item.metadata.name : "Unnamed Item";
  cardBody.appendChild(title);

  const deleteButton = document.createElement("button");
  deleteButton.className = "btn btn-danger";
  deleteButton.textContent = "Delete";
  deleteButton.onclick = async function () {
    try {
      await deletePlaylistItem(item.playlist_id, item.id);
      loadPlaylistItems(item.playlist_id); // Reload the playlist items
    } catch (error) {
      console.error("Error deleting playlist item:", error);
    }
  };
  cardBody.appendChild(deleteButton);

  card.appendChild(cardBody);
  col.appendChild(card);

  return col;
}

function loadSearchResults(results, playlistId) {
  const searchResultsContainer = document.getElementById("searchResults");
  const searchMoviesContainer = document.getElementById("searchMovies");
  const searchSeriesContainer = document.getElementById("searchSeries");

  const hasResults = results.movies.length > 0 || results.series.length > 0;
  searchResultsContainer.style.display = hasResults ? "block" : "none";

  searchMoviesContainer.innerHTML = "<div class='row'></div>";
  searchSeriesContainer.innerHTML = "<div class='row'></div>";

  const movieRow = searchMoviesContainer.querySelector(".row");
  const seriesRow = searchSeriesContainer.querySelector(".row");

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
  // Function to create a card inside a grid column
  function createCard(meta, contentType) {
    const col = document.createElement("div");
    col.className = "col-md-2 mb-3";

    const card = document.createElement("div");
    card.className = "card h-100";

    if (meta.poster) {
      const img = document.createElement("img");
      img.src = meta.poster;
      img.alt = meta.name + " poster";
      img.className = "card-img-top";
      card.appendChild(img);
    }

    const cardBody = document.createElement("div");
    cardBody.className = "card-body";

    const title = document.createElement("h5");
    title.className = "card-title";
    title.textContent = meta.name;
    cardBody.appendChild(title);

    // Create an "info" button
    const infoButton = document.createElement("button");
    infoButton.className = "btn btn-info";
    infoButton.textContent = "Info";
    infoButton.addEventListener("click", function () {
      // Set the movie info in the modal body
      const modalBody = document.querySelector("#movieInfoModal .modal-body");
      modalBody.innerHTML = `
        <h5>${meta.name}</h5>
        <p>Release Year: ${meta.releaseInfo || "N/A"}</p>
       `;

      // Show the modal
      const movieInfoModal = new bootstrap.Modal(
        document.getElementById("movieInfoModal"),
      );
      movieInfoModal.show();
    });
    cardBody.appendChild(infoButton);

    const addToPlaylistButton = document.createElement("button");
    addToPlaylistButton.className = "btn btn-primary";
    addToPlaylistButton.textContent = "Add to Playlist";
    addToPlaylistButton.addEventListener("click", function () {
      handleAddToPlaylist(meta, contentType);
    });
    cardBody.appendChild(addToPlaylistButton);

    card.appendChild(cardBody);
    col.appendChild(card);

    return col;
  }

  // Handling movie results
  if (results.movies && results.movies.length > 0) {
    results.movies.forEach(function (meta) {
      const cardCol = createCard(meta, "movie");
      movieRow.appendChild(cardCol);
    });
  } else {
    movieRow.innerHTML = "<p>No movie results found.</p>";
  }

  // Handling series results
  if (results.series && results.series.length > 0) {
    results.series.forEach(function (meta) {
      const cardCol = createCard(meta, "series");
      seriesRow.appendChild(cardCol);
    });
  } else {
    seriesRow.innerHTML = "<p>No series results found.</p>";
  }

  document.getElementById("clearButton").style.display = "block";
}

function clearSearchResults() {
  const searchResultsContainer = document.getElementById("searchResults");

  document.getElementById("searchMovies").innerHTML = "";
  document.getElementById("searchSeries").innerHTML = "";

  searchResultsContainer.style.display = "none";

  document.getElementById("search").value = "";
  document.getElementById("clearButton").style.display = "none";
}

// Event listeners
document.addEventListener("DOMContentLoaded", function () {
  var userForm = document.getElementById("userForm");
  if (userForm) {
    userForm.addEventListener("submit", handleUserFormSubmission);
  }

  var playlistForm = document.getElementById("playlistForm");
  if (playlistForm) {
    playlistForm.addEventListener("submit", handlePlaylistFormSubmission);
  }

  var searchForm = document.getElementById("searchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", handleSearchFormSubmission);
  }

  var backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", function () {
      window.location.href = "/playlists";
    });
  }

  var clearButton = document.getElementById("clearButton");
  if (clearButton) {
    clearButton.addEventListener("click", clearSearchResults);
  }

  var editPlaylistForm = document.getElementById("editPlaylistForm");
  if (editPlaylistForm) {
    editPlaylistForm.addEventListener(
      "submit",
      handleEditPlaylistFormSubmission,
    );
  }

  loadPlaylists();
});

// Function to handle the submission of the edit playlist form
async function handleEditPlaylistFormSubmission(event) {
  event.preventDefault();

  // Get the updated values from the form
  const editedName = document.getElementById("editPlaylistName").value;
  const editedOrderInput = document.getElementById("editPlaylistOrder");
  const editedOrder = parseInt(editedOrderInput.value, 10);
  const editedColor = document.getElementById("editPlaylistColor").value;

  // Send a request to the server to update the playlist details
  try {
    const response = await editPlaylist(editedName, editedOrder, editedColor);
    alert("Playlist updated successfully");
    loadPlaylists(); // Reload playlists to reflect changes
    const editModal = new bootstrap.Modal(
      document.getElementById("editPlaylistModal"),
    );
    editModal.hide();
  } catch (error) {
    console.error("Error updating playlist:", error);
    alert("Error updating playlist");
  }
}

// Validate playlist ordering values
function handleInput(event) {
  const inputElement = event.target;

  // Ensure the input is valid and not empty
  if (inputElement.validity.valid && inputElement.value !== "") {
    // Parse the input value as an integer to drop the decimal part
    const intValue = parseInt(inputElement.value, 10);

    // Set the input value without the decimal part
    inputElement.value = intValue;
  }
}
