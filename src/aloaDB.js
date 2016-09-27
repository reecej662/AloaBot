const mysql = require('mysql');
const request = require('request');

const FB_PAGE_ACCESS_TOKEN = 'EAAOV2mJd4dkBAHiPZCtiWsqvO5ZCaNmiKSUZAEKh3dXyK7LKq2ZCquKhe3FfFQxmwjqmIdOQdwXdwlFk9clwWvhkTMZBDyDRkzc3Cj5932pFhwNOhW38aH2fmHVc2aCZAfWsZBKKmXlcZCgLxZCzID37ZChMSKoZADgrpkoNSMZC2EutZBwZDZD'

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

    var userIds = getUsers('Swift');
    
    for(var i in userIds){
      sendMessage(userIds[i]);
    }

    connection.end();
  });
}

module.exports.getProjects = function(client, completion) {
    var table = 'projects';
    var connection = mysql.createConnection("mysql://b01d58c838662e:95af6763@us-cdbr-iron-east-04.cleardb.net/heroku_115917db4de1285?reconnect=true");
    var sql = "SELECT * FROM " + table;
    var result = "\n"

    if(client != ""){
        sql += " WHERE client LIKE %" + client + "%";
    }

    connection.connect(function(err) {
        if(err) throw err;
        console.log("Connected to " + table);
    })

    connection.query(sql, function(err, rows, fields) {
        if(err) throw err;

        for(var i in rows) {
            result += "\nA " + rows[i].type + " project called " + rows[i].name + " for " + rows[i].client + " with a pay of " + rows[i].cost + "\n";
        }

        console.log(result);

        connection.end();

        completion(result);
    });

    return result;
}

var getUsers = function(language) {
  var table = 'projects';
  var connection = mysql.createConnection("mysql://b01d58c838662e:95af6763@us-cdbr-iron-east-04.cleardb.net/heroku_115917db4de1285?reconnect=true");
  var sql = "SELECT fb_id FROM " + table + " WHERE fav_lang LIKE '%" + language +"%'";

  connection.connect(function(err) {
    if(err) throw err;
    console.log("Connected to")
  });

  connection.query(sql, function(err, rows, fields) {
    var userIds = [];

    if(err) {
      console.log('Error: ' + err);
    } else {
      for(i in rows){
        console.log(rows[i]);
      }

      return [1167421219983416];
    }


  });

}

var sendMessage = function(id, message, callback) {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: FB_PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: {
      recipient: {id: id},
      message: message
    }
  }, (error, response, body) => {
    if(error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', error);
    }

    if(callback) {
      callback();
    }
  });
}

var sql = function()

// module.exports.sendMessage = sendMessage;
// module.exports.getUsers = getUsers;