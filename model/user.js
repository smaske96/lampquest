var con = require('../scripts/db_connection.js').connection; // For database connection
var md5 = require('md5'); // For server side encryption

var PlanetUser = require('../model/planet_user.js');

class User {
    // Constructor to set username and password of the user
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    // Check if the username is valid or not
    isValid(callback) {
        var sql = "SELECT 1 FROM user WHERE username = ? AND password = ?";
        var valid = false;
        con.query(sql, [this.username, md5(this.password)], function (err, result) {
            if (err) throw err;
                
            
            if(result.length == 1) 
                callback(null, true);
            else
                callback(null, false);
        });
    }
    
    // Check is a username if available or not
    isUsernameAvailable(callback) {
        var sql = "SELECT 1 FROM user WHERE username = ?";
        con.query(sql, [this.username], function (err, result) {
            if (err) throw err;
                            
            if(result.length == 0) 
                callback(null, true);
            else
                callback(null, false);
        });
    }
    
    
    // Add a new valid user into the database
    addUser(callback) {
        var self = this;
        
        // Check if given username is available.
        this.isUsernameAvailable(function(err, available) {
            if(available) {
                var sql = "INSERT INTO user (username, password) VALUES (?,?)";
                con.query(sql, [self.username, md5(self.password)], function (err, result) {
                    if (err) throw err;
                        
                    
                    // Assign a planet of difficulty 1 to the new user
                    var planet_user = new PlanetUser(result.insertId);
                    
                    planet_user.addNewPlanet(1, function(err_planet, result_planet) {
                        if (err_planet) {
                            throw error_planet;
                            return;
                        }
                        callback(null,true);
                    });
                });
            }
            else {
                callback(null, false);
            }
        });
        
    }
    
    // Fetch user parameters (user_id, username, experience) from the database
    getParameters(callback) {
        var self = this;
        // First check if user is valid 
        this.isValid(function (err, valid) {
            if (err) throw err;
            if(valid) {
                var sql = "SELECT user_id, username, experience FROM user WHERE username = ? AND password = ?";
                con.query(sql, [self.username, md5(self.password)], function (err, result) {
                    if (err) {
                        throw err;
                        return;
                    }
                    
                    if(result.length == 1) 
                        callback(null,result[0]);
                    else 
                        callback({name:"DatabaseValueError",message:"Multiple users identified with same username/password"},null);
                });
            }
            else { //Invalid Username/Password
                callback({name:"Unauthorized",message:"Invalid Username/Password"},null);
            }
        });
    };
    
}

module.exports = User;