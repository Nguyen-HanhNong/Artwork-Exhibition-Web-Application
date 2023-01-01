/* File: workshop.js */
/* Author: Nguyen-Hanh Nong */
/* Purpose: This file is the client-side javascript that has to deal with the workshops including the adding of workshops to the server. */

/* This function sends a request to the server to add a workshop */
function addWorkshop() {
  /* Get the title of the workshop from the webpage and store it in an object so it can be sent to the server */
  const workshopTitle = document.getElementById("title-input").value;
  let sendObject = {};
  sendObject["title"] = workshopTitle;
  const sendObjectJSON = JSON.stringify(sendObject);

  /* Send a POST request to the server so the workshop can be added */
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    /* If the request was successful, then display an alert indicating the success and then redirect the user back to their account home page. */
    if (this.readyState == 4 && this.status == 201) {
      alert("The workshop has been successfully added!");
      location.href = "/account/";
    }
    /* If the request was unsuccessful, then display the error message as an alert and then exit the function */
    else if (this.readyState == 4 && this.status == 400) {
      alert("Your workshop title is empty or invalid. Try again!");
      return;
    }
  };

  xhttp.open("POST", "/artist/workshop/new");
  xhttp.setRequestHeader('Content-Type', 'application/json'); 
  xhttp.send(sendObjectJSON);
}