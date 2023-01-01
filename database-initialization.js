/* File: database-initialization.js */
/* Author: Nguyen-Hanh Nong */
/* Purpose: This file handles the initialization and inserting of the data necessary into a local mongoDB database. */
/* Note: The code is heavily influenced from ex10-product-inserter.js from the code from Lecture 20 (1st Mongoose Lecture) */

/* Importing the necessary data from the JSON files  */
let artworkData = require("./gallery.json");
let workshopData = require("./workshop.json");

/* Importing mongoose and the mongoose schemas */
const mongoose = require('mongoose');
const schemas = require('./public/javascript/mongo-schemas.js')

/* Saving the URL of the local mongoDB database */
let database_URL = "mongodb://127.0.0.1:27017/final-project-db";

/* Connecting to the database using mongoose */
mongoose.connect(database_URL, { useNewUrlParser: true });

let db = mongoose.connection;
/* Checking if the connection to the database is proper */
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  /* Connected into the database */
  console.log("Connected to final-project-db database.");

  /* If the dataabse exists, then drop the database to reset to initial state */
  db.dropDatabase(function (err, result) {
    if (err) {
      console.log(err);
      return;
    }

    /* Insert all the artwork from the gallery.json file into the artwork collection in the database */
    schemas.Artwork.insertMany(artworkData, function (err, result) {
    if (err) {
      console.log(err);
      return;
    }

    /* Now, go through the artwork collection and check for all the unique artists  */
    schemas.Artwork.find().distinct('artist', function (error, artistArray) {

      let artistUserArray = [];

      /* For every artist in the array, we need to create a user for that artist. We use the artist's name as the username and generate a ranadom password for the artist to make sure no one will accedentally log into the artist profile. */
      artistArray.forEach(function (artist, index) {
        const randomUsername = artist;
        const randomPassword = (Math.random() * 1e96).toString(36);

        const newArtistUser = new schemas.User({
          username: randomUsername,
          password: randomPassword,
          is_artist: true,
        });

        /* Add the artist to the artistUserArray */
        artistUserArray.push(newArtistUser);
      });

      /* Insert the artists under the User collection */
      schemas.User.insertMany(artistUserArray, function (error, result) {
        if (error) {
          console.log(error);
          return;
        }

        /* Now, for each artist, we will generate a random workshop. The title of the workshop is one of the random workshop titles listed in workshop.json */
        let workshopArray = [];
        artistArray.forEach(function (artist, index) {
          const host = artist;
          const randomWorkshopTitle = workshopData[Math.floor(Math.random()*workshopData.length)];

          const newWorkshop = new schemas.Workshop({
            host: host,
            title: randomWorkshopTitle,
          });

          /* Add the workshop to the workshopArray */
          workshopArray.push(newWorkshop);
        });

        /* Insert all the workshops into the workshop collection in the database */
        schemas.Workshop.insertMany(workshopArray, function (error, result) {
          if (error) {
            console.log(error);
            return;
          }
          console.log("Artists, artworks and the randomly generated workshops have been added to the database properly!. The connection will now close!");
          /* Close the connection to the database once all the items are successfully inserted. */
          mongoose.connection.close();
        });
       });
      });
    });
  });
});