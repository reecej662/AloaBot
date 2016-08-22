const mysql = require('mysql');
const REST_PORT = 5000;
// var connection = mysql.createConnection({
//   host     : 'localhost',
//   user     : 'reece@aloalabs.com',
//   password : 'norman323',
//   database : 'projects',
//   connectTimeout: 60000
// });

var connection = mysql.createConnection("mysql://b01d58c838662e:95af6763@us-cdbr-iron-east-04.cleardb.net/heroku_115917db4de1285?reconnect=true");

connection.connect(function(err) {
  if(err) throw err 
  console.log("Connected to robot_db");
});

var db = 'projects'
var searchParam = 'fav_lang'
var langQuery = 'java';

if(process.argv.length > 2) {
  langQuery = process.argv[2];
}

var query = "SELECT * FROM " + db; // + " WHERE meta_key='" + searchParam + "' AND meta_value LIKE '%" + langQuery + "%'"
console.log("SQL Command: " + query);

connection.query(query, function(err, rows, fields) {
  
  // for (var i in rows) {
  //   var query = 'SELECT display_name FROM wp_users WHERE ID=' + rows[i].user_id;
      
  // callLanguageQuery(query);
  // }
  
  for(var i in rows) {
    console.log(rows[i]);
  }

  connection.end();
});

function callLanguageQuery(query) {
  connection.query(query, function(err, rows, fields) {
    for (var i in rows) {
      console.log(rows[i].display_name + ' is interested in ' + langQuery);
    }
  });
}

