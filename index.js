const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt-nodejs");
const knex = require("knex");

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

app.post("/api/register", (req, res) => {
  const { email, username, password } = req.body;
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
        bcrypt.hash(password, null, null, (err, hash) => {
          database("login")
            .returning("*")
            .insert({
              hash: hash,
              email: email
            })
            .then(response => res.status(200).json(response))
            .catch(error => res.status(400).json(error));
        });
      }
    });
});

app.get("/api/logininfo", (req, res) => {
  database("login")
    .select()
    .then(data => res.status(200).json(data));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running. Listening to port ${PORT}`);
});
