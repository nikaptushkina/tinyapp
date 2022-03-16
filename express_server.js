// imports & requirements
const express = require("express");
const bodyParser = require("body-parser");
const req = require("express/lib/request");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const { generateRandomString, checkBlank, checkIfLogged, urlsForUser, checkRegistered, fetchUserInfo, checkShortURL, verifyOwner } = require("./helpers");

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
    password: bcrypt.hashSync('testpass123', 10)
  }
};

// GET REQUESTS
// send HTML
app.get("/hello", (req,res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/", (req,res) => {
  const user = users[req.cookies["user_id"]];
  if (!user) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

// Route for /urls
app.get("/urls", (req,res) => {
  const user = users[req.cookies["user_id"]];
  if(!user) {
    res.render("urls_error");
  } else {
    const linksOfUser = urlsForUser(user.id, urlDatabase);
    console.log(user.id);
    console.log(linksOfUser);
    let templateVars = {
    user: user,
    urls: linksOfUser
    };
    res.render("urls_index", templateVars);
  }
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

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const user = users[req.cookies["user_id"]];
  if(checkShortURL(shortURL, urlDatabase)) {
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
    `)
  };
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
  const newURL = req.body.longURL;
  urlDatabase[shortURL] = {
    longURL: newURL,
    userID: user.id
  };
  res.redirect(`urls/${shortURL}`) // redirects upon POST request
});

// to delete URLs *can't get correct end point
app.post("/urls/:shortURL/delete", (req,res) => {
  const user = users[req.cookies["user_id"]];
  if (!user || !verifyOwner(user.id, req.params.shortURL, urlDatabase)) {
    res.send(`
    <h1>Error</h1>
    <h2>you don't have access to this functionality</h2>
    `)
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

// to edit URLs 
app.post("/urls/:shortURL/edit", (req,res) => {
  const user = users[req.cookies["user_id"]];
  if (!user || !verifyOwner(user.id, req.params.shortURL, urlDatabase)) {
    res.send(`
    <h1>Error</h1>
    <h2>you don't have access to this functionality</h2>
    `)
  } else {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect('/urls');
  }
});

app.post("/register", (req,res) => {
  
  if (checkBlank(req)) {
    return res.status(400).send(`
    <h1>Error 400</h1>
    <h2>email or password field is blank</h2>
    `);
  };
  
  const user = fetchUserInfo(req.body.email, users);
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

  const user = fetchUserInfo(req.body.email, users);
  if (user) {
    const password = user.password;
    const userID = user.id;
    if (bcrypt.compareSync(req.body.password, password)) {
      res.cookie('user_id', userID);
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

app.post("/logout", (req,res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});