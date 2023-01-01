/* File: account.js */
/* Author: Nguyen-Hanh Nong */
/* Purpose: This file is the client-side javascript that has to deal with account creation or account login */

/* This function is the onClick event for the createAccount button, which sends a request to the server to create a new account with the username and password credentials passed in. */
function createAccount() {
  /* Get the username and password from the webpage */
  const username = document.getElementById("username-input").value;
  const password = document.getElementById("password-input").value;

  /* Create an object to send to the server which stores the username and password of the user */
  let sendObject = {};
  sendObject["username"] = username;
  sendObject["password"] = password;

  const sendObjectJSON = JSON.stringify(sendObject);

  /* Send a POST request to the server to try and create the new user's account. */
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    /* Check if the request came back successful, if it did then indicate that the request came back successful and redirect the user to their account home page. */
    if (this.readyState == 4 && this.status == 201 || this.readyState == 4 && this.status == 200) {
      alert("Account creation was successful! Time to redirect you to your account page!");
      location.href = "/account/";
    }
    /* If the request came back unsuccesful, then print hte error to the webpage and exit the function */
    else if (this.readyState == 4 && this.status == 401) {
      alert("You cannot create an account with this username! This username already exists on the database!");
      return;
    }
  };
  
  xhttp.open("POST", "/account/create");
  xhttp.setRequestHeader('Content-Type', 'application/json');
  xhttp.send(sendObjectJSON); 
}

/* This function attempts to log the user into their account */
function loginAccount() {
  /* Get the username and password from the web page */
  const username = document.getElementById("username-input").value;
  const password = document.getElementById("password-input").value;

  /* Store the username and password in an object which is going to be sent to the server */
  let sendObject = {};
  sendObject["username"] = username;
  sendObject["password"] = password;

  const sendObjectJSON = JSON.stringify(sendObject);

  /* Send a POST request to the server to try and see if the account credentials match up an account stored on the server */
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    /* If the operation was successful, then alert the user and then redirect them to their account */
    if (this.readyState == 4 && this.status == 200) {
      alert("Sign in was successful! Time to redirect to your account page!");
      location.href = "/account/";
    }
    /* If the operation was unsuccesful, then alert the user of the error and then exit the function */
    else if (this.readyState == 4 && this.status == 400) {
      alert(JSON.stringify(this.responseText));
      return;
    }
  };
  
  xhttp.open("POST", "/account/login");
  xhttp.setRequestHeader('Content-Type', 'application/json');
  xhttp.send(sendObjectJSON); 
}
