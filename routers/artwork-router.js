/* File: artwork-router.js */
/* Author: Nguyen-Hanh Nong */
/* Purpose: This file is the router which deals with all the routes that start with the /artwork URL. */
/* Note: The majority of this code is taken from the router files from Mongoose Store code from Brightspace */

/* Importing the necessary libraries and schemas */
const express = require('express');
const schemas = require('../public/javascript/mongo-schemas.js')

let router = express.Router();
let Artwork = schemas.Artwork;
let User = schemas.User;
let Review = schemas.Review;
let Notification = schemas.Notification;

/* All the routes which are supported by the router */
router.get("/likes/", getLikedArtwork);

router.get("/new", renderAddArtworkPage);
router.post("/new", addArtwork);

router.put("/:artworkID/likes", updateLikes);

router.get("/list/results", queryParser);
router.get("/list/results", loadArtworksDatabase);
router.get("/list/results", respondArtworks);

router.get("/list", renderSearchPage);
router.get("/:artworkID", renderSpecificArtwork);

/* This function renders the page that allows the clients to search for artwork on the website */
function renderSearchPage(req, res, next) {
	/* Check if the user is logged in, if they are not, then display an error message and exit the function */
	if (!req.session.loggedin) {
		res.status(401).send("Not authorized. You need to be login to query for artworks.");
		return;
  };

	/* Render the artwork-list.pug file */
	res.render("pages/artwork-list", { is_artist: req.session.is_artist});
}

/* This function is a middleware function which parses through all the query paramaters which are sent when searching for artwork */
function queryParser(req, res, next) {
	/* Check if the user is logged in, if they are not, then display an error message and exit the function */
	if (!req.session.loggedin) {
		res.status(401).send("Not authorized. You need to be login to query for artworks.");
		return;
	};
	
	/* The maximum amount of artwork we want displayed on the page */
	const MAX_ARTWORK = 25;
	
	//build a query string to use for pagination later
	/* Note: This was taken from the queryParser function in the products-router.js file in the Mongoose Store demo from Brightspace */
	let params = [];
	for(prop in req.query){
		if(prop == "page"){
			continue;
		}
		params.push(prop + "=" + req.query[prop]);
	}
	req.qstring = params.join("&");
	
	/* Get/create the limit of the amount of the amount of artwork we want displayed on a page */
	try{
		req.query.limit = req.query.limit || 10;
		req.query.limit = Number(req.query.limit);
		if(req.query.limit > MAX_ARTWORK){ 
			req.query.limit = MAX_ARTWORK;
		}
	}catch{
		req.query.limit = 10;
	}
	
	/* Get the page number of serach results */
	try{
		req.query.page = req.query.page || 1;
		req.query.page = Number(req.query.page);
		if(req.query.page < 1){
			req.query.page = 1;
		}
	}catch{
		req.query.page = 1;
	}

	/* Checking if there are the name, artist, category or medium query paramaters. If any of them don't exist, then set their query paramater to a question mark. */
	if(!req.query.name){
		req.query.name = "?";
	}
	if(!req.query.artist){
		req.query.artist = "?";
	}
	if(!req.query.category){
		req.query.category = "?";
	}
	if(!req.query.medium){
		req.query.medium = "?";
	}
	next();
}

/* This function is a middleware function which gets all the artworks from the database which match the query paramaters which are sent when searching for artwork */
/* Note: This function was copied from the loadProductsDatabase function in the products-router.js file in the Mongoose Store demo from Brightspace */
function loadArtworksDatabase(req, res, next) {
	/* Get the start index of checking in the database and the max amount of items we want to get from the database */
	let startIndex = ((req.query.page-1) * req.query.limit);
	let amount = req.query.limit;
	
	/* Use the artwork schema and query through the database for the artwork which match the query parameters */
	Artwork.find()
	.where("name").regex(new RegExp(".*" + req.query.name + ".*", "i"))
	.where("artist").regex(new RegExp(".*" + req.query.artist + ".*", "i"))
	.where("category").regex(new RegExp(".*" + req.query.category + ".*", "i"))
	.where("medium").regex(new RegExp(".*" + req.query.medium + ".*", "i"))
	.limit(amount)
	.skip(startIndex)
	.exec(function(err, results){
		/* If there is an error when querying, print the error and then send a 500 request */
		if (err) {
			console.log(err);
			res.status(500).send("Error reading artwroks.");
			return;
		}
		/* Print the amount of artwork which was found, store it in the artwork variable of the response variable and then go to the next middleware */
		console.log("Found " + results.length + " matching artworks.");
		res.artwork = results;
		next();
	})
}

/* This function sends an array of artworks in response to a request and uses the artworks property added by previous middleware. The function sends either JSON or HTML. */
function respondArtworks(req, res, next) {
	res.format({
		"text/html": () => {res.status(200).render("pages/artwork-result", {artworks: res.artwork, qstring: req.qstring, current: req.query.page, is_artist: req.session.is_artist } )},
		"application/json": () => {res.status(200).json(res.artwork)}
	});
	return;
}

/* This function sends either HTML or JSON for a specific piece of artwork. */
function renderSpecificArtwork(req, res, next) {
	/* Check if the user is logged in, if they are not, then display an error message and exit the function */
	if (!req.session.loggedin) {
		res.status(401).send("Not authorized. You need to be login to render specific artworks.");
		return;
	};
	
	/* Get the ID of the specific artwork from the parameters of the request */
	const artworkID = req.params.artworkID;

	/* Search through the artwork collection for a matching artwork */
	Artwork.findById(artworkID, function (err, artwork) {
		/* If there is an error when querying, print the error and then send a 500 request. */
		if (err) {
			console.log(err);
			res.status(500).send("Error reading specific artwork.");
			return;
		}

		/* Next, try to find the artist of the artwork and the current user searching for artwork in the database  */
		User.find({ username: [artwork.artist, req.session.username] }, function (error, people) {
			/* If there is an error when querying, print the error and then send a 500 request. */
			if (error) {
				res.status(500).send("Error reading specific artist.");
				console.log(error);
				return;
			}

			let artist;
			let user;

			/* Iterate through the people who have a matching ID to either the artist of the artwork or the current user, and then store them in either user or artist variables */
			people.forEach(person => {
				if (person.username == artwork.artist) {
					artist = person;
				}
				if (person.username == req.session.username) {
					user = person;
				}
			});

			/* Find all the reviews for the specific artwork from the database */
			Review.find({ artwork_id: artworkID }, function (error, reviews) {
				/* If there is an error when querying, print the error and then send a 500 request. */
				if (error) {
					res.status(500).send("Error reading reviews.");
					console.log(error);
					return;
				}
				
				/* Check if the current user has privileges to like and review, if they are the artist who made the artwork, then they do not. */
				let reviewPrivilege = true;
				if (artist._id === user._id) {
					reviewPrivilege = false;
				}

				/* Render either the artwork-specific pug file and pass in the data we found earlier or send the artwork, user and reviews in JSON format */
				res.format({
					"text/html": () => { res.render("pages/artwork-specific", { artwork: artwork, artist: artist, is_artist: req.session.is_artist, reviewPrivilege: reviewPrivilege }); },
					"application/json": () => {
						res.status(200).json({"artwork": artwork, "user": user, reviews: reviews });
					}
				});
			});
		})
	})
}

/* This function updates the likes property of a user for a specific piece of artwork */
function updateLikes(req, res, next) {
	/* Check if the user is logged in, if they are not, then display an error message and exit the function */
	if (!req.session.loggedin) {
		res.status(401).send("Not authorized. You need to be login to have liked artworks.");
		return;
	};
	
	/* Store the object sent to the server */
	const receivedObject = req.body;

	/* Try to find the artwork which we have to change the likes of and update the value to the one sent to the server */
	Artwork.findOneAndUpdate({ _id: req.params.artworkID }, { $set: { likes: receivedObject["change"] } }, function (error, newArtwork) {
		/* If there is an error when querying or updating, print the error and then send a 500 request. */
		if (error) { 
			console.log(error);
			res.status(500).send("There was an error with the update.");
			return;
		}

		/* Check if we want to unlike or add a like the artwork */
		if (receivedObject["like"] == false) {
			/* If we want to stop liking a artwork, then we want to find the current user and remove the current artwork from the liekd array */
			User.findOneAndUpdate({ username: req.session.username }, {
				$pullAll: {
					liked: [{_id: req.params.artworkID}],
				}
			}, function (error, result) {
				/* If there is an error when querying or updating, print the error and then send a 500 request. */
				if (error) { 
					console.log(error);
					res.status(500).send("There was an error with removing the like from the User.");
					return;
				}

				/* Send a 200 request indicating the update was succesful */
				res.status(200).send("Like update was successful!");
			})
		}
		else {
			/* If we want to start liking a artwork, then we want to find the current user and add the current artwork to the liekd array */
			User.findOneAndUpdate({ username: req.session.username }, {
				$push: {
					liked: newArtwork,
				}
			}, function (error, result) {
				/* If there is an error when querying or updating, print the error and then send a 500 request. */
				if (error) {
					console.log(error);
					res.status(500).send("There was an error with removing the like from the User.");
					return;
				}

				/* Send a 200 request indicating the update was succesful */
				res.status(200).send("Like update was successful!");
			});
		}
	})
}

/* This function gets all the artwork the user liked and sends it in the object representation */
function getLikedArtwork(req, res, next) {
	/* Check if the user is logged in, if they are not, then display an error message and exit the function */
	if (!req.session.loggedin) {
		res.status(401).send("Not authorized. You need to be login to have liked artworks");
		return;
	};

	/* Find the current user in the database */
	User.findById(req.session.userID, function (error, user) {
		/* If there is an error when querying, print the error and then send a 500 request. */
    if (error) {
      console.log(error);
      res.status(500).send("Unknown User ID");
      return;
		}
		/* Try to find all the artwork which is in the liked array of the current user */
		Artwork.find({ _id: { $in: user.liked, } }, function (error, result) {
			/* If there is an error when querying, print the error and then send a 500 request. */
			if (error) {
				console.log(error);
				res.status(500).send("There was an error with the querying for artwork.");
				return;
			}
			/* Send a 200 response with the artwork which the user liked */
			res.status(200).send(result);
		})
  });
}

/* This function renders the page to add artwork to to the database */
function renderAddArtworkPage(req, res, next) {
	/* Check if the user is logged in, if they are not, then display an error message and exit the function */
	if (!req.session.loggedin) {
		res.status(401).send("Not authorized. You need to be logged in to add artwork to the database!");
		return;
	};

	/* Check if user should be able to add the artwork*/
	User.findById(req.session.userID, function (error, currentUser) {
		/* If there is an error when querying, print the error and then send a 500 request. */
		if (error) {
			console.log(error);
			res.status(500).send("Unknown userID");
			return;
		}

		/* If the user has already added a piece of artwork, do not let them add artwork until they change to become an artist */
		if (currentUser.artwork.length > 1) {
			res.status(401).send("You should not be able to add artwork as a patron. Change to an artist to continue adding artwork!");
			return;
		}

		/* Render the artwork-add.pug file */
		res.status(200).render("pages/artwork-add");
	});
}

/* This function checks if the current request is valid to be able to add artwork and then adds the artwork to the database and sends notification to followers if its valid */
function addArtwork(req, res, next) {
	/* Check if the user is logged in, if they are not, then display an error message and exit the function */
	if (!req.session.loggedin) {
		res.status(401).send("Not authorized. You need to be logged in to add artwork to the database!");
		return;
	};

		/* Check if user should be able to add the artwork*/
	User.findById(req.session.userID, function (error, currentUser) {
		/* If there is an error when querying, print the error and then send a 500 request. */
		if (error) {
			console.log(error);
			res.status(500).send("Unknown userID");
			return;
		}

		/* If the user has already added a piece of artwork, do not let them add artwork until they change to become an artist */
		if (currentUser.artwork.length > 1) {
			res.status(401).send("You should not be able to add artwork as a patron. Change to an artist to continue adding artwork!");
			return;
		}

		/* Store the object received from the client and add an artist paramaeter with the current user's username */
		let receivedObject = req.body;
		receivedObject["artist"] = req.session.username;

		/* Check if the parameters in the object received are valid for artwork */
		const isValidArtwork = checkValidArtwork(receivedObject);

		/* If checkValidArtwork returned an erorr, then send a 400 response with the name of the error and exit the function */
		if (typeof isValidArtwork !== 'undefined') {
			res.status(400).send(isValidArtwork);
			return;
		}

		/* Try to check through all the artwork stored and check if there is an artwork that already exists with the name of the artwork we want to add */
		Artwork.findOne({ name: receivedObject.name }, function (error, artwork) {
			/* If there is an error when querying, print the error and then send a 500 request. */
			if (error) {
				console.log(error);
				res.status(500).send("Unknown artwork name used.");
				return;
			}
			/* If no matching artwork is found with the new artwork's name */
			if (!artwork) {
				/* Create the new artwork object */
				const newArtwork = new Artwork({
					name: receivedObject.name,
					artist: receivedObject.artist,
					year: receivedObject.year,
					category: receivedObject.category,
					medium: receivedObject.medium,
					description: receivedObject.description,
					image: receivedObject.image,
				});

				/* Save the new artwork in the database */
				newArtwork.save(function (err, savedArtwork) {
					/* If there is an error when saving, print the error and then send a 400 request. */
					if (err) {
						console.log("Error Message:     " + err.message);
						for (x in err.errors) {
							console.log("error kind:    " + err.errors[x].kind);
							console.log("error message: " + err.errors[x].message);
							console.log("error path:    " + err.errors[x].path);
							console.log("error value:   " + err.errors[x].value);
						}
						res.status(400).send("Invalid artwork properties.");
						return;
					}
					
					/* Add the artwork to the artist's artwork array who added it */
					User.findOneAndUpdate({ username: req.session.username }, {
						$push: {
							artwork: savedArtwork,
						}
					}, function (error, result) {
						/* If there is an error when querying or updating, print the error and then send a 500 request. */
						if (error) {
							console.log(error);
							res.status(500).send("There was an error with removing the adding the new artwork to the User");
							return;
						}

						/* Try to find all the users who follow the artist who added the artwork */
						User.find({ following: [{ _id: req.session.userID }] }, function (error, arrayOfUsers) {
							/* If there is an error when querying, print the error and then send a 500 request. */
							if (error) {
								console.log(error);
								res.status(500).send("Error finding the artist followers!");
								return;
							}
							
							/* Create an array and add all the followers's ids to this array */
							let allArtistFollowers = [];

							arrayOfUsers.forEach(user => {
								allArtistFollowers.push(user._id);
							});

							/* Create a notification for the adding of the new artwork and set the receiver attribute to all the users who follow the artist */
							const artworkNotification = new Notification({
								receiver: allArtistFollowers,
								sender: req.session.username,
								content: `${req.session.username} has released a new artwork, called ${receivedObject.name}!`,
							});

							/* Save the notification to the database */
							artworkNotification.save(function (error, result) {
								/* If there is an error when saving, print the error and then send a 500 request. */
								if (error) {
									console.log(error);
									res.status(500).send("Error saving new notification!");
									return;
								}
								
								/* Update all the followers of the artist by adding the notificaiton to their notification array */
								User.updateMany({ _id: { $in: allArtistFollowers } }, { $push: { notifications: artworkNotification } }, function (error, updatedUsers) {
									/* If there is an error when querying or updating, print the error and then send a 500 request. */
									if (error) {
										console.log(error);
										res.status(500).send("Error sending notifications to the followers!");
										return;
									}

									/* Send a 201 response indicating the artwork has been added succesfully */
									res.status(201).send("The artwork was added successfully!");
								});
							});
						});
					});
				});
			}
			else {
				/* If an artwork already exists with the name, then send a 400 response and send the error message with it */
				res.status(400).send("An artwork already exists with this name. Give your artwork a different name.");
			}
		});
	});
}

/* This function checks if an object has valid parameter values to be added as an artwork into the database */
function checkValidArtwork(artworkObject) {
	/* If any of the values in the object are empty, then return an error message */
	if (isInputEmpty(artworkObject.name) || isInputEmpty(artworkObject.artist) || isInputEmpty(artworkObject.year) || isInputEmpty(artworkObject.category) || isInputEmpty(artworkObject.medium) || isInputEmpty(artworkObject.description) || isInputEmpty(artworkObject.image)) {
		return "One of the fields for the artwork is empty. Try again!";
	}

	const year = parseFloat(artworkObject.year)

	/* If the year string cannot be parsed into a number then return an error message */
	if (isNaN(year)) {
		return "Your year field is not parseable into a nunmber. The year of the artwork has to be a number";
	}

	return;
}

/* This function checks if a string is empty or not */
function isInputEmpty(input) {
	if (input === null || input === "" || input.length === 0 || input.trim().length === 0 || !input) { 
		return true;
	}
	else {
		return false;
	}
}

module.exports = router;