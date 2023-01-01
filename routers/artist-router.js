/* File: artist-router.js */
/* Author: Nguyen-Hanh Nong */
/* Purpose: This file is the router which deals with all the routes that start with the /artist URL. */

/* Importing the necessary libraries and schemas */
const express = require('express');
const pug = require('pug');
const schemas = require('../public/javascript/mongo-schemas.js')

let router = express.Router();
let User = schemas.User;
let Artwork = schemas.Artwork;
let Workshop = schemas.Workshop;
let Notification = schemas.Notification;

/* All the routes which are supported by the router */
router.get('/workshop/new', getAddWorkshopPage);
router.post('/workshop/new', addWorkshop);

router.post('/workshop', enrollWorkshop);
router.delete('/workshop', unEnrollWorkshop);

router.post('/following', followArtist);
router.delete('/following', unFollowArtist);

router.get('/:artistID', getArtist);

/* This function depending on the accept header of the request either renders a specific artists page or returns all the data related to the artist including the artwork and workshops related to the artist. */
function getArtist(req, res, next) {
  /* Check if the user is logged in, if they are not, then display an error message and exit the function */
  if (!req.session.loggedin) {
		res.status(401).send("Not authorized. You need to be login to  view specific artists.");
		return;
  };
  
  const artistID = req.params.artistID; //Get the id of the artist from the parameters

  /* Try and find the artist which matches the id of the artist */
  User.findById(artistID, function (error, artist) {
    /* If there is an error when querying, print the error and then send a 500 request. */
    if (error) {
      console.log(error);
      res.status(500).send("Error querying for a specific artist");
      return;
    }

    /* If that was successful, then try and find all the artwork created by the artist */
    Artwork.find({ artist: artist.username }, function (error, artworkArray) {
      /* If there is an error when querying, print the error and then send a 500 request. */
      if (error) {
        console.log(error);
        res.status(500).send("Error querying for artwork for a specific artist");
        return;
      }

      /* If that was successful, then try and find all the workshops hosted by the artist */
      Workshop.find({ host: artist.username }, function (error, workshopArray) {
        /* If there is an error when querying, print the error and then send a 500 request. */
        if (error) {
          console.log(error);
          res.status(500).send("Error querying for workshops for a specific aritst");
          return;
        }

        /* Finally, if that request was successful, then try and find the current user's object representation from the database */
        User.findById(req.session.userID, function (error, currentUser) {
          /* If there is an error when querying, print the error and then send a 500 request. */
          if (error) {
            console.log(error);
            res.status(500).send("Error querying for current user");
            return;
          }

          /* Return different things depending on the accept header of the request. If it's text/html, then render the webpage for the specific artist and pass in all the different information we've queried so far. If its application/json, then send the information we've queried so far as an object. */
          res.format({
            "text/html": () => { res.render("pages/artist-specific", { artworkArray: artworkArray, artist: artist, workshopArray: workshopArray, is_artist: req.session.is_artist, session: req.session }); },
            "application/json": () => {
              res.status(200).json({"artwork": artworkArray, "artist": artist, "workshop": workshopArray, user: currentUser });
					}});
        });
      });
    });
  })
}

/* This function attempts to enroll a User in a workshop */
function enrollWorkshop(req, res, next) {
  /* Check if the user is logged in, if they are not, then display an error message and exit the function */
  if (!req.session.loggedin) {
    res.status(401).send("Not authorized. You need to be login to enroll in workshops.");
    return;
  };

  /* Store the data send through the request */
  const receivedObject = req.body;

  /* Try to find the workshop the user is trying to enroll in */
  Workshop.findById(receivedObject.workshop_id, function (error, workshop) {
    /* If there is an error when querying, print the error and then send a 500 request. */
    if (error) {
      console.log(error);
      res.status(500).send("Error querying for a specific workshop");
      return;
    }
    
    /* Create a notification object which is going to notify the user trying to enroll about their enrollment in the specific workshop */
    let enrollNotification = new Notification({
      receiver: [req.session.userID],
      sender: receivedObject.artist.username,
      content: `You have successfully enrolled in ${workshop.title}, hosted by ${workshop.host}`,
    }); 

    /* Attempt to save the notification on the database */
    enrollNotification.save(function (error, notification) {
      /* If there is an error when saving, print the error and then send a 500 request. */
      if (error) {
        console.log(error);
        res.status(500).send("Error saving notification to collection!");
        return;
      }

      /* Now, we want to update the User who is enrolling in the workshop by adding the workshop to the workshops array in the User's schema and adding the notification for enrolling in the notifications array in the User's schema */
      User.findOneAndUpdate({ username: req.session.username }, {
        $push: { workshops: workshop, notifications: enrollNotification }
      }, function (error, result) {
        /* If there is an error when querying, print the error and then send a 500 request. */
        if (error) {
          console.log(error);
          res.status(500).send("There was an error with removing the like from the User.");
          return;
        }

        /* Send a 201 request if the enrollment in the workshop was successful */
        res.status(201).send("Enrolling in workshop was successful!");
      });
    })
  });
}

/* This function unenrolls the user from a specific workshop they were enrolled in */
function unEnrollWorkshop(req, res, next) {
  /* Check if the user is logged in, if they are not, then display an error message and exit the function */
  if (!req.session.loggedin) {
    res.status(401).send("Not authorized. You need to be login to enroll in workshops.");
    return;
  };

  /* Store the data send through the request */
  const receivedObject = req.body;

  /* Try to find the workshop the user is trying to unenroll in */
  Workshop.findById(receivedObject.workshop_id, function (error, workshop) {
    /* If there is an error when querying, print the error and then send a 500 request. */
    if (error) {
      console.log(error);
      res.status(500).send("Error querying for a specific workshop");
      return;
    }
    
    /* Create a notification object which is going to notify the user about unenrolling from a workshop */
    let enrollNotification = new Notification({
      receiver: [req.session.userID],
      sender: receivedObject.artist.username,
      content: `You have successfully unenrolled in ${workshop.title}, hosted by ${workshop.host}`,
    });

    /* Attempt to save the notification on the database */
    enrollNotification.save(function (error, notification) {
      /* If there is an error when saving the document, print the error and then send a 500 request. */
      if (error) {
        console.log(error);
        res.status(500).send("Error saving notification to collection!");
        return;
      }

      /* Now, we want to update the User who is enrolling in the workshop by removing the matching workshop from the workshops array in the User's schema and adding the notification for enrolling in the notifications array in the User's schema */
      User.findOneAndUpdate({ username: req.session.username }, {
        $push: { notifications: enrollNotification },
        $pullAll: { workshops: [{_id: receivedObject.workshop_id}], }
      }, function (error, result) {
        /* If there is an error when updating the documents, print the error and then send a 500 request. */
        if (error) {
          console.log(error);
          res.status(500).send("There was an error with removing the workshop from the User. ");
          return;
        }

        /* Send a 204 request indicating a proper delete operation */
        res.status(204).send("Unenrolling in workshop was successful!");
      });
    })
  });
}

/* This function attempts to let a User follow another artist */
function followArtist(req, res, next) {
  /* Check if the user is logged in, if they are not, then display an error message and exit the function */
  if (!req.session.loggedin) {
    res.status(401).send("Not authorized. You need to be logged in to follow artists!");
    return;
  };

  /* Store the data send through the request */
  const receivedObject = req.body;

  /* Try to find the artist the user is trying to follow in the database  */
  User.findById(receivedObject.artist._id, function (error, artistToFollow) {
    /* If there is an error when querying, print the error and then send a 500 request. */
    if (error) {
      console.log(error);
      res.status(500).send("There was an error with finding the artist to follow.");
      return;
    }

    /* Create a notification object which is going to notify the user about them following an artist now */
    let followNotification = new Notification({
      receiver: [req.session.userID],
      sender: receivedObject.artist.username,
      content: `You are now following ${artistToFollow.username}.`,
    });

    /* Save the notification in the database */
    followNotification.save(function (error, notification) {
      /* If there is an error when saving the documents, print the error and then send a 500 request. */
      if (error) {
        console.log(error);
        res.status(500).send("Error saving notification to collection!");
        return;
      }

      /* Now, we want to update the User who is following the artist by adding the artist's id to the following array in the User's schema and adding the notification for following the artist in the notifications array in the User's schema */
      User.findOneAndUpdate({ username: req.session.username }, {
        $push: { following: artistToFollow, notifications: followNotification }
      }, function (error, result) {
        /* If there is an error when updating the documents, print the error and then send a 500 request. */
        if (error) {
          console.log(error);
          res.status(500).send("There was an error with updating the follow status of the User.");
          return;
        }

        /* Send a 201 response to indicate a successful follow operation */
        res.status(201).send(`Follow request for ${artistToFollow.username} is successful!`);
      });
    });
  });
}

/* This function attempts to let a User unfollow a specific artist they're following */
function unFollowArtist(req, res, next) {
  /* Check if the user is logged in, if they are not, then display an error message and exit the function */
  if (!req.session.loggedin) {
    res.status(401).send("Not authorized. You need to be logged in to stop following artists!");
    return;
  };

  /* Store the data send through the request */
  const receivedObject = req.body;

  /* Try to find the artist the user is trying to unfollow in the database  */
  User.findById(receivedObject.artist._id, function (error, artistToStopFollowing) {
    /* If there is an error when querying, print the error and then send a 500 request. */
    if (error) {
      console.log(error);
      res.status(500).send("There was an error with finding the artist to stop following.");
      return;
    }

    /* Create a notification object which is going to notify the user about them unfollowing the artist now */
    let followNotification = new Notification({
      receiver: [req.session.userID],
      sender: receivedObject.artist.username,
      content: `You are no longer following ${artistToStopFollowing.username}.`,
    });

    /* Save the notification in the database */
    followNotification.save(function (error, notification) {
      /* If there is an error when saving the documents, print the error and then send a 500 request. */
      if (error) {
        console.log(error);
        res.status(500).send("Error saving notification to collection!");
        return;
      }

      /* Now, we want to update the User who is unfollowing the artist by removing the artist's id from the following array in the User's schema and adding the notification for following the artist in the notifications array in the User's schema */
      User.findOneAndUpdate({ username: req.session.username }, {
        $push: { notifications: followNotification },
        $pullAll: { following: [{_id: receivedObject.artist._id}], }
      }, function (error, result) {
        /* If there is an error when updating the documents, print the error and then send a 500 request. */
        if (error) {
          console.log(error);
          res.status(500).send("There was an error with trying to unfollow an artist.");
          return;
        }

        /* Send a 201 response to indicate a successful unfollow operation */
        res.status(201).send(`Removal of follow status for ${artistToStopFollowing.username} is successful!`);
      });
    });
  });
}

/* This function renders the web page that allows the artist to add a workshop */
function getAddWorkshopPage(req, res, next) {
  /* Check if the user is logged in, if they are not, then display an error message and exit the function */
  if (!req.session.loggedin) {
    res.status(401).send("Not authorized. You need to be logged in to stop following artists!");
    return;
  };
  /* Check if the user is an artist, if they are not, then display an error message and exit the function */
  if (!req.session.is_artist) {
    res.status(401).send("Not authorized. You need to be an artist to add workshops!");
    return;
  };

  /* Render the workshop-add.pug file */
  res.status(200).render("pages/workshop-add", { is_artist: req.session.is_artist });
}

/* This function attempts to add a workshop into the database and send a notification to the followers of the artist */
function addWorkshop(req, res, next) {
  /* Check if the user is logged in, if they are not, then display an error message and exit the function */
  if (!req.session.loggedin) {
    res.status(401).send("Not authorized. You need to be logged in to stop following artists!");
    return;
  }
  /* Check if the user is an artist, if they are not, then display an error message and exit the function */
  if (!req.session.is_artist) {
    res.status(401).send("Not authorized. You need to be an artist to add workshops!");
    return;
  }

  /* Save the object sent from the request and add a host parameter which is just the current user's username */
  const receivedObject = req.body;
  receivedObject["host"] = req.session.username;

  /* Check if the title of the workshop is valid, if it's not then send a 400 request back to the client and exit the function */
  if (receivedObject.title === null || receivedObject.title === "" || receivedObject.title.length === 0 || receivedObject.title.trim().length === 0 || !receivedObject.title) { 
    res.status(400).send("Invalid title");
    return;
	}
	else {
    /* Create a new workshop with the host and title parameters passed into the workshop object */
    const newWorkshop = new Workshop({
      host: receivedObject.host,
      title: receivedObject.title,
    });

    /* Save the workshop into the database */
    newWorkshop.save(function (error, workshop) {
      /* If there is an error when saving the documents, print the error and then send a 500 request. */
      if (error) {
        console.log(error);
        res.status(500).send("Error saving workshop to collection!");
        return;
      }

      /* Add the workshop into the workshop array in the artist who is hosting the workshop */
      User.findByIdAndUpdate(req.session.userID, { $push: { workshops: newWorkshop } }, function (error, currentUser) {
        /* If there is an error when updating the documents, print the error and then send a 500 request. */
        if (error) {
          console.log(error);
          res.status(500).send("Error adding workshop to artist in collection!");
          return;
        }

        /* Now, we want to find all the user's which follow the current artist/user */
        User.find({ following: [{ _id: req.session.userID }] }, function (error, arrayOfUsers) {
          /* If there is an error when querying, print the error and then send a 500 request. */
          if (error) {
            console.log(error);
            res.status(500).send("Error finding the artist followers!");
            return;
          }

          /* Create an array and store all the users's id who follow the current artist inside the array */
          let allArtistFollowers = [];

          arrayOfUsers.forEach(user => {
            allArtistFollowers.push(user._id);
          });

          /* Create a notification and put the receiver as all the people who follow the current artist */
          const workshopNotification = new Notification({
            receiver: allArtistFollowers,
            sender: req.session.username,
            content: `${req.session.username} has released a new workshop, called ${receivedObject.title}!`,
          });

          /* Save the notification in the array */
          workshopNotification.save(function (error, result) {
            /* If there is an error when saving the documents, print the error and then send a 500 request. */
            if (error) {
              console.log(error);
              res.status(500).send("Error saving new notification!");
              return;
            }
            
            /* Updates the users who are the followers of the artist by adding the notification to the users notifications array  */
            User.updateMany({ _id: { $in: allArtistFollowers } }, { $push: { notifications: workshopNotification } }, function (error, updatedUsers) {
              /* If there is an error when updating the documents, print the error and then send a 500 request. */
              if (error) {
                console.log(error);
                res.status(500).send("Error sending notifications to the followers!");
                return;
              }

              /* Send a 201 response to indicate the workshop has been properly added */
              res.status(201).send("Workshop has been successfully added!");
            })
          })
        });
      });
    });
	}
}

module.exports = router;