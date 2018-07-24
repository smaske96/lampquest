var con = require('../scripts/db_connection.js').connection;

class RobotType {
    constructor (robot_type_id) {
        this.robot_type_id = robot_type_id;
    }
    
    //Returns if the robot_type is a combiner or diffusor 
    getType(callback) {
        var self = this;
        
        var sql = "SELECT \
                          combiner_id IS NOT NULL AS is_combiner, \
                          diffusor_id IS NOT NULL AS is_diffusor \
                    FROM robot_type \
                        LEFT JOIN combiner ON robot_type_id = combiner_id \
                        LEFT JOIN diffusor ON robot_type_id = diffusor_id \
                    WHERE robot_type_id = ?";
            
        con.query(sql, [self.robot_type_id], function (err, result) {
            if (err) throw err;
            
            if(result.length != 1) {
                callback({name: "Database value error", message:"No robot type found!"},null);
            }
            else {
                if(result[0].is_combiner) {
                    callback(null, "combiner");
                }
                else if(result[0].is_diffusor) {
                    callback(null, "diffusor");
                }
                else {
                    // Error
                    callback({name:"Database value error", message:"Robot type is neither diffusor nor combiner!"},null);
                }
            }
        });
    }
    
    // Returns all the parameters of the robot type 
    // The parameter will be in following format:
    /**
    {
        robot_type_id: ...,
        robot_type: (name of robot type),
        image: ...,
        time_req: (time required for each production),
        energy: energy required or released in each production,
        cost: initial energy cost,
        type: combiner or diffusor,
        produce: [{item_id: ..., item: (item name), qty (if diffusor): (qty produced in each production)}, ... ],
        consume: [{item_id: ..., item: (item name), qty (if consumer): (qty consumed in each production)}, ... ],
    }
    **/
    getParameters(callback) {
        var self = this;
        
        var type_id = self.robot_type_id;
        
        self.getType(function(err, type) {
            if(err) throw err;
            if(type == "combiner") {
                var sql = "SELECT \
                                robot_type_id, \
                                robot_type_name, \
                                robot_type_image, \
                                time_required, \
                                initial_energy_cost, \
                                c.item_id consume_item_id, \
                                c.item_name consume_item, \
                                qty_consumed, \
                                qty_produced, \
                                p.item_id produce_item_id, \
                                p.item_name produce_item, \
                                energy_required \
                           FROM robot_type \
                              INNER JOIN combiner ON robot_type_id = combiner_id  \
                              NATURAL JOIN consume_combiner \
                              INNER JOIN item c ON consume_item_id = c.item_id \
                              INNER JOIN item p ON produce_item_id = p.item_id \
                           WHERE robot_type_id = ?";
                           
                con.query(sql, [type_id], function (err, records) {
                    if (err) throw err;
                    
                    var result = {};
                    result.robot_type_id = records[0].robot_type_id;
                    result.robot_type = records[0].robot_type_name;
                    result.image      = records[0].robot_type_image;
                    result.time_req   = records[0].time_required;
                    result.energy     = records[0].energy_required;
                    result.cost       = records[0].initial_energy_cost;
                    result.type       = type;
                    
                    // Only single item will be produced for combiner, so all rows will contain same produce items
                    result.produce = [{  'item_id'   : records[0].produce_item_id, 
                                            'item'      : records[0].produce_item
                                     }];
                    
                    // Add all consuming items in an array
                    result.consume = [];
                    records.forEach(function(item) {
                        result.consume.push({    'item_id'   :   item.consume_item_id, 
                                                    'item'      :   item.consume_item,
                                                    'qty'       :   item.qty_consumed
                                              });
                        if(result.consume.length == records.length) callback(null, result);
                    });
                });
            }
            else {
                var sql = "SELECT \
                                robot_type_id, \
                                robot_type_name, \
                                robot_type_image, \
                                time_required, \
                                initial_energy_cost, \
                                c.item_id consume_item_id, \
                                c.item_name consume_item, \
                                energy_released, \
                                energy_limit, \
                                p.item_id produce_item_id, \
                                p.item_name produce_item, \
                                qty_produced, \
                                qty_consumed \
                           FROM robot_type \
                              INNER JOIN diffusor ON robot_type_id = diffusor_id \
                              NATURAL JOIN produce_diffusor \
                              INNER JOIN item c ON consume_item_id = c.item_id \
                              INNER JOIN item p ON produce_item_id = p.item_id \
                           WHERE robot_type_id = ?";

                con.query(sql, [type_id], function (err, records) {
                    if(err) throw err;
                    var result = {};
                    result.robot_type_id = records[0].robot_type_id;
                    result.robot_type   = records[0].robot_type_name;
                    result.image        = records[0].robot_type_image;
                    result.time_req     = records[0].time_required;
                    result.energy_limit = records[0].energy_limit;
                    result.energy       = records[0].energy_released;
                    result.cost       = records[0].initial_energy_cost;
                    result.type = type;
                    
                    // Only single item will be consumed for diffusor. So all row will contain same consume item
                    result.consume = [{  'item_id'   : records[0].consume_item_id, 
                                            'item'      : records[0].consume_item
                                        }];
                    
                    // Add all producing items in an array
                    result.produce = [];
                    records.forEach(function(item) {
                        result.produce.push({  'item_id' : item.produce_item_id, 
                                                  'item'    : item.produce_item, 
                                                  'qty'     : item.qty_produced
                                              });  
                        if(result.produce.length == records.length) callback(null, result);
                    });
                    
                    
                });
            }
        
        });
        
    }
    
    // Fetch all robot type ids in the database. 
    fetchAllRobotTypeIds(callback){
        var sql = "SELECT robot_type_id FROM robot_type";
        con.query(sql, [], function (err, result) {
            if(err) throw err;
            
            var ids = [];
            result.forEach(function(item) {
                ids.push(item.robot_type_id);
                if(ids.length == result.length) callback(null, ids);
            });
        });
    }
    
}

module.exports = RobotType;