var express = require("express");
var router  = express.Router();

var User = require('../model/user.js');
var PlanetUser = require('../model/planet_user.js');

// Sends active planet_user parameters over HTTP GET 
router.get('/planet_user/parameters',function(req,res){
    var user = new User(req.session.uname, req.session.pword);
    //Check if session is valid and get user_id
    user.getParameters(function(err_user, user_response) {
        if (err_user) throw err_user;
        
        var planet_user = new PlanetUser(user_response.user_id);
        planet_user.getParameters(function(err_planet_user, planet_user_response) {
            if (err_planet_user) throw err_planet_user;
            res.send(planet_user_response);
        });
    });
});

// Send currently available energy in the planet 
router.get('/planet_user/getEnergy',function(req,res){
    var user = new User(req.session.uname, req.session.pword);
    
    //Check if session is valid and get user_id
    user.getParameters(function(err_user, user_response) {

        if (err_user) throw err_user;
        
        var planet_user = new PlanetUser(user_response.user_id);
        planet_user.getAvaliableEnergy(function(err_planet_user, energy) {
            if (err_planet_user) throw err_planet_user;
            res.send({'energy':energy});
        });
    });
});


// Send the required items in the planet 
router.get('/planet_user/goals', function(req, res) {
    var user = new User(req.session.uname, req.session.pword);
    
    user.getParameters(function(err_user, user_response) {
        if (err_user) throw err_user;
        
        var planet_user = new PlanetUser(user_response.user_id);
        planet_user.getGoals(function(err_planet_user, planet_user_response) {
            if (err_planet_user) throw err_planet_user;
            res.send(planet_user_response);
        });
    });
});

// Send the items that are owned by the user in the planet
router.get('/planet_user/owned', function(req, res) {
    var user = new User(req.session.uname, req.session.pword);
    
    user.getParameters(function(err_user, user_response) {
        if (err_user) throw err_user;
        
        var planet_user = new PlanetUser(user_response.user_id);
        planet_user.getOwnedItems(function(err_planet_user, planet_user_response) {
            if (err_planet_user) throw err_planet_user;
            res.send(planet_user_response);
        });
    });
});

// Handle production catch-up and periodic updates 
router.get('/planet_user/update_production', function(req, res) {
    var user = new User(req.session.uname, req.session.pword);
    
    user.getParameters(function(err_user, user_response) {

        if (err_user) throw err_user;
        
        var planet_user = new PlanetUser(user_response.user_id);
        planet_user.updateProduction(true, function(err, result) {
            if (err) throw err;
            res.send(result);
        });
    });
});

// Send boolean response if the planet quest is completed or not
router.get('/planet_user/check_if_completed', function(req, res) {
    var user = new User(req.session.uname, req.session.pword);
    
    user.getParameters(function(err_user, user_response) {
		
        if (err_user) throw err_user;
            
        
        var planet_user = new PlanetUser(user_response.user_id);
        planet_user.checkIfCompleted(function(err, result, all_completed) {
            if(err) throw err;
            if(all_completed) {
                res.send({'all_completed':true});
            }
            else if(result){
                res.send({'completed':true});
            }
            else {
                res.send({'completed':false});
            }
        });
    });
});

// Reset the planet to original state.
router.get('/planet_user/reset', function(req,res) {
    var user = new User(req.session.uname, req.session.pword);
    
    user.getParameters(function(err_user, user_response) {
        if(err_user) throw err_user;
        
        var planet_user = new PlanetUser(user_response.user_id);
        planet_user.resetPlanet(function(err, result) {
            if(err) throw err;
            if(result) {
                console.log("Redirect Revert");
                res.redirect('/home');
            }
        });
    });
});

module.exports = router