// imports & requirements
const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { generateRandomString,
  checkBlank,
  checkIfLogged,
  urlsForUser,
  getUserByEmail,
  checkShortURL,
  verifyOwner
} = require("./helpers");

// set-up server
const app = express();
const PORT = 8080; // default port 8080
app.use(bodyParser.urlencoded({extended: true})); // convert request body into string (from Buffer)
app.use(cookieSession({
  name: 'session',
  keys: ['userId']
}));

// set ejs as view engine
app.set("view engine", "ejs");
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// databases
const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "AaHTyl" },
  s9m5xK: { longURL: "http://www.google.com", userID: "AaHTyl"}
};

const users = {
  AaHTyl: {
    id: 'AaHTyl',
    email: 'test@gmail.com',
    password: bcrypt.hashSync('testpass123', 10)
  }
};

// GET REQUESTS
// GET route /hello to practice sending HTML
app.get("/hello", (req,res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/", (req,res) => {
  const user = users[req.session.userId];
  if (!user) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

// GET route /urls
// JSON string representing the entire urlDatabase object
app.get("/urls.json", (req,res) => {
  res.json(urlDatabase);
});

// GET route /urls
app.get("/urls", (req,res) => {
  const user = users[req.session.userId];
  if (!user) {
    res.render("urls_error");
  } else {
    const linksOfUser = urlsForUser(user.id, urlDatabase);
    let templateVars = {
      user: user,
      urls: linksOfUser
    };
    res.render("urls_index", templateVars);
  }
});

// GET route /urls/new to show new URL form
app.get("/urls/new", (req,res) => {
  const user = users[req.session.userId];
  const templateVars = {
    user: user
  };
  if (!checkIfLogged(users, req)) {
    return res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

// GET route /u/:shortURL to redirect short URLs to long URL
app.get("/u/:shortURL", (req,res) => {
  let shortURL = req.params.shortURL;
  if (checkShortURL(shortURL, urlDatabase)) {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send(`
    <h1>Error 404</h1>
    <h2>This URL does not exist</h2>
    <a href="/urls" class="inline_block" >access main page</a>
    `);
  }
});

// GET route /urls/:shortURL to show specific URL page with edit option
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const user = users[req.session.userId];
  if (checkShortURL(shortURL, urlDatabase)) {
    const userShort = urlDatabase[req.params.shortURL].userID;
    if (!user || user.id !== userShort) {
      res.status(400).send(`
      <h1>Error 400</h1>
      <h2>you don't have access</h2>
      <a href="/urls" class="inline_block" >access main page</a>
      `);
    } else {
      const templateVars = {
        user: user,
        urls: urlDatabase,
        shortURL: shortURL,
        longURL: urlDatabase[shortURL].longURL
      };
      res.render("urls_show", templateVars);
    }
  } else {
    res.send(`
    <h1>Error</h1>
    <h2>This url does not exist</h2>
    <a href="/urls" class="inline_block" >access main page</a>
    `);
  }
});

// GET /register to make new account
app.get("/register", (req,res) => {
  const user = users[req.session.userId];
  const templateVars = {
    user: user
  };
  res.render("urls_register", templateVars);
});

// GET /login page
app.get("/login", (req,res) => {
  const user = users[req.session.userId];
  const templateVars = {
    user: user
  };
  res.render("urls_login", templateVars);
});

// POST REQUESTS
// POST route /urls to receive form submission
app.post("/urls", (req,res) => {
  const user = users[req.session.userId];
  const shortURL = generateRandomString();
  const newURL = req.body.longURL;
  urlDatabase[shortURL] = {
    longURL: newURL,
    userID: user.id
  };
  res.redirect(`urls/${shortURL}`);
});

// POST route /urls/:shortURL/delete to delete URLs
app.post("/urls/:shortURL/delete", (req,res) => {
  const user = users[req.session.userId];
  if (!user || !verifyOwner(user.id, req.params.shortURL, urlDatabase)) {
    res.send(`
    <h1>Error</h1>
    <h2>you don't have access to this functionality</h2>
    `);
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

// POST route /urls/:shortURL/edit to edit URLs
app.post("/urls/:shortURL/edit", (req,res) => {
  const user = users[req.session.userId];
  if (!user || !verifyOwner(user.id, req.params.shortURL, urlDatabase)) {
    res.send(`
    <h1>Error</h1>
    <h2>you don't have access to this functionality</h2>
    `);
  } else {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect('/urls');
  }
});

// POST route /register to ensure proper function of form
app.post("/register", (req,res) => {
  
  if (checkBlank(req)) {
    return res.status(400).send(`
    <h1>Error 400</h1>
    <h2>email or password field is blank</h2>
    `);
  }
  
  const user = getUserByEmail(req.body.email, users);
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
      password: bcrypt.hashSync(req.body.password, 10)
    };
  }
  req.session.userId = randomID;
  res.redirect("/urls");
  console.log(users);
});

// POST route /login to ensure proper function of form
app.post("/login", (req,res) => {

  if (checkBlank(req)) {
    return res.status(400).send(`
    <h1>Error 400</h1>
    <h2>email or password field is blank</h2>
    `);
  }

  const user = getUserByEmail(req.body.email, users);
  if (user) {
    const password = user.password;
    const userID = user.id;
    if (bcrypt.compareSync(req.body.password, password)) {
      req.session.userId = userID;
      res.redirect('/urls');
    } else {
      res.status(403).send(`
      <h1>Error 403</h1>
      <h2>re-enter your password</h2>
      `);
    }
  } else {
    return res.status(403).send(`
    <h1>Error 403</h1>
    <h2>email not found</h2>
    `);
  }
});

// POST route /logout
app.post("/logout", (req,res) => {
  req.session = null;
  res.redirect('/urls');
});