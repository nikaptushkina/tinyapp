// returns 6 random alphanumeric characters
function generateRandomString() {
  let result = '';
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// checks if email of password are blank
const checkBlank =  function(req) {
  let results = false;
  if (req.body.password === '' || req.body.password === '') {
    results = true;
  }
  return results;
};

// checks if user's email is in the database and is able to return ID
const checkEmail = function(email, data) {
  for (const user in data) {
    if (email === data[user].email) {
      return data[user];
    }
  }
  return undefined;
};

// check if login in
const checkIfLogged = function(users, req) {
  let result = true;
  if (users[req.cookies["user_id"]]) {
    result = false;
  }
  return result;
};

// check URL id and user id, populate database accordingly
const urlsForUser = function(users, urlDatabase, userURL, req) {
  for (const shortURL in urlDatabase) {
    const user = users[req.cookies["user_id"]];
    if (user.id === urlDatabase[shortURL].userID) {
      userURL[shortURL] = {
        longURL: urlDatabase[shortURL].longURL,
        userID: user.id
      };
      urlDatabase[shortURL] = {
        longURL: urlDatabase[shortURL].longURL,
        userID: user.id
      };
    }
  }
  return userURL;
};

// check if registered and return email
const checkRegistered = function(cookie, database) {
  for (let users in database) {
    if (cookie === users) {
      return database[users].email;
    }
  }
};

module.exports = {
  generateRandomString,
  checkBlank,
  checkEmail,
  checkIfLogged,
  urlsForUser,
  checkRegistered
}