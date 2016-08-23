const mysql = require('mysql');

var query = ""

if(process.argv.length > 2) {
  query = process.argv[2];
} else {
  console.log("ERROR - Usage: node sql.js <SQL Query>");
  return;
}

console.log("SQL Command: " + query);

var connection = mysql.createConnection("mysql://b01d58c838662e:95af6763@us-cdbr-iron-east-04.cleardb.net/heroku_115917db4de1285?reconnect=true");

connection.query(query, function(err, rows, fields) {
  if(err) {
    console.log('Error in SQL command. Try again later');
    throw err;
  }

  console.log(rows);

  connection.end();
  process.exit();
});