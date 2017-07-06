var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

// Initial URL Database
const urlDatabase = {
  "userRandomID":{
    abcdef: "http://www.lighthouselabs.ca"
  },
  "user2RandomID":{
    asdfgh: "http://www.google.com"
  }
};

// Initial User Database
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

// Random string generator for generating short urls
function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// GET the root directory
app.get("/", (req, res) => {
  if(req.cookies.user_id){
    res.redirect('/urls');
  }else{
    res.redirect('/login');
  }
});

// GET the index page
app.get("/urls", (req, res) => {
  const userObj = req.cookies.user_id;
  if(req.cookies.user_id){
    let templateVars = {
      urls: urlDatabase[userObj.id],
      user: userObj
    };
    res.render("urls_index", templateVars);
  }else{
    res.sendStatus(401);
  }
});

// GET the new input page
app.get("/urls/new", (req, res) => {
  const userObj = req.cookies.user_id;
  if(userObj){
    let templateVars = {
      user: userObj
    };
    res.render("urls_new", templateVars);
  }else{
    res.redirect('/login');
  }
});

// GET the redirection towards the actual site
app.get("/u/:shortURL", (req, res) => {
  for(var userID in users){
    for(var shortURL in urlDatabase[userID]){
      if (shortURL === req.params.shortURL){
        const longURL = urlDatabase[userID][shortURL];
        res.redirect(longURL);
      };
    };
  };
  res.sendStatus(404);
});

// GET the info on each shortened url
app.get("/urls/:id", (req, res) => {
  const userObj = req.cookies.user_id;
  if(userObj){
    let templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[userObj.id][req.params.id],
      user: userObj
    };
    console.log(templateVars);
    if(templateVars.longURL){
      res.render("urls_show", templateVars);
    } else {
      res.sendStatus(404);
    }
  }else{
    res.sendStatus(404);
  }
});

// POST the newly generated short url
app.post("/urls", (req, res) => {
  const userObj = req.cookies.user_id;
  if(userObj){
    const randomText = generateRandomString();
    if(req.body.longURL){
      urlDatabase[userObj.id][randomText] = req.body.longURL;
      res.redirect(`/urls/${randomText}`);
    } else {
      res.sendStatus(400);
    }
  }else{
    res.sendStatus(401);
  }
});

// POST the updated short url
app.post("/urls/:id", (req, res) => {
  const userObj = req.cookies.user_id;
  if(userObj){
    if(req.body.longURL){
      urlDatabase[userObj.id][req.params.id] = req.body.longURL;
    }
    res.redirect(`/urls`);
  }else{
    res.sendStatus(401);
  }
});

// POST for value deletion
app.post("/urls/:id/delete", (req, res) => {
  const userObj = req.cookies.user_id;
  if(userObj){
    delete(urlDatabase[userObj.id][req.params.id]);
    res.redirect('/urls');
  }else{
    res.sendStatus(401);
  }
});

app.get("/login", (req, res) => {
  if(req.cookies.user_id){
    res.redirect('/urls');
  }else{
    res.render("urls_login");
  }
});

app.get("/register", (req, res) => {
  if(req.cookies.user_id){
    res.redirect('/urls');
  }else{
    res.render("urls_register");
  }
});

// POST the user_id into cookie for logging in
app.post("/login", (req, res) => {
  const {email, password} = req.body;
  const hashedPassword = bcrypt.hashSync(password, 14);
  for(const id in users){
    if(email === users[id].email && bcrypt.compareSync(password, hashedPassword)){
      res.cookie('user_id', users[id]);
      res.redirect('/urls');
    }
  }
  res.sendStatus(400);
});

// POST the registration form information to user database
// initialize user data and url database for the new user
app.post("/register", (req, res) => {
  const {email, password} = req.body;
  for(const id in users){
    if(email === users[id].email){
      res.sendStatus(400);
    }
  }
  if(!!email && !!password){
    const user_id = generateRandomString();
    users[user_id] = {
      id: user_id,
      email: email,
      password: bcrypt.hashSync(password, 14)
    };
    console.log(users[user_id]);
    urlDatabase[user_id] = {};
    res.cookie('user_id', users[user_id]);
    res.redirect('/urls');
  } else {
    res.sendStatus(400);
  }
})

// POST the cookie clearance for logging out
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

// For marking if the server ran
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
