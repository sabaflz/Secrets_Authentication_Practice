require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
// level 2 : const encrypt = require('mongoose-encryption');
// level 3 : const md5 = require("md5");
// level 4 : const bcrypt = require('bcrypt');
// level 4 : const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// SESSION
app.use(session({
  secret: "Our little secret!",
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});
// encryption
userSchema.plugin(passportLocalMongoose);


//only encrypt certain fields
// userSchema.plugin(encrypt, {secret: process.env.SECRET , encryptedFields: ["password"] });


const User = new mongoose.model("User", userSchema);

//Use passportLocalMongoose
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//----------------- Routes -----------------

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/secrets", function(req, res) {
  // if(req.isAuthenticated()){
  //   res.render("secrets");
  // }else{
  //   res.redirect("/login");
  // }

  //everyone can see the secrets
  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if(err){
      console.log(err);
    }else{
      if(foundUsers){
        res.render("secrets" , {usersWithSecrets: foundUsers});
      }
    }
  });

});

app.get("/submit", function(req, res) {
  if(req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }

});

app.post("/submit" , function(req, res){
  const submittedSecret = req.body.secret;
  // console.log(req.user);
  User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res) {

  User.register({username: req.body.username} , req.body.password , function(err , user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

  //level 4 security
  // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
  //   const newUser = new User({
  //     email: req.body.username,
  //     password: hash
  //   });
  //
  //   newUser.save(function(err) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       res.render("secrets");
  //     }
  //   });
  // });

});

app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username ,
    password: req.body.password
  });

  //using passport to login user
  req.login(user, function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

  //level 4 security
  // const username = req.body.username;
  // const password = req.body.password;
  //
  // User.findOne({
  //   email: username
  // }, function(err, foundUser) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     if (foundUser) {
  //       bcrypt.compare(password, foundUser.password, function(err, result) {
  //         if (result == true) {
  //           res.render("secrets");
  //         }
  //       });
  //
  //     }
  //   }
  // });

});








app.listen(3000, function() {
  console.log("Server started on port 3000");
});
