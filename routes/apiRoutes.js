// Require all models
var db = require("../models");
// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Routes
module.exports = function(app) {
	
// A GET route for scraping the NPR website
	app.get("/scrape", function (req, res) {
		// First, we grab the body of the html with axios
		axios.get("https://www.npr.org/sections/news/").then(function (response) {
			// Then, we load that into cheerio and save it to $ for a shorthand selector
			var $ = cheerio.load(response.data);

			// Now, we grab every h2 within an article tag, and do the following:
			$("div #overflow").children("article").each(function (i, element) {
				// Save an empty result object
				var result = {};

				// Add the text and href of every link, and save them as properties of the result object
				result.title = $(this)
					.find(".title").children()
					.text();
				result.synopsis = $(this)
					.find(".teaser").children()
					.text();
				result.link = $(this)
					.find(".title").children()
					.attr("href");
				
				// Create a new Article using the `result` object built from scraping
				console.log(result);
				db.Article.create(result)
				.then(function (dbArticle) {
					// View the added result in the console
					console.log(dbArticle);
				})
				.catch(function (err) {
					// If an error occurred, log it
					console.log(err);
				});	
			});
		});

			// Send a message to the client
			res.send("Scrape Complete");
		});

	// Route for getting all Articles from the db
	app.get("/", function (req, res) {
		// Grab every document in the Articles collection
		db.Article.find({})
			.then(function (dbArticle) {
				// If we were able to successfully find Articles, send them back to the client
				var hbsObject = {
					articles: dbArticle
				}
				res.render("index", hbsObject);
			})
			.catch(function (err) {
				// If an error occurred, send it to the client
				res.json(err);
			});
	});

	// Route for grabbing a specific Article by id, populate it with it's note
	app.get("/articles/:id", function (req, res) {
		// Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
		db.Article.findOne({ _id: req.params.id })
			// ..and populate all of the notes associated with it
			.populate("note")
			.then(function (dbArticle) {
				// If we were able to successfully find an Article with the given id, send it back to the client
				res.json(dbArticle);
			})
			.catch(function (err) {
				// If an error occurred, send it to the client
				res.json(err);
			});
	});

	// Route for saving/updating an Article's associated Note
	app.post("/articles/:id", function (req, res) {
		// Create a new note and pass the req.body to the entry
		db.Note.create(req.body)
			.then(function (dbNote) {
				// If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
				// { new: true } tells the query that we want it to return the updated User -- it returns the original by default
				// Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
				return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
			})
			.then(function (dbArticle) {
				// If we were able to successfully update an Article, send it back to the client
				res.json(dbArticle);
			})
			.catch(function (err) {
				// If an error occurred, send it to the client
				res.json(err);
			});
	});
};