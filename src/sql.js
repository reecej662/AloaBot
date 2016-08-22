const mysql = require('mysql');
const REST_PORT = 5000;
// var connection = mysql.createConnection({
//   host     : 'localhost',
//   user     : 'reece@aloalabs.com',
//   password : 'norman323',
//   database : 'projects',
//   connectTimeout: 60000
// });
var table = 'projects'

var connection = mysql.createConnection("mysql://b01d58c838662e:95af6763@us-cdbr-iron-east-04.cleardb.net/heroku_115917db4de1285?reconnect=true");

connection.connect(function(err) {
  if(err) throw err 
  console.log("Connected to aloabot_db");
});

// var searchParam = 'fav_lang'
// var langQuery = 'java';

if(process.argv.length > 2) {
  langQuery = process.argv[2];
}

var query = "SELECT * FROM " + table; // + " WHERE meta_key='" + searchParam + "' AND meta_value LIKE '%" + langQuery + "%'"
console.log("SQL Command: " + query);

connection.query(query, function(err, rows, fields) {

  for(var i in rows) {
    console.log(rows[i]);
  }

  addNewProject('TestProject', 'TestClient', 'design', '1000');
});

function addNewProject(name, client, type, cost) {
  var sql = "INSERT INTO projects SET ?";
  var inserts = {'Name': name, 'Client': client, 'Type': type, 'Cost': cost};

  connection.query(query, inserts, function(err, result) {
    if(err) {
      throw err;
    }

    console.log(result);
    connection.end();
  });

  console.log(query.sql);
}