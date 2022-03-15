// imports & requirements
const express = require("express");
const bodyParser = require("body-parser");
const req = require("express/lib/request");
const cookieParser = require("cookie-parser");

// set-up server
const app = express();
const PORT = 8080; // default port 8080
app.use(bodyParser.urlencoded({extended: true})); // convert request body into string (from Buffer)
app.use(cookieParser());

// set ejs as view engine
app.set("view engine", "ejs");
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});

// databases
const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca" },
  s9m5xK: { longURL: "http://www.google.com" }
};

// users
const users = {};

// GET REQUESTS
// send HTML
app.get("/hello", (req,res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/", (req,res) => {
  res.send("Hello!");
});

// GET Route to Show the Form
app.get("/urls/new", (req,res) => {
  templateVars = {
    user: req.cookies["user_id"]
  };
  res.render("urls_new", templateVars);
});

// JSON string representing the entire urlDatabase object
app.get("/urls.json", (req,res) => {
  res.json(urlDatabase);
});

// Route for /urls
app.get("/urls", (req,res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = {
    user: user,
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars);
});

// Redirect short URLs
app.get("/u/:shortURL", (req,res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (longURL.startsWith('http://')) {
    res.redirect(303, longURL);
  } else {
    res.redirect('http://' + longURL);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"],
    urls: urlDatabase,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render("urls_show", templateVars);
});

// registration page
app.get("/register", (req,res) => {
  const templateVars = {
    user: req.cookies["user_id"]
  };
  res.render("urls_register", templateVars);
});

// POST REQUESTS
// POST route to receive form submission
app.post("/urls", (req,res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL
  };
  res.redirect(`urls/${shortURL}`) // redirects upon POST request
});

// to delete URLs
app.post("/urls/:shortURL/delete", (req,res) => {
  for (const shortURL in urlDatabase) {
    delete urlDatabase[req.params.shortURL];
  }
  return res.redirect('/urls');
});

// to edit URLs
app.post("/urls/:shortURL/edit", (req,res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect('/urls');
});

app.post("/register", (req,res) => {
  const randomID = generateRandomString();
  const userID = 'user' + Object.keys(users).length + randomID;
  if (users[userID] === undefined) {
    users[userID] = {
      id: randomID,
      email: req.body.email,
      password: req.body.password
    }
  } else {
    console.log('Error: This ID is unavailable');
    res.redirect("/urls");
  }
  res.cookie('user_id', userID);
  console.log(users);
  res.redirect("/urls");
});

app.post("/login", (req,res) => {
  if (req.body.username) {
    const username = req.body.username;
    res.cookie('username', username);
  }
  res.redirect('/urls');
});

app.post("/logout", (req,res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// returns 6 random alphanumeric characters
function generateRandomString() {
  let result = '';
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};