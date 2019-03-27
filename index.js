const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const express = require("express");
const knex = require("knex");
const urlExists = require("url-exists");
const helper = require("./helper");

const app = express();

const database = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "django",
    password: "",
    database: "url-short"
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/api", (req, res) => {
  res.json("API server reached");
});

// Selects matching record and compares hash, then returns user data. Else, returns error.
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: `Missing log-in information` });
  }
  database("login")
    .select("hash", "email")
    .where("email", "=", email)
    .then(data => {
      const isPassValid = bcrypt.compareSync(password, data[0].hash);
      if (isPassValid) {
        return database("users")
          .select("*")
          .where("email", "=", email)
          .then(user => {
            res.status(200).json(user[0]);
          })
          .catch(error => res.status(400).json(error));
      } else {
        return res
          .status(400)
          .json({ msg: `E-mail or password are incorrect.` });
      }
    })
    .catch(error => {
      res.status(400).json({ msg: `E-mail or password are incorrect.` });
    });
});

app.post("/api/register", (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ msg: `Missing registration information` });
  }
  // Selects current data from "users" table and checks if submitted email and username already exist.
  database("users")
    .select()
    .from("users")
    .then(tableData => {
      const emailExists = tableData.some(element => element.email === email);

      // Check if username exists in database
      const usernameExists = tableData.some(
        element => element.username === username
      );

      // Check if email exists in database
      if (emailExists) {
        res.status(400).json({ msg: `E-mail already in use.` });
      } else if (usernameExists) {
        res.status(400).json({ msg: `Username already in use.` });
      } else {
        // Store user info in database
        database("users")
          .returning("*")
          .insert({
            username: username,
            email: email,
            joined: new Date()
          })
          .catch(error => res.status(400).json(error));

        //Add user login information with hashed password
        const hash = bcrypt.hashSync(password);
        database("login")
          .returning("*")
          .insert({
            hash: hash,
            email: email
          })
          .then(response => res.status(200).json(response))
          .catch(error => res.status(400).json(error));
      }
    });
});

app.post("/api/shorten", (req, res) => {
  const { longUrl, username } = req.body;
  // Validate for URL format
  urlExists(longUrl, (err, exists) => {
    if (exists) {
      // Check if url has previously been shortened
      database("urls")
        .select()
        .where("longurl", "=", longUrl)
        .then(data => {
          // If url has been shortened, select previously made slug and return it
          if (data.length) {
            database("urls")
              .returning("*")
              .select()
              .where("longurl", "=", longUrl)
              .then(data =>
                res.status(200).json({
                  msg: `Pre-existing URL`,
                  slug: data[0].slug
                })
              );
          }
          // If new url, create hash, store, and return shortened url
          else {
            const slug = helper.shortenUrl(longUrl, 0, 5);
            database("urls")
              .returning("*")
              .insert({
                longurl: longUrl,
                slug: slug,
                created: new Date(),
                username: username
              })
              .then(data =>
                res.status(200).json({
                  msg: `URL successfully shortened`,
                  slug: data[0].slug
                })
              )
              .catch(error => console.log(error));
          }
        })
        .catch(error => res.status(400).json(error));
    } else {
      res.status(400).json(`URL does not exists`);
    }
  });
});

app.get("/:slug", (req, res) => {
  console.log(req.params.slug);
  database("urls")
    .select()
    .where("slug", "=", req.params.slug)
    .then(data => res.redirect(301, data[0].longurl));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running. Listening to port ${PORT}`);
});
