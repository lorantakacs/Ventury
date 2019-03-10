//server.js - node application
///////////////////////////////////////////////////////////////////////////
// requirepackages
const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const request = require('request');
const fs = require('fs');
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// set up public path, port, frameworks
const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
app.use(express.static(publicPath));
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//variable and function declaration
const maxJokes = 10;
const apiUrl = 'http://api.icndb.com/jokes/random/' + maxJokes;
const dbPath = '../db/user-info.json';
var dataReceived = false;

var requestJokes, createNewUser, getDB, checkUser, checkJokeLimit, checkTimeLimit, sendHistory, setlimitedTrue, sendLimitOf, deleteJokes, addJokesToUser, sendJoke, calcTimeout, sendLimitReached, deleteUser, updateDB, getCurrentTime;
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//listening to request from frontend
io.on('connection', (socket) => {
  ///////////////////////////////////////////////////////////////////////////
  //connect message
  console.log('New user connected');
  ///////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////
  //request Jokes with promise
  requestJokes = (url) => {
    return new Promise((resolve, reject) => {
      request(url, {json:true}, (err, res, body) => {
          if(err) return reject(err);
          try {
            resolve(body);
          } catch(e){
            reject(e)
          };
        });
    });
  };
  ///////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////
  //receive sign in info and do actions
  socket.on('signInData', (signInData) => {
     //check if access is user or admin
     if (signInData.access === 'user'){
       //retrieve user json
       var userDB = getDB(dbPath);
       var userDBLength = userDB.length;
       // check if user exist
       var userExist = checkUser(signInData, userDB);
       // collect history to send
       var histToSend = (userExist) ? userDB[userExist].chatHist : ' ';
       //if user exists check joke and time limit
       if(userExist){
         var userJokeLimit = checkJokeLimit(userDB, userExist, maxJokes);
         var userTimeLimit = checkTimeLimit(userDB, userExist);
         // send history to frontend
         sendHistory(histToSend);
         //if user is limited
         if (userJokeLimit && userTimeLimit){
           //send limit on frontend
           setlimitedTrue();
        //if time limit expired
         } else if (userJokeLimit && userTimeLimit == false) {
           //delete existing jokes and store db in variable
           var dbDeletedJokes = deleteJokes(userDB, userExist);
           //request new Jokes from API
           requestJokes(apiUrl).then((val) => {
             // storing fetched array of jokes in variable
             var jokesFromAPI = val.value;
             //add new jokes to existing user
             var dbWithNewJokes = addJokesToUser(dbDeletedJokes, userExist, jokesFromAPI);
             // send limit time to fronend to continue only if specific text is entrered by user
             sendLimitOf();
             // update DB
             updateDB(userDB, dbPath);
           }).catch((err) => {
             console.log(err);
           });
           //if user not limited
         } else if (userJokeLimit == false){
           // send one joke to the frontend
           if (userDB[userExist].displayedJokes < (userDB[userExist].jokes.length - 1)){
             // sendJoke(userExist, userDB, false, dbPath, false);
           } else {
             var limitTime = calcTimeout(userDB, userExist);
             sendJoke(userExist, userDB, false, dbPath, true);
             sendLimitReached(limitTime);
           };
         };
         ///////////////////changes 2019 03 10
       } else {
         //request Jokes
         requestJokes(apiUrl).then((val) => {
           // storing fetched array of jokes in variable
           var jokesFromAPI = val.value;
           // create user object and add to database
           createNewUser(signInData, jokesFromAPI, userDB, dbPath);
           // send one joke to the frontend
           // sendJoke(userDBLength, getDB, true, dbPath, false);
         }).catch((err) => {
           console.log(err);
         });
       };
     } else {
       console.log('clear user');
     };
   });
   ///////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////
  //reset user jokes
  socket.on('resetData', (resetData) => {
     var userDB = getDB(dbPath);
     var userExist = checkUser(resetData, userDB);
     if (userExist){
       var dbDeletedUser = deleteUser(userDB, userExist);
       updateDB(dbDeletedUser, dbPath);
     }
  });
  ///////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////
 //check asnwer and send response
   socket.on('answData', (answData, answer) => {
      if (answer === 'Yes') {
        var userDB = getDB(dbPath);
        var userExist = checkUser(answData, userDB);
        var userJokeLimit = checkJokeLimit(userDB, userExist, maxJokes);
        var userTimeLimit = checkTimeLimit(userDB, userExist);
        var limitTime = calcTimeout(userDB, userExist);
        if (userJokeLimit && userTimeLimit){
          // sendLimitReached(limitTime);
          setlimitedTrue();
        } else {
          if (userDB[userExist].displayedJokes < (userDB[userExist].jokes.length - 1)){
            sendJoke(userExist, userDB, false, dbPath, false);
          } else {
            sendJoke(userExist, userDB, false, dbPath, true);
            //tell to fronend that limit is reached
            sendLimitReached(limitTime);
          };
        };
      };
    });
  ///////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////
  //update chat history
  socket.on('chatHist', (histHtml) => {
    var user = histHtml[0];
    var histText = histHtml[1];
    var userDB = getDB(dbPath);
    var userExist = checkUser(user, userDB);
    userDB[userExist].chatHist = ' ';
    userDB[userExist].chatHist = histText;
    updateDB(userDB, dbPath);
  });
  ///////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////
  //connect message
  socket.on('disconnect', () => {
     console.log('User was disconnected');
   });
   ///////////////////////////////////////////////////////////////////////////
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//function descriptions
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// calculate remaining time
calcTimeout = (db, userIndex) => {
  var limit = (db[userIndex].date + 1440) * 60 * 1000;
  var limitDate = new Date(limit);
  var limitDateD = limitDate.getDay();
  var limitDateH = limitDate.getHours();
  var limitDateM = limitDate.getMinutes();
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  var limitArray = [days[limitDateD], limitDateH, limitDateM];
  return limitArray;
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//get data from file system
getDB = (path) => {
  var dataBuffer = fs.readFileSync(path);
  var dataJSON = dataBuffer.toString();
  var data = JSON.parse(dataJSON);
  return data.users;
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// check if user exist
checkUser = (singInObj, dbObj) => {
  for (i = 0; i < dbObj.length; i++){
    if (singInObj.firstLow === dbObj[i].firstNameLow){
      if (singInObj.lastLow ===  dbObj[i].lastNameLow){
        return i;
      };
    };
  };
  return false;
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// check limit by time
checkTimeLimit = (dbObj, userIndex) => {
  var currentTime = getCurrentTime();
  return ((dbObj[userIndex].date + 1440) > currentTime) ? true : false;
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// check limit by jokes
checkJokeLimit = (dbObj, userIndex, jokeLimit) => {
  return (dbObj[userIndex].displayedJokes >= jokeLimit) ? true : false;
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// create new user object and add to DB
createNewUser = (userInfo, jokes, existingDB, path) => {
  var newUser = {
    acess: userInfo.access,
    firstName: userInfo.firstName,
    lastName: userInfo.lastName,
    firstNameLow: userInfo.firstLow,
    lastNameLow: userInfo.lastLow,
    date: userInfo.date,
    displayedJokes: 0,
    jokes: jokes,
    chatHist: ' ',
  };
  //add new user to existing DB
  existingDB.push(newUser);
  // update DB
  updateDB(existingDB, path);
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// update DB
updateDB = (db, path) => {
  var newDB = {};
  newDB.users = db;
  var newDBJSON = JSON.stringify(newDB);
  fs.writeFileSync(path, newDBJSON);
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// delete jokes
deleteJokes = (db, userIndex) => {
  db[userIndex].jokes = [];
  db[userIndex].displayedJokes = 0;
  return db;
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// delete user
deleteUser = (db, userIndex) => {
  db.splice(userIndex, 1);
  return db
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// add jokes to existing user
addJokesToUser = (db, userIndex, jokes) => {
  db[userIndex].jokes = jokes;
  return db
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// get current time in minutes
getCurrentTime = () =>{
  var date = new Date().getTime();
  var dateMinutes = date / (1000 * 60);
  return dateMinutes;
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// send infromation to frontend
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// send history
sendHistory = (el) => {
  io.emit('history', {
    history: el
  });
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// send history
setlimitedTrue = () => {
  io.emit('set-limit');
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// send history
sendLimitOf = () => {
  io.emit('set-after-time-limit');
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// send history
setlimitedTrue = () => {
  io.emit('set-limit');
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// check time limit
sendLimitReached = (el) => {
  io.emit('limit-reached', {
    timeLimit: el
  });
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// send 1 joke to frontend
sendJoke = (userPosition, dbObj, initSeparator, path, limiter) => {
  var db = (initSeparator) ? dbObj(path) : dbObj;
  var jokeIndex = db[userPosition].displayedJokes;
  var joketoSend = db[userPosition].jokes[jokeIndex].joke;
  //send joke to frontend and specify if limiter should be set on on frontend
  io.emit('jokeToDisplay', {
    jokeToDisplay: joketoSend,
    lastOne: limiter
  });
  //add one to displayed joke counter
  db[userPosition].displayedJokes++;
  // update Time
  var currentTime = getCurrentTime();
  db[userPosition].date = currentTime;
  // update DB
  updateDB(db, path);
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// log that server is running
server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
///////////////////////////////////////////////////////////////////////////
