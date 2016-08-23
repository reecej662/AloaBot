'use strict';

const apiai = require('apiai');
const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('node-uuid');
const request = require('request');
const JSONbig = require('json-bigint');
const async = require('async');

const mysql = require('mysql');

const REST_PORT = (process.env.PORT || 5000);
const APIAI_ACCESS_TOKEN = process.env.APIAI_ACCESS_TOKEN;
const APIAI_LANG = process.env.APIAI_LANG || 'en';
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

const apiAiService = apiai(APIAI_ACCESS_TOKEN, {language: APIAI_LANG, requestSource: "fb"});
const sessionIds = new Map();

function processEvent(event) {
    var sender = event.sender.id.toString();

    if ((event.message && event.message.text) || (event.postback && event.postback.payload)) {
        var text = event.message ? event.message.text : event.postback.payload;
        // Handle a text message from this sender

        if (!sessionIds.has(sender)) {
            sessionIds.set(sender, uuid.v1());
        }

        console.log("Text", text);

        let apiaiRequest = apiAiService.textRequest(text,
            {
                sessionId: sessionIds.get(sender)
            });

        apiaiRequest.on('response', (response) => {
            if (isDefined(response.result)) {
                let responseText = response.result.fulfillment.speech;
                let responseData = response.result.fulfillment.data;
                let action = response.result.action;

                if (isDefined(responseData) && isDefined(responseData.facebook)) {
                    if (!Array.isArray(responseData.facebook)) {
                        try {
                            console.log('Response as formatted message');
                            sendFBMessage(sender, responseData.facebook);
                        } catch (err) {
                            sendFBMessage(sender, {text: err.message});
                        }
                    } else {
                        responseData.facebook.forEach((facebookMessage) => {
                            try {
                                if (facebookMessage.sender_action) {
                                    console.log('Response as sender action');
                                    sendFBSenderAction(sender, facebookMessage.sender_action);
                                }
                                else {
                                    console.log('Response as formatted message');
                                    sendFBMessage(sender, facebookMessage);
                                }
                            } catch (err) {
                                sendFBMessage(sender, {text: err.message});
                            }
                        });
                    }
                } else if (isDefined(responseText)) {
                    console.log('Response as text message: ' + responseText);
                    // facebook API limit for text length is 320,
                    // so we must split message if needed

                    if(action == 'get_projects') {
                        getProjects(response.result.parameters.client, function(message) {
                            var splittedText = splitResponse(responseText + ' ' + message);

                            async.eachSeries(splittedText, (textPart, callback) => {
                                sendFBMessage(sender, {text: textPart}, callback);
                            });
                        });

                        console.log(responseText);
                    } else {
                        var splittedText = splitResponse(responseText);

                        async.eachSeries(splittedText, (textPart, callback) => {
                            sendFBMessage(sender, {text: textPart}, callback);
                        });
                    }
                }


                let projectIncomplete = response.result.actionIncomplete;

                if(action == 'make_project' && !projectIncomplete) {
                    let clientName = response.result.parameters.client_name;
                    let payAmount = response.result.parameters.pay_amount;
                    let projectTitle = response.result.parameters.project_title;
                    let projectType = response.result.parameters.project_type;

                    addNewProject(projectTitle, clientName, projectType, payAmount);
                } else if(action == 'get_projects') {
                    let client = response.result.parameters.client;
                    var result = getProjects(client, function(message){});
                    console.log(result);
                }

            }
        });

        apiaiRequest.on('error', (error) => console.error(error));
        apiaiRequest.end();
    }
}

function splitResponse(str) {
    if (str.length <= 320) {
        return [str];
    }

    return chunkString(str, 300);
}

function chunkString(s, len) {
    var curr = len, prev = 0;

    var output = [];

    while (s[curr]) {
        if (s[curr++] == ' ') {
            output.push(s.substring(prev, curr));
            prev = curr;
            curr += len;
        }
        else {
            var currReverse = curr;
            do {
                if (s.substring(currReverse - 1, currReverse) == ' ') {
                    output.push(s.substring(prev, currReverse));
                    prev = currReverse;
                    curr = currReverse + len;
                    break;
                }
                currReverse--;
            } while (currReverse > prev)
        }
    }
    output.push(s.substr(prev));
    return output;
}

function sendFBMessage(sender, messageData, callback) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: FB_PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: sender},
            message: messageData
        }
    }, (error, response, body) => {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }

        if (callback) {
            callback();
        }
    });
}

function sendFBSenderAction(sender, action, callback) {
    setTimeout(() => {
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: FB_PAGE_ACCESS_TOKEN},
            method: 'POST',
            json: {
                recipient: {id: sender},
                sender_action: action
            }
        }, (error, response, body) => {
            if (error) {
                console.log('Error sending action: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
            if (callback) {
                callback();
            }
        });
    }, 1000);
}

function doSubscribeRequest() {
    request({
            method: 'POST',
            uri: "https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=" + FB_PAGE_ACCESS_TOKEN
        },
        (error, response, body) => {
            if (error) {
                console.error('Error while subscription: ', error);
            } else {
                console.log('Subscription result: ', response.body);
            }
        });
}

function isDefined(obj) {
    if (typeof obj == 'undefined') {
        return false;
    }

    if (!obj) {
        return false;
    }

    return obj != null;
}

const app = express();

app.use(bodyParser.text({type: 'application/json'}));

app.get('/webhook/', (req, res) => {
    if (req.query['hub.verify_token'] == FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);

        setTimeout(() => {
            doSubscribeRequest();
        }, 3000);
    } else {
        res.send('Error, wrong validation token');
    }
});

app.post('/webhook/', (req, res) => {
    try {
        var data = JSONbig.parse(req.body);

        if (data.entry) {
            let entries = data.entry;
            entries.forEach((entry) => {
                let messaging_events = entry.messaging;
                if (messaging_events) {
                    messaging_events.forEach((event) => {
                        if (event.message && !event.message.is_echo ||
                            event.postback && event.postback.payload) {
                            processEvent(event);
                        }
                    });
                }
            });
        }

        return res.status(200).json({
            status: "ok"
        });
    } catch (err) {
        return res.status(400).json({
            status: "error",
            error: err
        });
    }

});

app.listen(REST_PORT, () => {
    console.log('Rest service ready on port ' + REST_PORT);
});

doSubscribeRequest();

function addNewProject(name, client, type, cost) {
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

function getProjects(client, completion) {
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
            result += rows[i].name + " for " + rows[i].client + ", a " + rows[i].type + " project with a pay of " + rows[i].cost + ", ";
        }

        console.log(result);

        connection.end();

        completion(result);
    });

    return result;
}