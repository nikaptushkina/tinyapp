// requirements
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

// convert request body into string (from Buffer)
app.use(bodyParser.urlencoded({extended: true}));

// set ejs as view engine
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// GET route for /urls
app.get("/urls", (req,res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// POST route to receive form submissions
app.post("/urls", (req,res) => {
  console.log(req.body) // Log the POST request body to the console
  res.send("Ok");       // Respond with "Ok"
});

app.get("/", (req,res) => {
  res.send("Hello!");
});

// JSON string representing the entire urlDatabase object
app.get("/urls.json", (req,res) => {
  res.json(urlDatabase);
});

// send HTML
app.get("/hello", (req,res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// GET Route to Show the Form
app.get("/urls/new", (req,res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});

// returns 6 random alphanumeric characters
function generateRandomString() {
  let result = '';
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.florr(Math.random() * chars.length));
  }
  return result;
};