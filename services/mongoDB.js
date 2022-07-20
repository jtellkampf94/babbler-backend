const mongoose = require("mongoose");

const keys = require("../config/keys");

mongoose.set("useCreateIndex", true);
mongoose.Promise = Promise;

mongoose
  .connect(keys.mongoDBURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log(err));
