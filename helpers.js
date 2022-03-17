// returns 6 random alphanumeric characters
const generateRandomString = function() {
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

// checks if user's email is in the database and is able to return object with info
const getUserByEmail = function(email, data) {
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
  if (!users[req.session.userId]) {
    result = false;
  }
  return result;
};

// return url where userID = current userID
const urlsForUser = function(userID, database) {
  let currentID = userID;
  let userURLs = {};
  for (let user in database) {
    if (database[user].userID === currentID) {
      userURLs[user] = database[user];
    }
  }
  return userURLs;
};

// check if shortURL exists
const checkShortURL = function(URL, database) {
  return database[URL];
};

// verify owner of url
const verifyOwner = function(userID, shortURL, database) {
  let result = true;
  if (userID !== database[shortURL].userID) {
    result = false;
  }
  return result;
};

module.exports = {
  generateRandomString,
  checkBlank,
  getUserByEmail,
  checkIfLogged,
  urlsForUser,
  checkShortURL,
  verifyOwner
};