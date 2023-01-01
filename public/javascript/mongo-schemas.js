/* File: mongo-schemas.js */
/* Author: Nguyen-Hanh Nong */
/* Purpose: This file contains all the Schemas that are used in the database of the project */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/* Schema for the artwork */
const artSchema = Schema({
	name: {
		type: String, 
		required: true,
		minlength: [1, "Artwork cannot have an empty name. "],
		unique: [true, "Artwork name already exists, it is not unique."],
	},
	artist: {
		type: String, 
		required: true,
		minlength: [1, "Artist for artwork cannot have an empty name"],
	},
	year: {
		type: String, 
		required: true,
		minlength: [1, "Application doesn't support years that are less than 1 AD"], 
  },
  category: {
		type: String, 
		required: true,
		minlength: [1, "Category for artwork cannot be empty"],
  },
  medium: {
		type: String, 
		required: true,
		minlength: [1, "Medium for artwork cannot be empty"],
  },
  description: {
		type: String, 
		required: true,
		minlength: [1, "Description for artwork cannot be empty"],
  },
  image: {
		type: String, 
		required: true,
		minlength: [1, "Image URL for artwork cannot be empty"],
	},
	likes: {
		type: Number,
		default: 0,
	}
});

/* Schema used for the artist/patrons */
const userSchema = Schema({
	username: {
		type: String, 
		required: [true, "Username is a required field."],
    minlength: [1, "Username for User cannot be empty."],
    unique: [true, "Username is not unique."],
	},
	password: {
		type: String, 
		required: [true, "Password is a required field"],
    minlength: [1, "Password for user cannot be empty."],
	},
  is_artist: {
    type: Boolean,
    default: false,
  },
	artwork: {
		type: [Schema.Types.ObjectId],
		ref: 'Artwork',
		default: [],
	},
	liked: {
		type: [Schema.Types.ObjectId],
		ref: 'Artwork',
		default: [],
	},
  reviews: {
		type: [Schema.Types.ObjectId],
		ref: 'Review',
		default: [],
	},
  workshops: {
		type: [Schema.Types.ObjectId],
		ref: 'Workshop',
		default: [],
	},
	notifications: {
		type: [Schema.Types.ObjectId],
		ref: 'Notification',
		default: [],
	},
	following: {
		type: [Schema.Types.ObjectId],
		default: [],
	},
});

/* Schema used for the reviews */
const reviewSchema = Schema({
	reviewer: {
		type: String, 
		required: [true, "Reviewer is a required field."],
    minlength: [1, "Reviewer for artwork cannot be empty."],
	},
	content: {
		type: String, 
		required: [true, "Content for a review is a required field."],
		minlength: [1, "Content for a review cannot be empty."],
		maxlength: [1000, "The content for a review cannot exceed 1000 characters."],
	},
	artwork_id: {
		type: String, 
		required: [true, "Artwork ID is a required field."],
    minlength: [1, "Artwork ID for review cannot be empty."],
	}
});

/* Schema used for the workshops */
const workshopSchema = Schema({
	host: {
		type: String,
		required: [true, "Host is a required field."],
		minlength: [1, "Host for workshop cannot be empty."],
	},
	title: {
		type: String,
		required: true,
		minlength: [1, "Workshop title cannot have an empty name"],
		maxlength: [50, "Workshop title is too long."],
	}
});

/* Schema that is used for the notifications */
const notificationSchema = Schema({
	receiver: {
		type: [String],
		default: [],
		required: [true, "Receivers for a notification is a required field."],
	},
	sender: {
		type: String,
		required: [true, "Sender of a notification is a required field."],
		minlength: [1, "Sender of a notification cannot be empty."],
	},
	content: {
		type: String,
		required: true,
		minlength: [1, "Notification content cannot have an empty name"],
		maxlength: [500, "Notification content is too long."],
	}
});

/* Creating the models from the schemas */
let Artwork = mongoose.model('Artwork', artSchema);
let User = mongoose.model('User', userSchema);
let Review = mongoose.model('Review', reviewSchema);
let Workshop = mongoose.model('Workshop', workshopSchema);
let Notification = mongoose.model('Notification', notificationSchema);

/* Exporting all the schemas/models */
module.exports = {
    User, Artwork, Review, Workshop, Notification
}