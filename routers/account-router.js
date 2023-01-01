/* File: account-router.js */
/* Author: Nguyen-Hanh Nong */
/* Purpose: This file is the router which deals with all the routes that start with the /account URL. */
/* Note: The majority of this code is taken from the router files from Mongoose Store code from Brightspace */

/* Importing express and the schemas */
const express = require('express');
const schemas = require('../public/javascript/mongo-schemas.js')

let router = express.Router();
let User = schemas.User;

/* All the different routes that are supported by the router */
router.get("/login", getLoginPage);
router.post("/login", checkLogin);

router.get("/create", getCreateAccountPage);
router.post("/create", createAccount);

router.get("/logout", logoutAccount);

router.get("/", getAccountHomePage);

/* This function returns the home page of the user's account or the user object itself depending on the accept header of the request */
function getAccountHomePage(req, res, next) {
  /* Check if the user is logged in, if they are not, then display an error message and exit the function */
  if (!req.session.loggedin) {
		res.status(401).send("Not authorized. You need to be login to access your account page");
		return;
  };

  /* Try to find the User object that matches the id of the current user */
  User.findById(req.session.userID, function (error, result) {
    /* If there is an error hwne querying, print the error and then send a 500 request. */
    if (error) {
      console.log(error);
      res.status(500).send("Unknown User ID");
      return;
    }
    /* Check the accept header of the request, if its html then return the web page displaying the account of the user and if its application/json, then return the user object */
    res.format({
      "text/html": () => {
        res.render("pages/account-home", {user: result, is_artist: req.session.is_artist });
      },
      "application/json": () => {
        res.status(200).json({ result });
      }
    });
  });
}

/* This function displays the login webpage */
function getLoginPage(req, res, next) {
  res.status(200).render("pages/account-login");
}

/* This function displays the crete account webpage */
function getCreateAccountPage(req, res, next) {
  res.render("pages/account-create");
}

/* This function checks if the user's credentials are a valid login credential */
function checkLogin(req, res, next) {
  /* Check if the user is already logged in, if they are then just send a 200 request and exit the function */
  if (req.session.loggedin) {
		res.status(200).send("Already logged in.");
		return;
  };

  /* Query through the database and try to find a matching user with the username and password */
  User.findOne({ username: req.body.username, password: req.body.password }, function (err, result) {
    /* If there is an error hwne querying, print the error and then send a 500 request. */
    if (err) {
      console.log(err);
      res.status(500).send("Something went wrong while querying the database");
      return;
    }
    /* If there is no match, then send a 400 request indicating that the username and password don't match an account and then exit the function */
    else if (!result) {
      res.status(400).send("No user matches the sign-in credentials");
      return;
    }

    /* Save the loggedin, username, userID and is_artist paramaters of the User in the session */
    req.session.loggedin = true;
    req.session.username = result.username;
    req.session.userID = result.id;
    req.session.is_artist = result.is_artist;

    res.status(200).send("Successful login!");
    return;
  });
}

/* This function attempts to create a User object in the database that corresponds to a username and password sent from the client */
function createAccount(req, res, next) {
  /* Check if the user is already logged in, if they are then just send a 200 request and exit the function */
  if (req.session.loggedin) {
		res.status(200).send("Cannot create an account when you're already logged in!");
		return;
  };

  /* Create a new user with the username and password from the request */
  const newUser = new User({ username: req.body.username, password: req.body.password });

  /* Attempt to save the user into the User collection in the database */
  newUser.save(function (err, result) {
    /* If there is an error when saving then print the error messages and then send a 401 request */
    if(err){
      console.log("Error Message:     " + err.message);
      //err.errors is an array of ValidatorErrors
      for(x in err.errors){
        console.log("error kind:    " + err.errors[x].kind);
        console.log("error message: " + err.errors[x].message);
        console.log("error path:    " + err.errors[x].path);
        console.log("error value:   " + err.errors[x].value);
      }
      res.status(401).send("Invalid credentials.");
      return;
    }

    /* Save the loggedin, username, userID and is_artist paramaters of the User in the session */
    req.session.loggedin = true;
    req.session.username = req.body.username;
    req.session.userID = result.id;
    req.session.is_artist = result.is_artist;
    
    res.status(201).send("Account successfully created!");
    return;
  });
}

/* This function attempts to log the user out of their account and redirect them back to the home page of the program */
function logoutAccount(req, res, next) {
  /* Check if the user is already logged in, if they are then just send a 200 request and exit the function */
  if (!req.session.loggedin) {
		res.status(200).send("Not authorized. Cannot logout while not logged in.");
		return;
  };

  /* Attempt to destroy the session to log the user out */
  req.session.destroy(function (error, result) {
    /* If there is an error then print the error and the send a 500 response */
    if (error) {
      console.log(error);
      res.status(500).send("Unexpected error logging out of account!");
    }

    /* If the destroy operation was succesful then redirect the user back to the home page */
    res.redirect(`/`);
  });
}

module.exports = router;