const mysql = require('mysql');

module.exports.addNewProject = function(name, client, type, cost) {
  var table = 'projects'
  var connection = mysql.createConnection("mysql://b01d58c838662e:95af6763@us-cdbr-iron-east-04.cleardb.net/heroku_115917db4de1285?reconnect=true");
  var sql = "INSERT INTO projects SET ?";
  var inserts = {'Name': name, 'Client': client, 'Type': type, 'Cost': cost};

  connection.connect(function(err) {
    if(err) throw err; 
    console.log("Connected to aloabot_db");
  });

  connection.query(sql, inserts, function(err, result) {
    if(err) {
      throw err;
    }

    console.log(result);
    connection.end();
  });
}

module.exports.getProjects = function(client, completion) {
    var table = 'projects';
    var connection = mysql.createConnection("mysql://b01d58c838662e:95af6763@us-cdbr-iron-east-04.cleardb.net/heroku_115917db4de1285?reconnect=true");
    var sql = "SELECT * FROM " + table;
    var result = ""

    if(client != ""){
        query += " WHERE client=" + client;
    }

    connection.connect(function(err) {
        if(err) throw err;
        console.log("Connected to " + table);
    })

    connection.query(sql, function(err, rows, fields) {
        if(err) throw err;

        for(var i in rows) {
            result += "A " + rows[i].type + " project called " + rows[i].name + " for " + rows[i].client + "with a pay of " + rows[i].cost + "\n";
        }

        console.log(result);

        connection.end();

        completion(result);
    });

    return result;
}