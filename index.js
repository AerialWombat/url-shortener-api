const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.get("/api", (req, res) => {
  res.send("API server reached");
});

app.post("/api/register", (req, res) => {
  console.log("Register: ", req);
  res.json("Register request received");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running. Listening to port ${PORT}`);
});
