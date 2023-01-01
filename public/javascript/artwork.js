/* File: artwork.js */
/* Author: Nguyen-Hanh Nong */
/* Purpose: This file is the client-side javascript that has to deal with artworks including the submitting of revievws for artwork and the adding of artwork. */

let artworkAndUser; //Store data about the artwork and the user accessing

/* This function sends a request to the server to query the database on varying paramaters including artwork name and actegory */
function search() {
  /* Get the various query paramaters from the webpage  */
  const artworkNameQuery = document.getElementById("name-input").value;
  const artistNameQuery = document.getElementById("artist-input").value;
  const categoryQuery = document.getElementById("category-input").value;
  const mediumQuery = document.getElementById("medium-input").value;

  /* Create a GET request to the server to get the webpage displaying the artwork that matches the query paramaters */
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    /* If the request was succesfull, then redirec thte user to the webpage displaying the results of their search */
		if (this.readyState == 4 && this.status == 200) {
      location.href = `/artwork/list/results/?name=${artworkNameQuery}&artist=${artistNameQuery}&category=${categoryQuery}&medium=${mediumQuery}`;
		}
  };
  
  /* Send the XHTTP request to the link including all the query paramaters */
  xhttp.open("GET", `/artwork/list/results/?name=${artworkNameQuery}&artist=${artistNameQuery}&category=${categoryQuery}&medium=${mediumQuery}`);
  xhttp.setRequestHeader('Accept', 'text/html');
	xhttp.send();
}

/* This function is the on-load event for the artwork-specific.pug file */
function initSpecificArtwork() {
  /* Send a GET request to get all teh data about the artwork and the current user */
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    /* If the request was succesfull, then save the artwork and user from the server and then updating the contents on the page */
    if (this.readyState == 4 && this.status == 200) {
      artworkAndUser = JSON.parse(this.responseText);
      updatePage();
    }
  };

  xhttp.open("GET", location.href);
  xhttp.setRequestHeader('Accept', 'application/json'); 
	xhttp.send();
}

/* This function updates the contents on the artwork-specific.pug file */
function updatePage() {
  /* Update the likes-header with the current amount of likes for the artwork */
  document.getElementById("likes-header").innerHTML = `Number of Likes: ${artworkAndUser.artwork.likes}`;

  /* Update the text on the like button depending on whether the user has liked the artwork or not */
  if (hasLiked() == true) {
    document.getElementById("like-button").innerHTML = "Unlike"
  }
  else {
    document.getElementById("like-button").innerHTML = "Like"
  }

  /* Get all the reviews for the artwork and render each of them as a link on the webpage and store them in the reviews-list unordered list */
  let reviewsString = "";
  artworkAndUser.reviews.forEach(review => {
    reviewsString += `<li><a href="/review/${review._id}">Review by ${review.reviewer}</a></li>`;
  });
  document.getElementById("reviews-list").innerHTML = reviewsString;
}

/* This function checks if the user has liked the current artwork or not */
function hasLiked() {
  let hasLiked = false;

  /* Check through all the artwork the user has liked and check if the current artwork is one of them */
  artworkAndUser.user.liked.forEach(artwork => {
    if (artwork == artworkAndUser.artwork._id) {
      hasLiked = true;
    }
  });

  return hasLiked;
}

/* This function updates the likeness of the artwork, either updating the artwork to get a like from the user or removing a like. */
function changeLikeness() {

  /* Create an object and store the new liked amount and whether the user is liking the artwork or not */
  let sendObject = {};
  if (hasLiked() == true) {
    sendObject["change"] = artworkAndUser.artwork.likes - 1;
    sendObject["like"] = false;
  }
  else {
    sendObject["change"] = artworkAndUser.artwork.likes + 1;
    sendObject["like"] = true;
  }
  const sendObjectJSON = JSON.stringify(sendObject);
  
  /* Send a PUT request to the server to update the liked status of the user and to change the liked amount of the artwork  */
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    /* If the request was succesfull, then re-initialize the page to show the updated data */
    if (this.readyState == 4 && this.status == 200) {
      initSpecificArtwork();
    }
  };

  xhttp.open("PUT", `/artwork/${artworkAndUser.artwork._id}/likes`);
  xhttp.setRequestHeader('Content-Type', 'application/json'); 
	xhttp.send(sendObjectJSON);
}

/* This function submits a review for a specific artwork to the server */
function submitReview() {
  /* Get the contents of the review and the artwork we're reviewing */
  const reviewContents = document.getElementById("review-text").value;
  const artworkID = artworkAndUser.artwork._id;

  /* Check whether the reivew actually contains information, if it doesn't then display an error alert and exit the function */
  if (reviewContents.length <= 0) {
    alert("The content of your review has to be at least one letter long! Your review will not be added.");
    document.getElementById("review-text").value = "";
    return;
  }

  /* Create an object that contains the contents of the review and the ID of the artwork we're reivewing which is going to be sent to the server */
  let sendObject = {};
  sendObject["contents"] = reviewContents;
  sendObject["artwork_id"] = artworkID;

  const sendObjectJSON = JSON.stringify(sendObject);

  /* Send a POST request to the server with the review information to be added */
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    /* If the request was succesfull, then re-initialize the page to show the updated data */
    if (this.readyState == 4 && this.status == 201) {
      initSpecificArtwork();
    }
  };

  xhttp.open("POST", "/review/");
  xhttp.setRequestHeader('Content-Type', 'application/json'); 
  xhttp.send(sendObjectJSON);

  /* Empty the textarea containing the review */
  document.getElementById("review-text").value = "";
}

/* This function sends a request to the server to add an artwork */
function addArtwork() {
  /* Get all the properties of the artwork from the webpage */
  const artworkName = document.getElementById("name-input").value;
  const artworkYear = document.getElementById("year-input").value;
  const artworkCategory = document.getElementById("category-input").value;
  const artworkMedium = document.getElementById("medium-input").value;
  const artworkDescription = document.getElementById("description-input").value;
  const artworkImage = document.getElementById("image-input").value;

  /* Create an object and store all the properties of the artwork in it so it can be sent to the server */
  let sendObject = {};
  sendObject["name"] = artworkName;
  sendObject["year"] = artworkYear;
  sendObject["category"] = artworkCategory;
  sendObject["medium"] = artworkMedium;
  sendObject["description"] = artworkDescription;
  sendObject["image"] = artworkImage;

  const sendObjectJSON = JSON.stringify(sendObject);

  /* Send a POST request to the server to add the new artwork */
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    /* If the request was succesfull, then go and update the user to become an artist by calling updateUser() */
    if (this.readyState == 4 && this.status == 201) {
      updateUser();
    }
    /* If the request was unsuccesful, then send an alert with the error message and then exit the function */
    else if (this.readyState == 4 && this.status == 400) {
      alert(JSON.stringify(this.responseText));
      return;
    }
  };
  
  xhttp.open("POST", "/artwork/new/");
  xhttp.setRequestHeader('Content-Type', 'application/json');
  xhttp.send(sendObjectJSON);
}

/* This function updates the user to become an artist */
function updateUser() {
  /* Create an object and store the new is_artist property */
  let sendObject = {};
  sendObject["is_artist"] = true;
  const sendObjectJSON = JSON.stringify(sendObject);

  /* Send a PUT request to the server to update the is_artist status of the user */
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    /* If the request was succesfull, then alert the user that the new artwork was succesfully added and then redirect the user back to the user's account page */
    if (this.readyState == 4 && this.status == 200) {
      alert("New artwork was succesfully added!");
      location.href = "/account/";
    }
  };
  
  xhttp.open("PUT", "/user/artist/");
  xhttp.setRequestHeader('Content-Type', 'application/json');
  xhttp.send(sendObjectJSON);
}
