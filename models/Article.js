var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new UserSchema object
// This is similar to a Sequelize model
var ArticleSchema = new Schema({
  // `title` is required and of type String
  title: {
    type: String,
    required: true,
    validate: {
      isAsync: true,
      validator: function(value, isValid) {
          let self = this;
          return self.constructor.findOne({ title: value })
          .exec(function(err, user){
              if(err){
                  throw err;
              }
              else if(user) {
                  if(self.id === user.id) {  // if finding and saving then it's valid even for existing title
                      return isValid(true);
                  }
                  return isValid(false);  
              }
              else{
                  return isValid(true);
              }
          })
      },
      message: "There is already an article by that title."
    },
  },
  synopsis: {
    type: String
  },
  // `link` is required and of type String
  link: {
    type: String,
    required: true
  },
  // `note` is an object that stores a Note id
  // The ref property links the ObjectId to the Note model
  // This allows us to populate the Article with an associated Note
  note: {
    type: Schema.Types.ObjectId,
    ref: "Note"
  }
});

// This creates our model from the above schema, using mongoose's model method
var Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;
