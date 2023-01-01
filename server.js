/* File: server.js */
/* Author: Nguyen-Hanh Nong */
/* Purpose: This file is the file that is loaded to run the server for the Term Project. It manages all the routers and all the requests which come into the server. */
/* Note: The majority of this code is taken from the store-server.js file from Mongoose Store code from Brightspace */

/* Importing all the necessary libraries and routers */
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const morgan = require('morgan')
const pug = require('pug');

const app = express();
const accountRouter = require("./routers/account-router");
const artworkRouter = require("./routers/artwork-router");
const artistRouter = require("./routers/artist-router");
const reviewRouter = require("./routers/review-router");
const userRouter = require("./routers/user-router");

/* URL of the local database */
const database_URL = "mongodb://127.0.0.1:27017/final-project-db";

/* Using PUG as the template engine */
app.set("view engine", "pug"); 

/* Using expres-session cookies */
app.use(session({ 
	secret: 'super-secret-final-project stuff', 
	resave: true,
	saveUninitialized: true
}));  


/* Print out the session to the terminal */
app.use(function (req, res, next) {
  console.log(req.session);
  next();
});

/* Listing the public and routers folders as static folders to the server, also using express.json() on every request. Also using morgan to display the requests to debug */
app.use(express.static("public"));
app.use(express.static("routers"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

/* Listing the routers for all the different URL's except the home page, which is just hard coded into this file */
app.use("/account", accountRouter);
app.use("/artwork", artworkRouter);
app.use("/artist", artistRouter);
app.use("/review", reviewRouter);
app.use("/user", userRouter);
app.get("/", function (req, res, next) {
	res.status(200).render("pages/home-page");
});

/* Putting in an extra use statement which is only reached if the clients input a URL that the program doesn't support */
app.use((req, res) => {
	res.status(404).send("404 Request. You most likely made it here if you inputted a route that doesn't exist!");
});

/* Connecting to the database and then once the database is connected, we can set the server to start listening */
mongoose.connect(database_URL, { useNewUrlParser: true });
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	app.listen(3000);
	console.log("Server listening on port 3000: http://localhost:3000/");
	module.exports = { db };
});
