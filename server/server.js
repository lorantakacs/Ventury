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



///////////////////////////////////////////////////////////////////////////
var userSignInData;
var requestJokes, getDB, checkUser, sendHistory, createNewUser, updateDB, checkLimits, getCurrentTime, checkAnswer, sendAnswer, getJokeToSend, setLastNo, deleteJokes, deleteUser;

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
  //recive sign in data
  socket.on('signInData',(signInData) => {
    userSignInData = signInData;
    // get database
    var userDB = getDB(dbPath);
    // check if user exist
    var userExist = checkUser(signInData, userDB);
    // if user exist then show chathistory else cretae user with jokes
    if(userExist){
      //send chat history
      sendHistory(userDB[userExist].chatHist);
    } else {
      //request Jokes
      requestJokes(apiUrl).then((val) => {
        // storing fetched array of jokes in variable
        var jokesFromAPI = val.value;
        // create user object and add to database
        createNewUser(signInData, jokesFromAPI, userDB, dbPath);
      }).catch((err) => {
        console.log(err);
      });
    };
  });
  ///////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////
  //recive user text inpu
  socket.on('userInput', (textInput) => {
    // get database
    var userDB = getDB(dbPath);
    var userExist = checkUser(userSignInData, userDB);
    //check if user reached limits
    var jokeTimeLimit = checkLimits(userExist, userDB);
    if (jokeTimeLimit[0] == false && userDB[userExist].chatHist === ' '){
      checkAnswer(textInput, userDB, userExist, true, false);
    } else if (jokeTimeLimit[0] == false && userDB[userExist].chatHist !== ' '){
      checkAnswer(textInput, userDB, userExist, false, false);
    } else if (jokeTimeLimit[0] == true && jokeTimeLimit[1] == false){
      //delete jokes, request new ones save them and display new message
      var updatedDB = deleteJokes(userDB, userExist);
      // request Jokes
      requestJokes(apiUrl).then((val) => {
        // storing fetched array of jokes in variable
        var jokesFromAPI = val.value;
        // udate user object with new jokes and save to db
        updatedDB[userExist].jokes = jokesFromAPI;
        updatedDB[userExist].displayedJokes = 0;
        updateDB(updatedDB, dbPath);
        // get updated db
        var updateDBToCheck = getDB(dbPath);
        // check answer
        checkAnswer(textInput, updateDBToCheck, userExist, false, true);
      }).catch((err) => {
        console.log(err);
      });
    } else if (jokeTimeLimit[0] == true && jokeTimeLimit[1] == true){
      return
    };
  });
  ///////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////
  //update chathistory
  socket.on('chatHist', (histHtml) => {
    var user = histHtml[0];
    var histText = histHtml[1];
    var userDB = getDB(dbPath);
    var userExist = checkUser(user, userDB);
    userDB[userExist].chatHist = ' ';
    userDB[userExist].chatHist = histText;
    updateDB(userDB, dbPath);
  });
  /////////////////////////////////////////////////////////////////////////

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
// create new user object and add to DB
createNewUser = (userInfo, jokes, existingDB, path) => {
  var newUser = {
    acess: userInfo.access,
    firstName: userInfo.firstName,
    lastName: userInfo.lastName,
    firstNameLow: userInfo.firstLow,
    lastNameLow: userInfo.lastLow,
    date: 0,
    displayedJokes: 0,
    jokes: jokes,
    chatHist: ' ',
    lastNo: false
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
// check user limit
checkLimits = (el, db) => {
  var limits = [];
  var currentTime = getCurrentTime();
  // check limit joke limit
  limits[0] = (db[el].displayedJokes >= maxJokes) ? true : false;
  // check time limit
  limits[1] = (db[el].date + (1000 * 60 * 60 * 24) > currentTime) ? true : false;
  return limits;
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// get current time in minutes
getCurrentTime = () =>{
  var date = new Date().getTime();
  return date;
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// add message from user and server to chat window
checkAnswer = (el, db, user, hiMessage, onePlease) => {
  // set last no to true after to make the user type one joke please
  if (onePlease){
    setLastNo(db, user);
  }
  // check if user says hi at the beginning
  if (hiMessage && el === 'hi'){
    sendAnswer('hi');
    return;
  };
  // evaluate user input and send response
  if (db[user].lastNo === true && el !== 'one joke please'){
    //sendAnswer('oneJokePlease');
    return
  } else {
    switch (el) {
      case 'one joke please':
      case 'yes':
      case 'yea':
      case 'yep':
      case 'y':
      case 'yo':
      case 'positive':
      case 'fine':
      case 'good':
      case 'k':
      case 'ok':
      case 'okay':
      case 'ja':
      case 'true':
      case 'please':
      case 'yes please':
      case 'naturlich':
        // get message for client
        var messageToClient = getJokeToSend(db, user);
        sendAnswer(messageToClient[0]);
        if(messageToClient[1]){sendAnswer('limit');}
        break;
      case 'no':
      case 'nope':
      case 'not':
      case 'nix':
      case 'nay':
      case 'nein':
      case 'negative':
      case 'n':
      case 'false':
        //set user atribute to last joke no so the user can aswer only with one joke please
        sendAnswer('no');
        setLastNo(db, user);
        break;
      default: return;
    };
  };
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//get joke to user and update counter in db
getJokeToSend = (db, user) => {
  var joke
  var jokeToSendIndex = db[user].displayedJokes;
  var jokeToSend = [db[user].jokes[jokeToSendIndex].joke];
  db[user].displayedJokes++;
  db[user].date = new Date().getTime();
  if (db[user].displayedJokes === maxJokes){
    jokeToSend[1] = true
  }
  db[user].lastNo = false;
  updateDB(db, dbPath);
  return jokeToSend;
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//set last message to no
setLastNo = (db, user) => {
  db[user].lastNo = true;
  updateDB(db, dbPath);
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//set last message to no
deleteJokes = (db, user) => {
  db[user].jokes = [];
  db[user].displayedJokes = 0;
  return db;
}
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// delete user
deleteUser = (db, userIndex) => {
  db.splice(userIndex, 1);
  return db
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//send information to client
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//send history to client
sendHistory = (el) => {
  io.emit('history', {
    history: el
  });
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//send message to client
sendAnswer = (el) => {
  io.emit('response-server', {
    message: el
  });
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// log that server is running
server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
///////////////////////////////////////////////////////////////////////////
