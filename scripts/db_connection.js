var mysql = require('mysql');
var credentials = require('../../db_credential/config');

var pool = mysql.createPool(credentials.prod);





module.exports = { connection_pool: pool };