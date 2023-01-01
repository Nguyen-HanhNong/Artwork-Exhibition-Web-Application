/* File: user-router.js */
/* Author: Nguyen-Hanh Nong */
/* Purpose: This file is the router which deals with all the routes that start with the /user URL. */

/* Importing the necessary libraries and schemas */
const express = require('express');
const schemas = require('../public/javascript/mongo-schemas.js');

let router = express.Router();
let User = schemas.User;
let Notification = schemas.Notification;

/* All the routes which are supported by the router */
router.get('/notification', getNotification);

router.get('/following', getFollowers);

router.put('/artist', updateArtistProperty);

/* This function gets all the notification obejcts for the current user */
function getNotification(req, res, next) {
  /* Check if the user is logged in, if they are not, then display an error message and exit the function */
  if (!req.session.loggedin) {
		res.status(401).send("Not authorized. You need to be logged in to have notifications");
		return;
  };

  /* Find all the notifications which contain the current user's id */
  Notification.find({ receiver: { $in: [req.session.userID] } }, function (error, notificationArray) {
    /* If there is an error when querying, print the error and then send a 500 request. */
    if (error) {
      console.log(error);
      res.status(500).send("Error querying for notifications!");
      return;
    }

    /* Send a 200 response with the notifications */
    res.status(200).send(notificationArray);
  });
}

/* This function gets all the artists the current user is following and sends them to the client */
function getFollowers(req, res, next) {
  /* Check if the user is logged in, if they are not, then display an error message and exit the function */
  if (!req.session.loggedin) {
		res.status(401).send("Not authorized. You need to be logged in to have followers");
		return;
  };

  /* Find the object representation of the current user in the database */
  User.findById(req.session.userID, function (error, currentUser) {
    /* If there is an error when querying, print the error and then send a 500 request. */
    if (error) {
      console.log(error);
      res.status(500).send("Error querying for current user!");
      return;
    }

    /* Find all the artists the user follows and store their object representation */
    User.find({ _id: { $in: currentUser.following } }, function (error, arrayOfFollowers) {
      /* If there is an error when querying, print the error and then send a 500 request. */
      if (error) {
        console.log(error);
        res.status(500).send("Error querying for followers for current user!");
        return;
      }

      /* Send a 200 request along with the array representation of the artist the user follows */
      res.status(200).send(arrayOfFollowers);
    });
  });
}

/* This function updates the artist property to either a patron or artist in the database */
function updateArtistProperty(req, res, next) {
  /* Check if the user is logged in, if they are not, then display an error message and exit the function */
  if (!req.session.loggedin) {
		res.status(401).send("Not authorized. You need to be logged in to change account status");
		return;
  };

  /* Get the object the server recieved from the client */
  const receivedObject = req.body;

  /* Find the current user's object representation in the database and update the is_artist property to whatever the user sent */
  User.findByIdAndUpdate(req.session.userID, { is_artist: receivedObject.is_artist }, function (error, result) {
    /* If there is an error when querying or updating, print the error and then send a 500 request. */
    if (error) {
      console.log(error);
      res.status(500).send("Error updating the artist property of the user!");
      return;
    }

    /* Update the session is_artist variable to the new one */
    req.session.is_artist = receivedObject.is_artist;
    
    /* Send a 200 response indicating a successful update of the artist property of the user */
    res.status(200).send("Successfully updated the artist property of the User!");
  });
}

module.exports = router;