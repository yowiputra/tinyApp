var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

// Initial Database
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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
  if(req.cookies.username){
    res.redirect('/urls');
  }else{
    res.redirect('/login');
  }
});

// GET the json file of database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// GET the index page
app.get("/urls", (req, res) => {
  if(req.cookies.username){
    let templateVars = {
      urls: urlDatabase,
      username: req.cookies.username
    };
    res.render("urls_index", templateVars);
  }else{
    res.sendStatus(401);
  }
});

// GET the new input page
app.get("/urls/new", (req, res) => {
  if(req.cookies.username){
    let templateVars = {
      username: req.cookies.username
    };
    res.render("urls_new", templateVars);
  }else{
    res.redirect('/login');
  }
});

// GET the redirection towards the actual site
app.get("/u/:shortURL", (req, res) => {
  var longURL = urlDatabase[req.params.shortURL];
  if(longURL){
    res.redirect(longURL);
  } else {
    res.sendStatus(404);
  }
});

// GET the info on each shortened url
app.get("/urls/:id", (req, res) => {
  if(req.cookies.username){
    let templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id],
      username: req.cookies.username
    };
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
  if(req.cookies.username){
    var randomText = generateRandomString();
    urlDatabase[randomText] = req.body.longURL;
    if(req.body.longURL){
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
  if(req.cookies.username){
    if(req.body.longURL){
      urlDatabase[req.params.id] = req.body.longURL;
    }
    res.redirect(`/urls`);
  }else{
    res.sendStatus(401);
  }
});

// POST for value deletion
app.post("/urls/:id/delete", (req, res) => {
  if(req.cookies.username){
    delete(urlDatabase[req.params.id]);
    res.redirect('/urls');
  }else{
    res.sendStatus(401);
  }
});

app.get("/login", (req, res) => {
  if(req.cookies.username){
    res.redirect('/urls');
  }else{
    res.render("urls_login");
  }
});

app.get("/register", (req, res) => {
  if(req.cookies.username){
    res.redirect('/urls');
  }else{
    res.render("urls_register");
  }
});

// POST the username into cookie for logging in
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

// POST the cookie clearance for logging out
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/login');
});

// For marking if the server ran
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
