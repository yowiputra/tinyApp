var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/notfound", (req, res) => {
  res.render("urls_notfound");
});

app.get("/u/:shortURL", (req, res) => {
  var longURL = urlDatabase[req.params.shortURL];
  if(longURL){
    res.redirect(longURL);
  } else {
    res.sendStatus(404);
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  if(templateVars.longURL){
    res.render("urls_show", templateVars);
  } else {
    res.sendStatus(404);
  }
});

app.post("/urls", (req, res) => {
  var randomText = generateRandomString();
  urlDatabase[randomText] = req.body.longURL;
  if(req.body.longURL){
    res.redirect(`/urls/${randomText}`);
  } else {
    res.sendStatus(400);
  }
});

app.post("/urls/:id", (req, res) => {
  if(req.body.longURL){
    urlDatabase[req.params.id] = req.body.longURL;
  }
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete(urlDatabase[req.params.id]);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
