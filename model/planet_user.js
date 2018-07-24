var con = require('../scripts/db_connection.js').connection;

var Robot = require('../model/robot.js');

class PlanetUser {
    constructor(user_id, planet_id) {
        this.user_id = user_id;
        this.planet_id = planet_id;
    }
    
    // Adds new planet to the user with given difficulty.
    addNewPlanet(difficulty, callback) {
        var self = this;
        
        var sql = "INSERT INTO planet_user (planet_id, user_id, energy) \
                        SELECT planet_id, ?, initial_energy \
                        FROM planet \
                        WHERE difficulty_level = ? \
                        LIMIT 1";
        con.query(sql, [self.user_id, difficulty], function (err, result) {
            if (err) throw err;
               
            
            // If there are no new planets available, return false
            if(result.affectedRows == 0) {
                callback(null, false);
            }
            else {
                //Add initial resources for the new planet to the user
                var sql_1 = "INSERT INTO planet_user_item (planet_user_id, item_id, owned_qty) \
                                SELECT planet_user_id, item_id, available_qty \
                                FROM planet_item_init_resource NATURAL JOIN planet_user \
                                WHERE planet_user_id = ?";
                
                // insertId of result is the auto_increment number (i.e. user_id) inserted by the first query.
                con.query(sql_1, [result.insertId], function (err_1) {
                    if(err_1) throw err_1;
                       
                    
                    callback(null, true);
                    
                });
            }
        });
    }
    
    // Return the callback function with planet user parameters 
    getParameters(callback) {
        var self = this;
        
        // If both planet id and user id are available, extract data for the particular planet and user
        if(self.user_id && self.planet_id) {
            var sql = "SELECT planet_user_id, planet_name, planet_image, difficulty_level \
                        FROM planet_user NATURAL JOIN planet \
                        WHERE user_id = ? AND planet_id = ?";
            con.query(sql, [self.user_id, self.planet_id], function (err, result) {
                if (err) throw err;
                callback(null, result[0]);
            });
        }
        // If only user id is available, the extract data for the active planet (i.e. completed = 0)
        else if(self.user_id) {
            var sql = "SELECT planet_user_id, planet_name, planet_image, difficulty_level \
                        FROM planet_user NATURAL JOIN planet \
                        WHERE user_id = ? AND completed = 0";           
            con.query(sql, [self.user_id], function (err, result) {
                if (err) throw err;
                if(result.length == 0) {
                    // No active planet found. 
                    // Check if there is new planet is available 
                    var check_new = "SELECT MIN(difficulty_level) AS difficulty \
                                     FROM planet \
                                     WHERE planet_id NOT IN ( \
                                            SELECT planet_id \
                                            FROM planet_user \
                                            WHERE user_id = ? AND completed = 1\
                                     )";
                    con.query(check_new, [self.user_id], function(err_new, result_new) {
                        if(err_new) throw err_new;
                        if(result_new.length == 0) {
                            // No new planet found
                            callback(null, null);
                        }
                        else {
                            self.addNewPlanet(result_new.difficulty, function(err_add, result_add) {
                                if (err_add) throw err_add;
                                
                                if(result_add) {
                                    // If new planet is successfully added, call getParameters again. 
                                    self.getParameters(callback);
                                }
                                else {
                                    // If new planet not added
                                    callback(null, null);
                                }
                                
                            });
                        }
                    });                 
                    
                    
                    
                    
                }
                else {
                    callback(null, result[0]);
                }
            });
        } 
    }
    
    // Returns the callback function with available energy in the active planet.
    getAvaliableEnergy(callback) {
        var self = this;
        
        if(self.user_id) {
            var sql = "SELECT energy \
                        FROM planet_user NATURAL JOIN planet \
                        WHERE user_id = ? AND completed = 0";           
            con.query(sql, [self.user_id], function (err, result) {
                if (err) throw err;
                if(result.length == 0) 
                    callback(null, null);
                else 
                    callback(null, result[0].energy);
            });
        } 
    }
    
    // Returns the required goals for the current planet
    getGoals(callback) {
        var self = this;
        
        if(self.user_id) {
            var sql = "SELECT item_name, item_image, required_qty \
                        FROM planet_item_goal NATURAL JOIN planet_user NATURAL JOIN item \
                        WHERE user_id = ? AND completed = 0";
            con.query(sql, [self.user_id], function (err, result) {
                if (err) throw err;
                
                callback(null, result);
            });
        }
    }
    
    // Returns the owned item with their quantities in the active planet 
    getOwnedItems(callback) {
        var self = this;
        
        if(self.user_id) {
            // planet_user_item may contain multiple entires for same item, so the owned quantity is aggregated 
            var sql = "SELECT item_id, MAX(item_name) item_name, MAX(item_image) item_image, SUM(owned_qty) owned_qty \
                        FROM planet_user_item NATURAL JOIN planet_user NATURAL JOIN item \
                        WHERE user_id = ? AND completed = 0\
                        GROUP BY item_id \
                        HAVING SUM(owned_qty) > 0";
            con.query(sql, [self.user_id], function (err, result) {
                if (err) throw err;
                
                callback(null, result);
            });
        }
    }
    
    // Returns the list of enabled robot ids in the planet 
    getEnabledRobots(callback) {
        var self = this;
        
        if(self.user_id) {
            var sql = "SELECT DISTINCT robot_id \
                        FROM robot NATURAL JOIN planet_user NATURAL LEFT JOIN ( \
                            SELECT * \
                            FROM item_robot \
                            WHERE build_end_time IS NULL \
                        ) AS ir \
                        WHERE user_id = ? AND completed = 0 \
                            AND enabled = 1 \
                        ORDER BY build_start_time";
            con.query(sql, [self.user_id], function (err, result) {
                if (err) throw err;
                
                callback(null, result);
            });
        }
    }
    
    // Updates the production of the enabled robots in the planet 
    // Performs both periodic updated and catch-up updates in the planet
    updateProduction(first_call, callback) {  
        // first_call variable is used so that in multiple calls of this method during the recursion, only one final callabck is issued.
        var self = this;
        
        self.catchup_required = false; //Flag to check if catchup is required
        
        // Produce a single robot
        var produce = function(robot_id, callback) {
            var robot = new Robot(robot_id);
            robot.startProduction(callback);
        };
        
        // Produce from multiple robots sequentially
        var produce_multiple = function(robot_ids, process) {
            var i = 0;
            
            function next() {
                if(i < robot_ids.length) {
                    process(robot_ids[i++].robot_id, function(err_produce, result_produce, repeat){
                        if(err_produce) throw err_produce;
                           
                        console.log(robot_ids[i-1].robot_id);
                        // repeat flag is set if the robot can again produce items.
                        if(repeat) self.catchup_required = true;
                        next();
                    });
                } 
                else {
                    // Recursively catch up if any one of the robot can produce more.
                    if(self.catchup_required) {
                        self.updateProduction(false, callback);
                    }
                    
                    if(first_call) callback(null, true);
                }
            }
            
            next();
        };
        
        self.getEnabledRobots(function(err, result) {
            if(err) throw err;
            
            produce_multiple(result, produce);
            
        });
    }
    
    // Check if the goals of the planet is reached.
    checkIfCompleted(callback) {
        var self = this;
        
        var sql = "SELECT COALESCE(owned_qty,0) owned_qty, required_qty \
                    FROM ( \
                        SELECT user_id, item_id, SUM(owned_qty) owned_qty \
                        FROM planet_user_item NATURAL JOIN planet_user \
                        WHERE completed = 0 \
                        GROUP BY user_id, item_id \
                        HAVING SUM(owned_qty) > 0 \
                    ) AS owned \
                    NATURAL RIGHT JOIN ( \
                        SELECT user_id, item_id, required_qty \
                        FROM planet_user NATURAL JOIN planet_item_goal \
                        WHERE completed = 0 \
                    ) AS goal \
                    WHERE user_id = ? \
                        AND COALESCE(owned_qty,0) < required_qty"; // Completed planet_user will return empty result 
        
        con.query(sql, [self.user_id], function (err, result) {
            if(err) 
                throw err;
            else if(result.length > 0) { //Planet is not completed yet.
                callback(null, false);
            }
            else {
                // Fetch current difficulty level to add new planet
                self.getParameters(function(err_params, result_params) {
                    if(err_params) throw err_params;
                    
                    
                    if(!result_params) { 
                        // There is no current planet. All planets are completed. 
                        // All planets are completed. No planet remaining.
                        callback(null, false, true);
                        return;
                    }
                    
                    var difficulty = result_params.difficulty_level;
                    
                    // If completed, update current planet `completed` field.
                    var update = "UPDATE planet_user \
                                    SET completed = 1 \
                                    WHERE user_id = ? AND completed = 0";
                                    
                    con.query(update, [self.user_id], function(err_update) {
                        if(err_update) throw err_update;
                        
                        // Add new planet of higher difficulty 
                        self.addNewPlanet(difficulty + 1, function(err_new, result_new) {
                            if(err_new) throw err_new;
                            //Check if new planet inserted successfully
                            if(result_new) {
                                
                                // Add experience point to user
                                var exp_pts = "UPDATE user SET experience = experience + ? WHERE user_id = ?";
                                con.query(exp_pts, [difficulty, self.user_id], function(err_exp) {
                                    if(err_exp) throw err_exp;
                                    
                                    callback(null, true);
                                });
                            }
                            else {
                                //No new planet were inserted 
                                // Set all completed flag in callback function
                                
                               
                                callback(null, false, true);
                            }
                            
                            
                        });
                    });

                    
                });
                
            }
        });
        
    }
    
    resetPlanet(callback) {
        var self = this;
        
        // Delete all log records for the planet 
        var del_log = "DELETE FROM item_robot \
                        WHERE robot_id IN ( \
                            SELECT robot_id FROM robot NATURAL JOIN planet_user WHERE user_id = ? AND completed = 0 \
                        )";
                        
        var del_robots = "DELETE FROM robot \
                            WHERE planet_user_id = ( \
                                SELECT planet_user_id \
                                FROM planet_user \
                                WHERE user_id = ? AND completed = 0 \
                            )";
        
        var del_owned_items = "DELETE FROM planet_user_item \
                               WHERE planet_user_id = ( \
                                SELECT planet_user_id \
                                FROM planet_user \
                                WHERE user_id = ? AND completed = 0 \
                              )";
                              
        var insert_init_items = "INSERT INTO planet_user_item (planet_user_id, item_id, owned_qty) \
                                SELECT planet_user_id, item_id, available_qty \
                                FROM planet_item_init_resource NATURAL JOIN planet_user \
                                WHERE user_id = ? AND completed = 0";
        
        var update_energy = "UPDATE planet_user pu \
                                INNER JOIN  planet p ON  p.planet_id = pu.planet_id \
                             SET pu.energy = p.initial_energy \
                             WHERE pu.user_id = ? AND completed = 0";
                                
        con.query(del_log, [self.user_id], function (err_del_log) {
            if(err_del_log) throw err_del_log;
            
            con.query(del_robots, [self.user_id], function (err_del_robots) {
                if(err_del_robots) throw err_del_robots;
                
                con.query(del_owned_items, [self.user_id], function (err_del_owned_items) {
                    if(err_del_owned_items) throw err_del_owned_items;
                    
                    con.query(insert_init_items, [self.user_id], function (err_insert_items) {
                        if(err_insert_items) throw err_insert_items;
                        
                        con.query(update_energy, [self.user_id], function (err_update_energy) {
                            if(err_update_energy) throw err_update_energy;
                            
                            callback(null, true);
                        });
                        
                    });
                });
                
            });
            
        });
    }

}


module.exports = PlanetUser;