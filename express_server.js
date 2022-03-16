// imports & requirements
const express = require("express");
const bodyParser = require("body-parser");
const req = require("express/lib/request");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const { generateRandomString, checkBlank, checkEmail, checkIfLogged, urlsForUser } = require("./helpers");

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
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "AaHTyl" },
  s9m5xK: { longURL: "http://www.google.com", userID: "AaHTyl"}
};

// users
const users = {
  AaHTyl: {
    id: 'AaHTyl',
    email: 'test@gmail.com',
    password: 'testpass123'
  }
};

// GET REQUESTS
// send HTML
app.get("/hello", (req,res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/", (req,res) => {
  res.send("Hello!");
});

// Route for /urls
app.get("/urls", (req,res) => {
  let userURL = {};
  const user = users[req.cookies["user_id"]];
  if(!user) {
    res.status(400).send(`
    <h1>Error 400</h1>
    <h2>you don't have access</h2>
    <a class="nav-item nav-link" href="/login">LOGIN</a>
    `);
  }
  if(user !== undefined) {
    userURL = urlsForUser(users, urlDatabase, userURL, req);
  }
  console.log('userURL', userURL);

  const templateVars = {
    user: user,
    urls: userURL,
    req: req,
  };
  
  res.render("urls_index", templateVars);
});

// GET Route to show new URL form
app.get("/urls/new", (req,res) => {
  const user = users[req.cookies["user_id"]];
  templateVars = {
    user: user
  };
  if(checkIfLogged(users, req)) {
    return res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

// JSON string representing the entire urlDatabase object
app.get("/urls.json", (req,res) => {
  res.json(urlDatabase);
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
  const user = users[req.cookies["user_id"]];
  const templateVars = {
    user: user,
    urls: urlDatabase,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };

  const userShort = urlDatabase[req.params.shortURL].userID;
  if (user.id !== userShort) {
    res.status(400).send(`
    <h1>Error: 400</h1>
    <h2>you don't have access</h2>
    `);
  } else {
  res.render("urls_show", templateVars);
  }
});

// registration page
app.get("/register", (req,res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = {
    user: user
  };
  res.render("urls_register", templateVars);
});

// login page
app.get("/login", (req,res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = {
    user: user
  };
  res.render("urls_login", templateVars)
});

// POST REQUESTS
// POST route to receive form submission
app.post("/urls", (req,res) => {
  const user = users[req.cookies["user_id"]];
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: user.id
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
  
  if (checkBlank(req)) {
    return res.status(400).send(`
    <h1>Error 400</h1>
    <h2>email or password field is blank</h2>
    `);
  };
  
  const user = checkEmail(req.body.email, users);
  if (user) {
    return res.status(409).send(`
    <h1>Error 400</h1>
    <h2>email already exists</h2>
    `);
  }

  const randomID = generateRandomString();
  const userID = randomID;
  if (users[userID] === undefined) {
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: req.body.password
    }
  };
  res.cookie('user_id', userID);
  res.redirect("/urls");
  console.log(users);
});

app.post("/login", (req,res) => {

  if (checkBlank(req)) {
    return res.status(400).send(`
    <h1>Error 400</h1>
    <h2>email or password field is blank</h2>
    `);
  };

  const user = checkEmail(req.body.email, users);
  if (user) {
    const password = user.password;
    const userID = user.id;
    if (req.body.password === password) {
      res.cookie('user_id', userID);
      res.redirect('/urls');
    } else {
      res.status(403).send('Error 403... re-enter your password');
    }
  } else {
  return res.status(403).send(`
  <h1>Error 403</h1>
  <h2>email or password are invalid</h2>
  `);
  }
});

app.post("/logout", (req,res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});