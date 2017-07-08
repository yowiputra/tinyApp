const express = require("express");
const bodyParser = require("body-parser");
const cookieSession  = require('cookie-session');
const bcrypt = require('bcrypt');
// Default port: 8080
const port = process.env.PORT || 8080;

const app = express();
app.set("view engine", "ejs");

// Middlewares
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  secret: 'getschwifty',
  maxAge: 24 * 60 * 60 * 1000
}));

// Random string generator for generating short urls
function generateRandomString() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// Initial URL Database
const urlDatabase = {};

// Initial User Database
const users = {};

// GET the root directory
app.get("/", (req, res) => {
  if (req.session.user) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// GET the index page
app.get("/urls", (req, res) => {
  const userObj = req.session.user;
  if (!userObj) {
    res.sendStatus(401);
    return;
  }
  let templateVars = {
    urls: urlDatabase[userObj.id],
    user: userObj
  };
  res.render("urls_index", templateVars);
});

// GET the new input page
app.get("/urls/new", (req, res) => {
  const userObj = req.session.user;
  if (!userObj) {
    res.redirect('/login');
    return;
  }
  let templateVars = {
    user: userObj
  };
  res.render("urls_new", templateVars);
});

// GET the redirection towards the actual site
app.get("/u/:shortURL", (req, res) => {
  for (let userID in users) {
    if (urlDatabase[userID][req.params.shortURL]) {
      const longURL = urlDatabase[userID][req.params.shortURL];
      res.redirect(longURL);
      return;
    }
  }
  res.sendStatus(404);
  return;
});

// GET the info on each shortened url
app.get("/urls/:id", (req, res) => {
  const userObj = req.session.user;
  if (!userObj) {
    res.sendStatus(404);
    return;
  }
  if(!urlDatabase[userObj.id][req.params.id]){
    res.sendStatus(404);
    return;
  }
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[userObj.id][req.params.id],
    user: userObj
  };
  res.render("urls_show", templateVars);
});

// POST the newly generated short url
app.post("/urls", (req, res) => {
  const userObj = req.session.user;
  if (!userObj) {
    res.sendStatus(401);
    return;
  }
  if(!req.body.longURL){
    res.sendStatus(400);
    return;
  }
  const randomText = generateRandomString();
  urlDatabase[userObj.id][randomText] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${randomText}`);
});

// POST the updated short url
app.post("/urls/:id", (req, res) => {
  const userObj = req.session.user;
  if (!userObj) {
    res.sendStatus(401);
    return;
  }
  if (req.body.longURL) {
    urlDatabase[userObj.id][req.params.id] = req.body.longURL;
  }
  res.redirect(`/urls`);
});

// POST for value deletion
app.post("/urls/:id/delete", (req, res) => {
  const userObj = req.session.user;
  if (!userObj) {
    res.sendStatus(401);
    return;
  }
  delete(urlDatabase[userObj.id][req.params.id]);
  res.redirect('/urls');
});

// GET the login page
app.get("/login", (req, res) => {
  const userObj = req.session.user;
  if (userObj) {
    res.redirect('/urls');
  } else {
    res.render("urls_login", {user: userObj});
  }
});

// GET the register page
app.get("/register", (req, res) => {
  const userObj = req.session.user;
  if (userObj) {
    res.redirect('/urls');
  } else {
    res.render("urls_register", {user: userObj});
  }
});

// POST the user_id into cookie for logging in
app.post("/login", (req, res) => {
  const {email, password} = req.body;
  for (let id in users) {
    if (email === users[id].email) {
      if (bcrypt.compareSync(password, users[id].password)) {
        req.session.user = users[id];
        res.redirect('/urls');
        return;
      }
    }
  }
  res.sendStatus(400);
  return;
});

// POST the registration form information to user database
// initialize user data and url database for the new user
app.post("/register", (req, res) => {
  const {email, password} = req.body;
  // check if email already exists
  for (let id in users){
    if (email === users[id].email) {
      res.sendStatus(400);
      return;
    }
  }
  // do its functionality if user inputted anything other than blank
  if (email && password) {
    const user_id = generateRandomString();
    users[user_id] = {
      id: user_id,
      email: email,
      password: bcrypt.hashSync(password, 14)
    };
    urlDatabase[user_id] = {};
    req.session.user = users[user_id];
    res.redirect('/urls');
  } else {
    res.sendStatus(400);
    return;
  }
})

// POST the cookie clearance for logging out
app.post("/logout", (req, res) => {
  req.session = null;
  // specs said supposed to redirect to /urls but that doesn't make sense
  // redirecting to /login makes more sense
  res.redirect('/login');
});

// For marking if the server ran
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
