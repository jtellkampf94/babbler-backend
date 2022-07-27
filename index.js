const express = require("express");
const bodyParser = require("body-parser");
const compress = require("compression");
const cors = require("cors");
const userRoutes = require("./routes/user.routes");
const uploadRoutes = require("./routes/upload.routes");
const authRoutes = require("./routes/auth.routes");
const postRoutes = require("./routes/post.routes");

require("./services/mongoDB");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(compress());
app.use(cors());

app.use("/api", userRoutes);
app.use("/api", uploadRoutes);
app.use("/api", authRoutes);
app.use("/api", postRoutes);

app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.status || 500;
  const message =
    error.message || "Oops! Something went wrong with our servers";
  res.status(status).json({ error: message });
});

const port = process.env.PORT || 5000;

app.listen(port, (err) => {
  if (err) console.log(err);

  console.log("Server started on port %s", port);
});
