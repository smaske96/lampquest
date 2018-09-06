var mysql = require('mysql');
var credentials = require('../../db_credential/config');

var con;


function handleDisconnect() {
  con = mysql.createConnection(credentials.prod); // Recreate the connection, since
                                                  // the old one cannot be reused.

  con.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect, to avoid a hot loop, and to allow our node script to process asynchronous requests in the meantime.
    }                                     
	else {									  
		console.log("Connected!");
	}
  });                                     
  con.on('error', function(err) {
    console.log('db error');
	console.log(Date() + ' - Error when connecting to db:', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();


module.exports = { connection: con };