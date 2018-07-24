var express = require("express");
var router  = express.Router();


var User = require('../model/user.js');

router.post('/user/login',function(req,res){
    if(req.body.inputUsername && req.body.inputPassword) {
        req.session.uname = req.body.inputUsername;
        req.session.pword = req.body.inputPassword;
        
        if(req.body.inputRemember) {
            res.cookie('uname', req.session.uname);
            res.cookie('pword', req.session.pword);
        }
    }
    
    if(!req.session.uname || !req.session.pword) {
        res.redirect('/');
    }
    else {
        var user = new User(req.session.uname, req.session.pword);
        user.isValid(function(err, result) {
            if(err) throw err;
            if(result) {
                res.redirect('/home');
            }    
            else {
                res.redirect('/');
            }
        });
    }
    
});


router.post('/user/valid', function(req, res) {
    
    if(!req.session.uname || !req.session.pword) {
        res.send('new');
    }
    else {
        var user = new User(req.session.uname, req.session.pword);
         user.isValid(function(err, result) {
            if(err) throw err;
            if(result) {
                res.redirect('/home');
            }    
            else {
                res.send('invalid');
            }
        });
    }
});


//Check if username is available
router.get('/user/uname/available', function(req, res) {
    var username = req.query['username'];
    var user = new User(username, '');
    
    user.isUsernameAvailable(function(err, available) {
        if(err) throw err;
        res.send(available);
    });
});

//Add new user
router.post('/user/addnew', function(req,res) {
    var username = req.body.inputUsername;
    var password = req.body.inputPassword;
    
    req.session.uname = username;
    req.session.pword = password;
    
    //Validate if data is correct
    if(username.length < 3 || username.length > 255 || password.length < 3 || password.length > 255) {
        res.redirect('/');
    }
    
    var user = new User(username, password);
    user.isUsernameAvailable(function(err, available) {
        if(err) throw err;
        
        if(!available) {
            res.redirect('/');
        }
        
        user.addUser(function(err, success) {
            if(err) throw err;
            
            if(success) {   
                res.redirect('/home');
            }
            else {
                res.redirect('/');
            }
        });
    });
});

//Sign out
router.get('/user/signout', function(req,res) {
    req.session.destroy();
    res.clearCookie("uname");
    res.clearCookie("pword");
    res.redirect('/');
    
});

router.get('/user/parameters', function(req, res) {
    var user = new User(req.session.uname, req.session.pword);
    user.getParameters(function(err, response) {
        if(err) throw err;
        if(response) {
            res.send(response);
        }
        else { //If not valid user
            throw {name:"Invalid User Session", message:"Username or Password in the session is invalid"};
        }
    });
});


module.exports = router;