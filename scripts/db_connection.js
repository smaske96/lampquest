var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "lampquest"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

module.exports = { connection: con };