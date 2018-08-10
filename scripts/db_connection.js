var mysql = require('mysql');
var credentials = require('../config');

/*var con = mysql.createConnection({
  host: "localhost",
  user: "webapp",
  password: "csi3335",
  database: "lampquest"
});*/

var con = mysql.createConnection(credentials.prod);

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

module.exports = { connection: con };