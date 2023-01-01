/* File: review-router.js */
/* Author: Nguyen-Hanh Nong */
/* Purpose: This file is the router which deals with all the routes that start with the /review URL. */

/* Importing the necessary libraries and schemas */
const express = require('express');
const schemas = require('../public/javascript/mongo-schemas.js')

let router = express.Router();
let Review = schemas.Review;
let Artwork = schemas.Artwork;
let User = schemas.User;

/* All the routes which are supported by the router */
router.get("/", getAllReviewsFromUser);
router.get("/:reviewID", renderSpecificReview);

router.post("/", addReview);

router.delete("/", deleteReview);

/* This function gets all the reviews of the current user and sends them back to the client */
function getAllReviewsFromUser(req, res, next) {
  /* Check if the user is logged in, if they are not, then display an error message and exit the function */
  if (!req.session.loggedin) {
		res.status(401).send("Not authorized. You need to view specific reviews.");
		return;
  };

  /* Go through every review stored in the database and return any review that is reviewed by the current user */
  Review.find({ reviewer: req.session.username }, function (error, result) {
    /* If there is an error when querying, print the error and then send a 500 request. */
    if (error) {
      console.log(error);
      res.status(500).send("Error querying for reviews by a specific user.");
      return;
    }

    /* Send a 200 response with the reviews */
    res.status(200).send(result);
  });
}

/* This function returns HTML or JSON representation of a specific review of an artwork */
function renderSpecificReview(req, res, next) {
  /* Check if the user is logged in, if they are not, then display an error message and exit the function */
  if (!req.session.loggedin) {
		res.status(401).send("Not authorized. You need to view specific reviews.");
		return;
  };

  /* Get the ID of the review we want to find */
  const reviewID = req.params.reviewID;

  /* Find the review that matches the reviewID sent from the client */
  Review.findById(reviewID, function (error, review) {
    /* If there is an error when querying, print the error and then send a 500 request. */
    if (error) {
      console.log(error);
      res.status(500).send("Error reading specific review.");
      return;
    }

    /* Find the artwork which matches the review */
    Artwork.findById(review.artwork_id, function (error, artwork) {
      /* If there is an error when querying, print the error and then send a 500 request. */
      if (error) {
        console.log(error);
        res.status(500).send("Error reading specific artwork.");
        return;
      }

      /* If the user's accept header is text/html, then render the review on the review-specific pug file. If the accept header is application/json then send the json representation of the review and the corresponding artwork. */
      res.format({
        "text/html": () => { res.render("pages/review-specific", { review: review, artwork: artwork, is_artist: req.session.is_artist }); },
        "application/json": () => {
          res.status(200).json({ "review": review, "artwork": artwork });
        }
      });
    });
  });
}

/* This function adds a review for a specific artwork to the database */
function addReview(req, res, next) {
  /* Check if the user is logged in, if they are not, then display an error message and exit the function */
  if (!req.session.loggedin) {
		res.status(401).send("Not authorized. You need to view specific reviews.");
		return;
  };

  /* Store the object received from the client */
  const receivedObject = req.body;
  
  /* Create a new review object with the information from the client */
  const newReview = new Review({ reviewer: req.session.username, content: receivedObject.contents, artwork_id: receivedObject.artwork_id });

  /* Save the review into the database */
  newReview.save(function (err, savedReview) {
    /* If there is an error when saving, print the error and then send a 400 request. */
    if(err){
      console.log("Error Message:     " + err.message);
      //err.errors is an array of ValidatorErrors
      for(x in err.errors){
        console.log("error kind:    " + err.errors[x].kind);
        console.log("error message: " + err.errors[x].message);
        console.log("error path:    " + err.errors[x].path);
        console.log("error value:   " + err.errors[x].value);
      }
      res.status(400).send("Invalid review properties.");
      return;
    }
    
    /* Find the user who reviewed the artwork and add the review to their reviews array */
    User.findOneAndUpdate({ username: req.session.username }, {
      $push: {
        reviews: savedReview,
      }
    }, function (error, result) {
      /* If there is an error when querying or updating, print the error and then send a 500 request. */
      if (error) {
        console.log(error);
        res.status(500).send("There was an error with removing the adding the review to the User.");
        return;
      }

      /* Send a 201 request indicating a succesful review adding */
      res.status(201).send(result);
    });
  });
}

/* This function removes a review from the database and corresponding user */
function deleteReview(req, res, next) {
  /* Check if the user is logged in, if they are not, then display an error message and exit the function */
  if (!req.session.loggedin) {
		res.status(401).send("Not authorized. You need to view specific reviews.");
		return;
  };

  /* Store the object received from the client */
  const receivedObject = req.body;

  /* Find the review that matches the id sent from the client and delete it from the database */
  Review.findByIdAndDelete(receivedObject.review_id, function (error, removedReview) {
    /* If there is an error when querying or deleting, print the error and then send a 500 request. */
    if (error) {
      console.log(error);
      res.status(500).send("There was an error trying to delete a review");
      return;
    }

    /* Find the user who originally did the removed review and remove the review from their reviews array */
    User.findOneAndUpdate({ username: req.session.username }, {
      $pullAll: {
        reviews: [{ _id: receivedObject.review_id }],
      }
    }, function (error, result) {
      /* If there is an error when querying or deleting, print the error and then send a 500 request. */
      if (error) {
        console.log(error);
        res.status(500).send("There was an error with removing a review from the User");
        return;
      }

      /* Send a 200 response indicating that the deletion of the review was successful */
      res.status(200).send("The review removal operation was successful!");
    });
  });

}

module.exports = router;