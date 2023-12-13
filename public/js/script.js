//script.js

// Functions
async function handleUserFormSubmission(event) {
  event.preventDefault(); // Prevent the default form submission

  const userName = document.getElementById("userName").value;
  try {
    const response = await createUser(userName);
    if (response && response.userId) {
      localStorage.setItem("userId", response.userId);
      showBootstrapAlert(
        "User created successfully. User ID: " + response.userId,
        "success",
      );

      // Redirect to playlists page
      window.location.href = "/playlists";
    }
  } catch (error) {
    console.error("Error creating user:", error);
    showBootstrapAlert("Error creating user", "danger");
  }
}

function applySorting(playlistId) {
  const filterMovies = document.getElementById("filterMovies").checked;
  const filterSeries = document.getElementById("filterSeries").checked;
  const selectedGenre = document.getElementById("genreSelect").value;

  console.log("Genre selected:", selectedGenre); // Check the retrieved genre value

  let type = "";
  if (filterMovies && filterSeries) {
    type = "";
  } else if (filterMovies) {
    type = "movie";
  } else if (filterSeries) {
    type = "series";
  }
  genre = selectedGenre;

  console.log("Type selected:", type); // Check the type value

  loadPlaylistItems(playlistId, type, genre);
}

// Function to handle the playlist creation form submission
async function handlePlaylistFormSubmission(event) {
  event.preventDefault();
  const playlistName = document.getElementById("playlistName").value;
  const userId = localStorage.getItem("userId");

  try {
    const response = await createPlaylist(playlistName, userId);
    if (response) {
      showBootstrapAlert(`${playlistName} created successfully`, "success");
      loadPlaylists(); // Reload the playlist display
    }
  } catch (error) {
    console.error("Error creating playlist:", error);
    showBootstrapAlert("Error creating playlist", "danger");
  }
}

// Function to handle the search form submission
async function handleSearchFormSubmission(event) {
  event.preventDefault(); // Prevent the default form submission
  const searchInput = document.getElementById("search").value;
  const playlistId = document.getElementById("playlistId").value;

  try {
    const searchResults = await searchCinemeta(searchInput);
    if (searchResults.movies && searchResults.movies.length == 0) {
      showBootstrapAlert("No movie results found.", "danger");
    }

    if (searchResults.series && searchResults.series.length == 0) {
      showBootstrapAlert("No series results found.", "danger");
    }
    loadSearchResults(searchResults, playlistId);
  } catch (error) {
    console.error("Error searching:", error);
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
        a.textContent = `${playlist.playlist_order}. ${playlist.playlist_name}`;
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
            showBootstrapAlert(
              `${playlist.playlist_name} deleted successfully`,
              "success",
            );
            loadPlaylists(); // Reload playlists to reflect changes
          } catch (error) {
            console.error("Error deleting playlist:", error);
            showBootstrapAlert("Error deleting playlist", "danger");
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
                showBootstrapAlert(
                  `${playlist.playlist_name} updated successfully`,
                  "success",
                );
                loadPlaylists(); // Reload playlists to reflect changes
                editModal.hide();
              } catch (error) {
                console.error("Error updating playlist:", error);
                showBootstrapAlert("Error updating playlist", "danger");
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
    let items = await getPlaylistItems(playlistId, typeFilter, genreFilter);
    const itemsContainer = document.getElementById("playlistItems");
    itemsContainer.innerHTML = "";

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
  card.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.3)";

  if (item.metadata && item.metadata.poster) {
    const img = document.createElement("img");
    img.src = item.metadata.poster;
    img.alt = item.metadata.name;
    img.className = "card-img-top";
    img.style.width = "100%";
    img.style.height = "300px";
    img.style.objectFit = "cover";
    img.style.objectPosition = "center";
    card.appendChild(img);
  }

  const cardBody = document.createElement("div");
  cardBody.className = "card-body";

  const title = document.createElement("h5");
  title.className = "card-title";
  title.textContent = item.metadata.name;
  title.style.maxWidth = "100%"; // Ensure the title does not exceed the card width
  title.style.textOverflow = "ellipsis"; // Add ellipsis when text overflows
  title.style.overflow = "hidden"; // Hide text that overflows the element's box
  title.style.whiteSpace = "nowrap"; // Prevents the text from wrapping
  title.style.fontWeight = "bold";
  title.style.fontSize = "1.2rem";
  cardBody.appendChild(title);
  cardBody.style.backgroundColor = "#f8f9fa";
  cardBody.style.padding = "10px";
  cardBody.style.borderRadius = "15px";

  // Create an "info" button
  const infoButton = document.createElement("button");
  infoButton.className = "btn btn-secondary me-1";
  infoButton.textContent = "Info";
  infoButton.addEventListener("click", function () {
    // Set the movie info in the modal body
    const modalBody = document.querySelector("#movieInfoModal .modal-body");
    // Create a container for the trailers
    const trailerContainer = document.createElement("div");

    if (item.metadata.trailers && item.metadata.trailers.length > 0) {
      for (let i = 0; i < 1; i++) {
        const trailer = item.metadata.trailers[i];
        const trailerEmbed = document.createElement("iframe");
        trailerEmbed.width = "470";
        trailerEmbed.height = "315";
        trailerEmbed.src = `https://www.youtube.com/embed/${trailer.source}?si=pmz4rzDGU4-ScGmN`;
        trailerEmbed.title = "YouTube video player";
        trailerEmbed.frameBorder = "0";
        trailerEmbed.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        trailerEmbed.allowFullscreen = true;
        trailerEmbed.style.borderRadius = "15px";
        trailerContainer.appendChild(trailerEmbed);
      }
    } else {
      const noTrailerText = document.createElement("p");
      noTrailerText.textContent = "No trailers available.";
      trailerContainer.appendChild(noTrailerText);
    }
    modalBody.innerHTML = `
      <div style="background-color: #f0f0f0; padding: 10px; border-radius: 10px;">
      <img src="${item.metadata.logo || item.metadata.poster}" alt="${
        item.metadata.name
      }" class="img-fluid" style="max-height: 200px; border-radius: 10px;">
    </div>
    <h4>Details</h4>
    <div style="background-color: #f0f0f0; padding: 10px; border-radius: 10px;">
      <p><strong>Name:</strong> ${item.metadata.name || "N/A"}</p>
      <p><strong>Imdb Rating:</strong> ${item.metadata.imdbRating || "N/A"}</p>
      <p><strong>Description:</strong> ${item.metadata.description || "N/A"}</p>
      <p><strong>Genres:</strong> ${item.metadata.genre || "N/A"}</p>
      <p><strong>Cast:</strong> ${item.metadata.cast || "N/A"}</p>
      <p><strong>Director:</strong> ${item.metadata.director || "N/A"}</p>
      <p><strong>Writers:</strong> ${item.metadata.writer || "N/A"}</p>
      <p><strong>Release Year:</strong> ${
        item.metadata.releaseInfo || "N/A"
      }</p>
      <p><strong>Awards:</strong> ${item.metadata.awards || "N/A"}</p>
       </div>
       <h4>Trailer</h4>
     `;
    modalBody.appendChild(trailerContainer);

    // Show the modal
    const movieInfoModal = new bootstrap.Modal(
      document.getElementById("movieInfoModal"),
    );
    movieInfoModal.show();
  });
  cardBody.appendChild(infoButton);

  const deleteButton = document.createElement("button");
  deleteButton.className = "btn btn-danger";
  deleteButton.textContent = "Delete";
  deleteButton.onclick = async function () {
    try {
      await deletePlaylistItem(item.playlist_id, item.id);
      showBootstrapAlert(
        `${item.metadata.name || "N/A"} deleted successfully`,
        "success",
      );
      loadPlaylistItems(item.playlist_id); // Reload the playlist items
    } catch (error) {
      showBootstrapAlert(
        `Error deleting ${item.metadata.name || "N/A"}`,
        "danger",
      );
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
  document.getElementById("clearButton").style.display = "block";
  const hasResults = results.movies.length > 0 || results.series.length > 0;
  searchResultsContainer.style.display = hasResults ? "block" : "none";

  searchMoviesContainer.innerHTML = "<div class='row'></div>";
  searchSeriesContainer.innerHTML = "<div class='row'></div>";

  const movieRow = searchMoviesContainer.querySelector(".row");
  const seriesRow = searchSeriesContainer.querySelector(".row");

  // Handling movie results
  if (results.movies && results.movies.length > 0) {
    results.movies.forEach(function (meta) {
      const cardCol = createCard(meta, "movie");
      movieRow.appendChild(cardCol);
    });
  }

  // Handling series results
  if (results.series && results.series.length > 0) {
    results.series.forEach(function (meta) {
      const cardCol = createCard(meta, "series");
      seriesRow.appendChild(cardCol);
    });
  }

  // Function to handle adding items to the playlist
  async function handleAddToPlaylist(meta, contentType) {
    try {
      const response = await addPlaylistItem(playlistId, meta.id, contentType);
      showBootstrapAlert(
        `${meta.name || "N/A"} added to playlist successfully`,
        "success",
      );
      loadPlaylistItems(playlistId);
    } catch (error) {
      console.error("Error adding to playlist:", error);
      if (error.response && error.response.status === 400) {
        showBootstrapAlert(
          `${meta.name || "N/A"} is already in the playlist`,
          "danger",
        );
      } else {
        showBootstrapAlert(
          `Error adding ${meta.name || "N/A"} to playlist`,
          "danger",
        );
      }
    }
  }

  // Function to create a card inside a grid column
  function createCard(meta, contentType) {
    const col = document.createElement("div");
    col.className = "col-md-2 mb-3";

    const card = document.createElement("div");
    card.className = "card h-100";
    card.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.3)";

    if (meta.poster) {
      const img = document.createElement("img");
      img.src = meta.poster;
      img.alt = meta.name + " poster";
      img.className = "card-img-top";
      img.style.width = "100%";
      img.style.height = "300px";
      img.style.objectFit = "cover";
      img.style.objectPosition = "center";
      card.appendChild(img);
    }

    const cardBody = document.createElement("div");
    cardBody.className = "card-body";

    const title = document.createElement("h5");
    title.className = "card-title";
    title.textContent = meta.name;
    title.style.maxWidth = "100%"; // Ensure the title does not exceed the card width
    title.style.textOverflow = "ellipsis"; // Add ellipsis when text overflows
    title.style.overflow = "hidden"; // Hide text that overflows the element's box
    title.style.whiteSpace = "nowrap"; // Prevents the text from wrapping
    title.style.fontWeight = "bold";
    title.style.fontSize = "1.2rem";
    cardBody.appendChild(title);
    cardBody.style.backgroundColor = "#f8f9fa";
    cardBody.style.padding = "10px";
    cardBody.style.borderRadius = "15px";

    // Create an "info" button
    const infoButton = document.createElement("button");
    infoButton.className = "btn btn-secondary me-1";
    infoButton.textContent = "Info";
    infoButton.addEventListener("click", function () {
      // Set the movie info in the modal body
      const modalBody = document.querySelector("#movieInfoModal .modal-body");

      // Create a container for the trailers
      const trailerContainer = document.createElement("div");

      if (meta.trailers && meta.trailers.length > 0) {
        for (let i = 0; i < 1; i++) {
          const trailer = meta.trailers[i];
          const trailerEmbed = document.createElement("iframe");
          trailerEmbed.width = "470";
          trailerEmbed.height = "315";
          trailerEmbed.src = `https://www.youtube.com/embed/${trailer.source}?si=pmz4rzDGU4-ScGmN`;
          trailerEmbed.title = "YouTube video player";
          trailerEmbed.frameBorder = "0";
          trailerEmbed.allow =
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
          trailerEmbed.allowFullscreen = true;
          trailerEmbed.style.borderRadius = "15px";
          trailerContainer.appendChild(trailerEmbed);
        }
      } else {
        const noTrailerText = document.createElement("p");
        noTrailerText.textContent = "No trailers available.";
        trailerContainer.appendChild(noTrailerText);
      }

      modalBody.innerHTML = `
        <div style="background-color: #f0f0f0; padding: 10px; border-radius: 10px;">
          <img src="${meta.logo || meta.poster}" alt="${
            meta.name
          }" class="img-fluid" style="max-height: 200px; border-radius: 10px;">
        </div>
        <p></p>
          <h4>Details</h4>
        <div style="background-color: #f0f0f0; padding: 10px; border-radius: 10px;">
          <p><strong>Name:</strong> ${meta.name || "N/A"}</p>
          <p><strong>Imdb Rating:</strong> ${meta.imdbRating || "N/A"}</p>
          <p><strong>Description:</strong> ${meta.description || "N/A"}</p>
          <p><strong>Genres:</strong> ${meta.genre || "N/A"}</p>
          <p><strong>Cast:</strong> ${meta.cast || "N/A"}</p>
          <p><strong>Director:</strong> ${meta.director || "N/A"}</p>
          <p><strong>Writers:</strong> ${meta.writer || "N/A"}</p>
          <p><strong>Release Year:</strong> ${meta.releaseInfo || "N/A"}</p>
          <p><strong>Awards:</strong> ${meta.awards || "N/A"}</p>
        </div>
        <h4>Trailer</h4>
      `;

      modalBody.appendChild(trailerContainer);

      // Show the modal
      const movieInfoModal = new bootstrap.Modal(
        document.getElementById("movieInfoModal"),
      );
      movieInfoModal.show();
    });
    cardBody.appendChild(infoButton);

    const addToPlaylistButton = document.createElement("button");
    addToPlaylistButton.className = "btn btn-primary";
    addToPlaylistButton.textContent = "Add";
    addToPlaylistButton.addEventListener("click", function () {
      handleAddToPlaylist(meta, contentType);
    });
    cardBody.appendChild(addToPlaylistButton);

    card.appendChild(cardBody);
    col.appendChild(card);

    return col;
  }
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

  loadPlaylists();
});

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

function showBootstrapAlert(message, type = "info") {
  const alertContainer = document.getElementById("alert-container");
  const alert = document.createElement("div");
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.role = "alert";
  alert.innerHTML = `
    ${message}
  `;

  alertContainer.appendChild(alert);

  // Automatically dismiss the alert after 5 seconds
  setTimeout(() => {
    alert.remove();
  }, 2000);
}
