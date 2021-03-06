var pool = require('../scripts/db_connection.js').connection_pool; // For database connection
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
        var self = this;
		
		if(!self.username || !self.password) {
			callback(null, false);
			return;
		}
        
        var sql = "SELECT 1 FROM user WHERE username = ? AND password = ?";
        pool.getConnection(function(con_err, con) {
            if(con_err) {
                console.log("Error - " + Date() + "\nUnable to connect to database.");
                callback(con_err);
                return;
            }
            
            con.query(sql, [self.username, md5(self.password)], function (err, result) {
                if (err) {
                    console.log('Error encountered on ' + Date());
                    console.log(err);
                    callback(err);
                    con.release();
                    return;
                } 
                
                if(result.length == 1) 
                    callback(null, true);
                else
                    callback(null, false);
                
                con.release();
            });
        });
    }
    
    // Check is a username if available or not
    isUsernameAvailable(callback) {
        var self = this;
        
        var sql = "SELECT 1 FROM user WHERE username = ?";
        pool.getConnection(function(con_err, con) {
            if(con_err) {
                console.log("Error - " + Date() + "\nUnable to connect to database.");
                callback(con_err);
                return;
            }
            
            con.query(sql, [self.username], function (err, result) {
                if (err) {
                    console.log('Error encountered on ' + Date());
                    console.log(err);
                    callback(null, false);
                    con.release();
                    return;
                } 
                             
                if(result.length == 0) 
                    callback(null, true);
                else
                    callback(null, false);
                
                
                con.release();
            });
        });
    }
    
    
    // Add a new valid user into the database
    addUser(callback) {
        var self = this;
        
        // Check if given username is available.
        self.isUsernameAvailable(function(err, available) {
            if (err) callback(err);
            if(available) {
                var sql = "INSERT INTO user (username, password) VALUES (?,?)";
                pool.getConnection(function(con_err, con) {
                    if(con_err) {
                        console.log("Error - " + Date() + "\nUnable to connect to database.");
                        callback(con_err);
                        return;
                    }
            
                    con.query(sql, [self.username, md5(self.password)], function (err, result) {
                        if (err) {
                            console.log('Error encountered on ' + Date());
                            console.log(err);
                            callback(null, false);
                            con.release();
                            return;
                        } 
                        
                        // Assign a planet of difficulty 1 to the new user
                        var planet_user = new PlanetUser(result.insertId);
                        
                        planet_user.addNewPlanet(1, function(err_planet, result_planet) {
                            if (err_planet) {
                                console.log('Error encountered on ' + Date());
                                console.log(err_planet);
                                callback(null, false);
                                con.release();
                                return;
                            }
                            callback(null,true);
                            con.release();
                        });
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
        self.isValid(function (err, valid) {
            if (err) {
                callback(err);
                return;
            }
            if(valid) {
                var sql = "SELECT user_id, username, experience FROM user WHERE username = ? AND password = ?";
                pool.getConnection(function(con_err, con) {
                    if(con_err) {
                        console.log("Error - " + Date() + "\nUnable to connect to database.");
                        callback(con_err);
                        return;
                    }
            
                    con.query(sql, [self.username, md5(self.password)], function (err, result) {
                        if (err) {
                            console.log('Error encountered on ' + Date());
                            console.log(err);
                            callback(null, null);
                            con.release();
                            return;
                        } 
                        
                        if(result.length == 1) 
                            callback(null,result[0]);
                        else 
                            callback({name:"DatabaseValueError",message:"Multiple users identified with same username/password"},null);
                        
                        con.release();
                    });
                });
            }
            else { //Invalid Username/Password
                callback({name:"Unauthorized",message:"Invalid Username/Password"},null);
            }
        });
    };
    
}

module.exports = User;