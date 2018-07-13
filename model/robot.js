var con = require('../scripts/db_connection.js').connection;

var RobotType = require('../model/robot_type.js');
var moment = require('moment');

class Robot {
    // Constructor to set robot_id
    constructor(robot_id) {
        this.robot_id = robot_id;
    }
    
    // Get robot type (combiner/diffusor)
    getType(callback) {
        var sql = "SELECT robot_type_id FROM robot WHERE robot_id = ?";
        con.query(sql, [this.robot_id], function (err, result) {
            var robot_type = new RobotType(result[0].robot_type_id);
            
            robot_type.getType(function(err_type, type) {
                if(err_type) 
                    callback(err_type);
                else 
                    callback(null, type);
            });
        });
    }

    // Get robot parameters with the type parameters
    getParameters(callback) {
        var sql = "SELECT robot_id, robot_name, robot_type_id, enabled \
                    FROM robot \
                    WHERE robot_id = ?";
        con.query(sql, [this.robot_id], function (err, result) {
            if (err) throw callback(err, null);
            
            var robot_type = new RobotType(result[0].robot_type_id);
            //Fetch robot type parameters
            robot_type.getParameters(function (err, type_params){
                if (err) throw err;
                
                result[0].type = type_params;
                callback(null, result[0]);
            });
        });
    }
    
    // Fetch all robot_ids that the user own. 
    fetchAllRobotIds(user_id, callback) {
        var sql = "SELECT robot_id \
                    FROM robot \
                          NATURAL JOIN planet_user  \
                    WHERE user_id = ? AND completed = 0";
                    
        con.query(sql, [user_id], function (err, result) {
            if (err) callback(err, null);
            
            var ids = [];
            result.forEach(function(item) {
                ids.push(item.robot_id);
                if(ids.length == result.length) callback(null, ids);
            });
        });
    }
    
    
    
    
    
    
    //Check if the available energy is sufficient for creating new robot
    checkEnergyCost(user_id, robot_type_id, callback){
        var sql = "SELECT energy AS energy_available, \
                          initial_energy_cost AS energy_cost \
                    FROM planet_user CROSS JOIN robot_type \
                    WHERE user_id = ? AND completed = 0 AND robot_type_id = ?";
        con.query(sql, [user_id, robot_type_id], function (err, result) {
             if (err) throw callback(err, null);
             if(result[0].energy_cost > result[0].energy_available) {
                callback(null, false);
             }
             else {
                callback(null, true);
             }
         });            
                   
    }
    
    
    //Add new robot to the user in active planet
    addNewRobot(robot_type_id, user_id, callback){ 
        //Randomly generate a robot name. (Two uppercase characters followed by a random integer < 100)
        function getRandomRobotName(){
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            var prefix = "";
            
            for (var i = 0; i < 2; i++)
                prefix += possible.charAt(Math.floor(Math.random() * possible.length));
            
            return prefix + "-" + Math.floor(Math.random()*100);
    
        }
        
        // First check if initial energy cost is met 
        this.checkEnergyCost(user_id, robot_type_id, function (err, valid) {
            if (err) throw err;
            
            if(valid) {
                // Subtract the available energy in the planet
                var update = "UPDATE planet_user \
                              SET energy = energy - ( \
                                                        SELECT initial_energy_cost  \
                                                        FROM robot_type \
                                                        WHERE robot_type_id=? \
                                                    ) \
                              WHERE user_id = ? AND completed = 0";
                con.query(update, [robot_type_id, user_id], function (err_update) {
                    if (err) throw err_update;
                    
                    // Insert the robot record
                    var sql = "INSERT INTO robot (robot_name, planet_user_id, robot_type_id) \
                                SELECT ?, planet_user_id, ? \
                                FROM planet_user \
                                WHERE user_id = ? AND completed = 0";
                                
                    var robot_name = getRandomRobotName();
                    con.query(sql, [robot_name, robot_type_id, user_id], function (err_insert, result) {
                        if (err_insert) throw err_insert;
                        
                        callback(null, true);
                    });       
                    
                });              
            }
            else {
                // If energy is not sufficient, return false 
                callback(null, false);
            }
        });
    
    }
    
    // Sets or unset the enabled flag for the robot depending on previous value.
    toggleEnabled(callback) {
        var self = this;
        
        // Fetch current enabled value
        var sql = "SELECT enabled FROM robot WHERE robot_id = ?";
        con.query(sql, [self.robot_id], function(err, result) {
            var update = "UPDATE robot SET enabled = ? WHERE robot_id = ?";
            
            //Get new enabled value (opposite of previous) and update it
            var new_enabled = result[0].enabled == 0 ? 1 : 0;
            con.query(update,[new_enabled, self.robot_id], function(err_update) {
               if (err_update) throw err_update;
               
               // If enabled is turned off, delete the active record in item_robot
               if(new_enabled == 0) {
                    var del = "DELETE FROM item_robot WHERE robot_id = ? AND build_end_time IS NULL";
                    con.query(del, [self.robot_id], function(err_delete) {
                        if (err_delete) callback(err_delete);
                    });
               }
               // If enabled is turn on, insert new record in item_robot with start_time as current timestamp if the robot can produce
               else {
                    self.canBuild(self, function(err_build, can_build) {
                        if(err_build)
                            throw err_build;
                        else if(can_build) {
                            var insert = "INSERT INTO item_robot (item_id, robot_id) \
                                            SELECT COALESCE(d.produce_item_id, c.produce_item_id) item_id,  robot_id\
                                            FROM robot_type rt \
                                                NATURAL JOIN robot r \
                                                LEFT JOIN produce_diffusor d ON rt.robot_type_id = d.diffusor_id \
                                                LEFT JOIN combiner c ON rt.robot_type_id = c.combiner_id \
                                            WHERE \
                                                robot_id = ?";
                            con.query(insert, [self.robot_id], function(err_insert) {
                                if (err_insert) throw err_insert;
                                callback(null, true);
                            });
                        }
                        else {
                            //If robot cannot build, turn off enabled flag.
                            self.toggleEnabled(function(err_repeat, result_repeat){
                                callback(null, false);
                            });
                        }
                    });
               }
            });
        });
        
    }
    
    //Check if the robot can build new items or not
    canBuild(self, callback) {
        
        var robot_id = self.robot_id;
        
        // Check if there is sufficient qty of items required to produce.
        var sql_check_qty = "SELECT \
                                COALESCE(cc.consume_item_id, d.consume_item_id) item_id, \
                                SUM(COALESCE(pui.owned_qty,0)) owned_qty, \
                                MAX(COALESCE(cc.qty_consumed, d.qty_consumed)) req_quantity  \
                            FROM \
                                robot r \
                                LEFT JOIN consume_combiner cc \
                                    ON r.robot_type_id = cc.combiner_id \
                                LEFT JOIN diffusor d \
                                    ON r.robot_type_id = d.diffusor_id \
                                LEFT JOIN planet_user_item pui \
                                    ON r.planet_user_id = pui.planet_user_id \
                                        AND pui.item_id = COALESCE(cc.consume_item_id, d.consume_item_id)\
                            WHERE \
                                r.robot_id = ? AND r.enabled = 1 \
                            GROUP BY COALESCE(cc.consume_item_id, d.consume_item_id)";
        
        
        con.query(sql_check_qty, [robot_id], function (err, result) {
            if(err) callback(err, null);
            
            if(result.length == 0) { //If there are no items at all, then robot cannot produce
                callback(null, false);
            }
            else {
                var count = 0;
                var checkInvalid = false; //Flag to check if there is any insufficient resources
                result.forEach(function(record) {
                    //If one of the resources is not sufficient, flag is set
                    if(record.owned_qty < record.req_quantity) checkInvalid = true; 
                    
                    if(++count == result.length) {
                    //After checking all records...
                        if(checkInvalid) {
                            console.log("Quantity of required items not sufficient.");
                            callback(null, false);
                        }
                        else {
                            // Resources are sufficient
                            
                            // Check if energy is sufficient if it is combiner, check if energy limit is reached if diffusor
                            // so get the type of the robot first
                            self.getType(function(err_type, type){
                                if(err_type) throw err_type;
                                
                                if(type == "combiner") {
                                    //If combiner, check if energy is sufficient 
                                    var sql_check_energy = "SELECT 1 \
                                                            FROM robot r \
                                                                INNER JOIN combiner c ON r.robot_type_id = c.combiner_id \
                                                                INNER JOIN planet_user pu ON r.planet_user_id = pu.planet_user_id\
                                                            WHERE   \
                                                                r.robot_id = ? \
                                                                AND pu.energy >= c.energy_required";
                                    con.query(sql_check_energy, [robot_id], function (err_energy, result_energy) {
                                        if(err_energy) callback(err_energy);
                                        
                                        if(result_energy.length != 1) {
                                            console.log("Combiner " + robot_id + " requires more energy");
                                            callback(null, false)
                                        }
                                        else {
                                            callback(null, true);
                                        }
                                    });
                                }
                                else if(type == "diffusor") {
                                    //If diffusor, check if energy limit is reached
                                    var sql_check_energy = "SELECT r.robot_id \
                                                            FROM robot r \
                                                                INNER JOIN item_robot ir ON r.robot_id = ir.robot_id \
                                                                INNER JOIN diffusor d ON r.robot_type_id = d.diffusor_id AND d.consume_item_id = ir.item_id \
                                                            WHERE \
                                                                r.robot_id = ? \
                                                            GROUP BY r.robot_id \
                                                            HAVING SUM(d.energy_released) > MIN(energy_limit)";
                                    con.query(sql_check_energy, [robot_id], function (err_energy, result_energy) {
                                        if(err_energy) callback(err_energy);
                                        
                                        if(result_energy.length == 0) {
                                            callback(null, true);
                                        }
                                        else {
                                            console.log("Diffusor " + robot_id + " energy limit exceeded.");
                                            callback(null, false);
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            }
        });
    }
    
    
    produceItem(self, start_time, time_required, callback) {
        var robot_id = self.robot_id;
        
        var currTime = moment(); //Fetch current time
        console.log("start time: " + start_time);
        console.log("time req: " + time_required);
        console.log("Current time: " + currTime.format());
        
        // If the production time ( = start_time + time_required) is greater than current time, then cannot produce
        if(currTime.isBefore(moment(start_time).add(time_required,'seconds'))) {
            callback(null, false);
        }
        else {
            // If time is valid, then check if robot can produce or not
            self.canBuild(self, function(err, can_build) {
                if(err) throw err;
                if(can_build) {
                    //If robot can produce, proceed with the item production 
                    // Add item to owned (insert only, no update)
                    var sql_insert_item = "INSERT INTO planet_user_item (planet_user_id, item_id, owned_qty) \
                                        SELECT planet_user_id, \
                                            COALESCE(c.produce_item_id, pd.produce_item_id) item_id, \
                                            COALESCE(c.qty_produced, pd.qty_produced) qty_produced \
                                        FROM robot r \
                                            LEFT JOIN combiner c ON r.robot_type_id = c.combiner_id \
                                            LEFT JOIN produce_diffusor pd ON r.robot_type_id = pd.diffusor_id \
                                        WHERE \
                                            r.robot_id = ?";
                                            
                    // Update consuming item quantity (insert negative quantity)
                    var sql_update_item = "INSERT INTO planet_user_item (planet_user_id, item_id, owned_qty) \
                                        SELECT planet_user_id, \
                                            COALESCE(cc.consume_item_id, d.consume_item_id) item_id, \
                                            COALESCE(cc.qty_consumed, d.qty_consumed)*-1 qty_produced \
                                        FROM robot r \
                                            LEFT JOIN consume_combiner cc ON r.robot_type_id = cc.combiner_id \
                                            LEFT JOIN diffusor d ON r.robot_type_id = d.diffusor_id \
                                        WHERE \
                                            r.robot_id = ?";
                                            
                    // Update energy
                    var sql_update_energy = "UPDATE planet_user pu  \
                                                    INNER JOIN robot r ON pu.planet_user_id = r.planet_user_id \
                                            SET energy = energy + ? \
                                            WHERE r.robot_id = ?";
                    
                    // Update build log 
                    var sql_update_log = "UPDATE item_robot \
                                            SET build_end_time = ? \
                                        WHERE build_end_time IS NULL \
                                            AND robot_id = ?";
                    
                    // Insert new log record                        
                    var sql_insert_log = "INSERT INTO item_robot (item_id, robot_id, build_start_time) \
                                        SELECT COALESCE(d.produce_item_id, c.produce_item_id) item_id,  robot_id, ? \
                                        FROM robot_type rt \
                                            NATURAL JOIN robot r \
                                            LEFT JOIN produce_diffusor d ON rt.robot_type_id = d.diffusor_id \
                                            LEFT JOIN combiner c ON rt.robot_type_id = c.combiner_id \
                                        WHERE \
                                            robot_id = ?";
                    
                    // Insert item into planet_user_item
                    self.getParameters(function(err, params) {
                        con.query(sql_insert_item, [robot_id, params.type.qty_produced], function(err_insert, result_insert) {
                            if(err_insert) throw err_insert;
                            
                            console.log("Robot " + robot_id + " inserted production items.");
                            // Update consumed item's quantity
                            con.query(sql_update_item, [robot_id], function(err_update_item) {
                                if(err_update_item) throw err_update_item;
                                console.log("Robot " + robot_id + " updated consuming items.");
                                
                                var energy_used = (params.type.type == "combiner")?-1 * params.type.energy:params.type.energy;
                                
                                // Update planet_user energy
                                con.query(sql_update_energy, [energy_used,robot_id], function(err_update_energy) {
                                    if(err_update_energy) throw err_update_energy;
                                    console.log("Robot " + robot_id + " updated energy in planet.");
                                    
                                    var new_start_time = moment(start_time).add(time_required, 'seconds').format("YYYY-MM-DD HH:mm:ss");
                                    console.log("New start time: " + new_start_time);
                                    
                                    // Update the build end time in item_robot
                                    con.query(sql_update_log, [new_start_time, robot_id], function(err_update_log) {
                                        if(err_update_log) throw err_update_log;
                                        console.log("Robot " + robot_id + " updated build end time.");
                                        
                                        //Insert new log if new_start_time is before current time
                                        if(moment(new_start_time).isBefore(currTime)) {
                                            con.query(sql_insert_log, [new_start_time, robot_id], function(err_insert_log, result_insert_log) {
                                                console.log("Robot " + robot_id + " inserted new log.");
                                                if(err_insert_log) 
                                                    throw err_insert_log;
                                                else {
                                                    callback(null, true, true);
                                                }
                                            });
                                        }
                                        else {
                                            callback(null, true, false);
                                        }
                                    });
                                });

                            });
                            
                        });
    
                    });
                }
                else {
                    //If cannot build, callback false.
                    callback(null, false);
                }
            });
        }
    }
    
    
    startProduction(callback) {
        var self = this;
        //Start production with the build start time in the log. 
        var sql = "SELECT MAX(build_start_time) start_time, MAX(time_required) time_required  \
                    FROM item_robot NATURAL RIGHT JOIN robot NATURAL RIGHT JOIN robot_type\
                    WHERE robot_id = ? AND enabled = 1 AND build_end_time IS NULL";
                    
        con.query(sql, [this.robot_id], function(err, result) {
            if(err) {
                throw err;
            }
            else {
                //If build start time is not present, the start with current time.
                var start_time = (result[0].start_time)?moment(result[0].start_time).format("YYYY-MM-DD HH:mm:ss"):moment().format("YYYY-MM-DD HH:mm:ss");
                
                console.log("Robot " + self.robot_id + " : " + start_time);
                self.produceItem(self, start_time, result[0].time_required, function(err_produce, result_produce, repeat) {
                   if(err_produce) 
                       throw err_produce;
                   else
                       callback(null, result_produce, repeat);
                        
                });
                
            }
        });
    }
}

module.exports = Robot;