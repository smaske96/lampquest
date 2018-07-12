var express = require("express");
var router  = express.Router();

var User = require('../model/user.js');
var RobotType = require('../model/robot_type.js');
var Robot = require('../model/robot.js');

router.get('/robot_type/fetch_all',function(req,res){
    var user = new User(req.session.uname, req.session.pword);
    
    user.getParameters(function(err_user, user_response) {
        if (err_user) throw err_user;
        
        var results = [];
        var all_robot_types = new RobotType();
        all_robot_types.fetchAllRobotTypeIds(function(err, ids) {
            ids.forEach(function(robot_type_id) {
                var robot_type = new RobotType(robot_type_id);
                robot_type.getParameters(function(err_param, parameters) {
                    results.push(parameters);
                    if(results.length == ids.length) res.send(results);
                }); 
            });
        });
    });
});


router.get('/robot_type/addRobot', function(req, res) {
    var user = new User(req.session.uname, req.session.pword);
    
    user.getParameters(function(err_user, user_response) {
        if (err_user) throw err_user;
        
        var robot = new Robot();
        robot.addNewRobot(req.query.robot_type_id, user_response.user_id, function(err, result) {
            if(err) throw err;
            
            if(result) {
                res.redirect('/home')
            }
            else {
                res.redirect('/user/signout')
            }
        })
        
    });
});


router.get('/robot_type/robot/fetchAll', function(req,res) {
    var user = new User(req.session.uname, req.session.pword);
    
    user.getParameters(function(err_user, user_response) {
        if(err_user) throw err_user;
        
        var result = {};
        var count = 0;
        var user_robots = new Robot();
        user_robots.fetchAllRobotIds(user_response.user_id, function(err, ids) {
            ids.forEach(function(robot_id) {
                var robot = new Robot(robot_id);
                robot.getParameters(function(err_param, parameters) {
                    if(err_param) throw err_param;
                    
                    if (parameters.robot_type_id in result) {
                        result[parameters.robot_type_id].robot.push({"robot_id": parameters.robot_id, "robot_name": parameters.robot_name, "enabled": parameters.enabled});
                    }
                    else {
                        result[parameters.robot_type_id] = parameters.type;
                        result[parameters.robot_type_id].robot = [{"robot_id": parameters.robot_id, "robot_name": parameters.robot_name, "enabled": parameters.enabled}];
                    }
                    
                    
                    count++;
                    if(count == ids.length) res.send(result);
                }); 
            });
        });
    });
});

router.get('/robot_type/robot/toggleEnabled', function(req,res){   
    var robot = new Robot(req.query.robot_id);
    robot.toggleEnabled(function(err, result) {
        if(err) throw err;
        
        if(result) res.send(true);
    });
});

module.exports = router