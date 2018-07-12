var express = require("express");
var app     = express();
var path    = require("path"); //Required for sending files 

// Requierd for establishing user session
var session = require('express-session');
app.use(session({secret:'$#cr#t'}));

// Required for using cookies
var cookieParser = require('cookie-parser');
app.use(cookieParser());

// Used for evaluating post requests
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/static')); // Set up the static files (such as image, front end js scripts) location 

// Routers used in the application
// Routers provide a API for handling HTTP requests
app.use(require('./routers/user.js'));
app.use(require('./routers/planet_user.js'));
app.use(require('./routers/robot_types.js'));

// Import the model User
var User = require('./model/user.js');

// Defines action for the root of the application (Eg. http://localhost:3000/)
app.get('/',function(req,res){
    //If cookies are present, load the session from the cookies
   if(req.cookies.uname && req.cookies.pword) {
        req.session.uname = req.cookies.uname;
        req.session.pword = req.cookies.pword;
   }       
   
    //If session is not set, the render index.html (i.e. login page)
  if(!req.session.uname || !req.session.pword) {  
    res.sendFile(path.join(__dirname+'/index.html'));
  }
  else {
    //If session is set, check if the user session is valid or not.
    var user = new User(req.session.uname, req.session.pword);
    user.isValid(function(err, response) {
        if(err) {
            throw err;
            return;
        }
        if(response) {
            // If valid, redirect to the home page (the main page for the game). 
            res.redirect('/home');
        }
        else {
            // Otherwise, render the index.html (i.e. login page)
            res.sendFile(path.join(__dirname+'/index.html'));
        }
    });
    
  }
});

// Defines action for the home page of the application (the main page for the game).
app.get('/home',function(req,res){
   //If user session is not present, render index.html
   if(!req.session.uname || !req.session.pword) {  
        res.sendFile(path.join(__dirname+'/index.html'));
  } 
  else {  
    //If user session is present, render home.html
    res.sendFile(path.join(__dirname+'/home.html'));
  }
});

// Open the server at port 3000
app.listen(3000);

console.log("Running at Port 3000");