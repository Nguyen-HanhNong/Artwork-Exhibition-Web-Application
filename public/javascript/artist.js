/* File: artist.js */
/* Author: Nguyen-Hanh Nong */
/* Purpose: This file is the client-side javascript that has to deal with artists including the following of artists and enrolling of workshops */

let artistData; //stores data from the server regarding artist and other stuff 

/* Onload event for the specific-artist page, sends a GET request to the server to get artist data and other data */
function init() {
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      artistData = JSON.parse(this.responseText);
      renderPage(); //After data is received, render hte page 
    }
  };

  xhttp.open("GET", location.href);
  xhttp.setRequestHeader('Accept', 'application/json'); 
	xhttp.send();
}

/* This function renders the lists that are displayed on the specific-artist.pug page */
function renderPage() {
  const artworkData = artistData.artwork;
  const workshopData = artistData.workshop;

  let artworkString = "";
  let workshopString = "";

  /* Iterate through the artwork and show them as a link on the webpage */
  artworkData.forEach(artwork => {
    artworkString += `<li><a href="/artwork/${artwork._id}">${artwork.name}</a></li>`;
  });

  /* Iterate through the workshop data and display them as a list item with a button next to it, which should display unenroll or enroll depending on whether they are currently enrolled in the workshop yet */
  workshopData.forEach(workshop => {
    if (hasEnrolled(workshop._id) == true) {
      workshopString += `<li>${workshop.title}<button type="button" value=${workshop._id} onclick="changeWorkshopStatus(this)">Unenroll</button></li>`; 
    }
    else {
      workshopString += `<li>${workshop.title}<button type="button" value=${workshop._id} onclick="changeWorkshopStatus(this)">Enroll</button></li>`; 
    }
  });

  /* Render the changes with innerHTML */
  document.getElementById("artist-artwork-list").innerHTML = artworkString;
  document.getElementById("artist-workshop-list").innerHTML = workshopString;

  /* Change the value/text on the follow button depending on whether the user follows the artist */
  if (hasFollowed() == true) {
    document.getElementById("follow-button").innerHTML = "Unfollow";
  }
  else {
    document.getElementById("follow-button").innerHTML = "Follow";
  }
}

/* This function determines whether a user is enrolled in the workshop that artist hosts */
function hasEnrolled(compareWorkshopID) {
  let hasEnrolled = false;

  /* Iterate through every workshop the user is enrolled in and check if one of them matche*/
  artistData.user.workshops.forEach(enrolledWorkshop => {
    if (enrolledWorkshop == compareWorkshopID) {
      hasEnrolled = true;
    }
  });

  return hasEnrolled;
}

/* This function determines whether a user has followed the current artist */
function hasFollowed() {
  let hasFollowed = false;

  /* Iterate through every followed artist of the user and checks if one of those artists is the current artist */
  artistData.user.following.forEach(followedArtist => {
    if (followedArtist == artistData.artist._id) {
      hasFollowed = true;
    }
  });

  return hasFollowed;
}

/* This function changes the follow/unfollow status of the user by sending a request to the server to update the follow status of the user */
function changeFollowStatus() {
  /* Save the artist we're trying to follow/unfollow in an object */
  let sendObject = {};
  sendObject["artist"] = artistData.artist;
  const sendObjectJSON = JSON.stringify(sendObject);

  /* Check if the user is trying to unfollow or trying to follow the artist */
  if (hasFollowed() == true) {
    /* If the user is trying to unfollow the artist, then we want to set a DELETE request to the server so it can delete the instance of the artist in the User's schema  */
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 201) {
        alert(`You are no longer following ${artistData.artist.username}. This means you will not receive notficiations when the artist adds new artwork or adds new workshops!`);
        init();
      }
    };

    xhttp.open("DELETE", "/artist/following");
    xhttp.setRequestHeader('Content-Type', 'application/json'); 
    xhttp.send(sendObjectJSON);
  }
  else {
    /* If the user is trying to follow the artist, we want to send a POST request to try and add the artist to the user's array of followers */
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 201) {
        alert(`You are now following ${artistData.artist.username}. This means you will receive notficiations when the artist adds new artwork or adds new workshops!`);
        init();
      }
    };

    xhttp.open("POST", "/artist/following");
    xhttp.setRequestHeader('Content-Type', 'application/json'); 
    xhttp.send(sendObjectJSON);
  }
}

/* This function tries to change the workshop enroll status of the user for a specific workshop in a specific artist's workshop list */
function changeWorkshopStatus(enrollButton) {

  /* Save the workshop and store it in an object alongside the artist that the workshop corresponds with */
  const workshopID = enrollButton.value;

  let sendObject = {};
  sendObject["workshop_id"] = workshopID;
  sendObject["artist"] = artistData.artist;
  const sendObjectJSON = JSON.stringify(sendObject);

  /* Check if the user is trying to enroll or unenroll in a workshop */
  if (hasEnrolled(workshopID) == true) {
    /* If the user is trying to unenroll from a workshop, then send a DELETE request to the server to remove the workshop frmo the array of workshops in the User schema */
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 204) {
        alert("You are successfully unerolled in the workshop!");
        init();
      }
    };

    xhttp.open("DELETE", "/artist/workshop");
    xhttp.setRequestHeader('Content-Type', 'application/json'); 
    xhttp.send(sendObjectJSON);
  }
  else {
    /* If the user is trying to enroll from a workshop, then send a POST request to the server to add the workshop the User's array of workshop */
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 201) {
        alert("You are successfully enrolled in the workshop!");
        init();
      }
    };

    xhttp.open("POST", "/artist/workshop");
    xhttp.setRequestHeader('Content-Type', 'application/json'); 
    xhttp.send(sendObjectJSON);
  }
}