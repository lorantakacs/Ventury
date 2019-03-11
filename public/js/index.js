// index.js
///////////////////////////////////////////////////////////////////////////
//create connection to server via socket.io
var socket = io();
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//variable and function declaration
// var signedIn = false;





///////////////////////////////////////////////////////////////////////////
var signInData;
var collectSignIn, sendSignIn, checkHistory, collectAnswer, addToChat, sendAnswer, histFromChat, calcTimeout, sendResetData;

///////////////////////////////////////////////////////////////////////////
//action control depending on user input
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//action when sign in clicked
$('#sign-in').click(function(){
  //collect data from user
  signInData = collectSignIn();
  // check user data
  if (signInData) {
    // console.log(signInData);
    // check if user or admin
    if (signInData.access === 'user'){
      //send sign in to server
      sendSignIn(signInData);
      //hide sign in button and show chat window and sign out
      $('#sign-in, .name-input').toggle();
      $('#collapseOne').slideToggle( "slow" );
      // show sign out button as block
      $('#sign-out').toggle(function(){
        if ($(this).is(':visible'))
           $(this).css('display','block');
      });
    } else {
      //hide sign in and show reset and sign out button
      $('#sign-in').toggle();
      // show reset button as block
      $('#reset').toggle(function(){
        if ($(this).is(':visible'))
           $(this).css('display','block');
      });
      // show sign out button as block
      $('#sign-out').toggle(function(){
        if ($(this).is(':visible'))
           $(this).css('display','block');
      });
    };
  } else {
    alert('Please fill out both name fileds');
  };
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//action when reset clicked
$('#reset').click(function(){
  //collect data to send to server and
  var userToReset = collectSignIn();
  if(userToReset){
    if (userToReset.firstLow === 'chuck' && userToReset.lastLow === 'norris'){
      alert('Please do not reset Chuck Norris...this will create a black hole');
    } else {
      // send user info to Reset
      sendResetData(userToReset);
    }
  } else {
    alert('Please fill out all name fields');
  };
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//reload when sign out
$('#sign-out').click(function(){
  location.reload(true);
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//collect user input and do actions
$('#send-btn').click(function(){
  //check if history empty
  var historyCheck = checkHistory();
  // collect text from users
  var answer = collectAnswer();
  //scroll the chat
  scrollFunc();
  //if history does not exist user must say 'hi' else just simply add answer to chatwindow
  if (historyCheck){
    // add answwer to chatwindow
    addToChat(answer[0], 'left', true);
    // send response to Server
    sendAnswer(answer[1]);
  } else {
    if (answer[0] === 'hi'){
      // send response to Server
      sendAnswer(answer[1]);
      addToChat(answer[0], 'left', true);
    } else {
      alert(`Please say 'Hi' to Johnny 5`);
    }
  }
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//function descriptions
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//collect sign in from user
collectSignIn = function(){
  //get user name
  var firstName = $('#first-name').val();
  var lastName = $('#last-name').val();
  var firstLow = firstName.toLowerCase().trim();
  var lastLow = lastName.toLowerCase().trim();
  //check if all name fileds are filled out
  if (firstName === '' || lastName === ''){
    return;
  };
  //prepare user object to send to server and run function to check access
  var userObj = {
    access: ' ',
    firstName: firstName,
    lastName: lastName,
    firstLow: firstLow,
    lastLow: lastLow,
    checkAccess: function(){
      if (firstLow === 'chuck' && lastLow === 'norris'){
        this.access = 'admin';
      } else {
        this.access = 'user';
      };
    }
  };
  userObj.checkAccess();
  //return user sign in info
  return userObj;
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//history if user has any
checkHistory = function(){
  return ( $('ul').children().length > 0 ) ?  true : false;
}
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//history if user has any
collectAnswer = function(){
  var textResponse = $('#text-input').val();
  var textResponseLow = ($('#text-input').val()).toLowerCase();
  var textResponseTrimmed = textResponse.trim();
  var textResponseLowTrimmed = textResponseLow.trim();
  return [textResponseTrimmed, textResponseLowTrimmed];
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//autoscroll function
scrollFunc = function(){
  var liHeight = 0;
  // get alement height and scroll down
  $('li').each(function(){
    liHeight += parseInt($(this).height());
  });
  liHeight += '';
  $('.panel-body').animate({scrollTop: liHeight});
}
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//add message to dialog box from user and server
addToChat = function(message, position, client){
  var messageToDisplay1, messageToDisplay2;
  switch (message) {
    case 'hi':
        messageToDisplay1 = 'Hi!'
        messageToDisplay2 = '<br>Would you like to read a joke?'
      break;
    case 'no':
        if (client){
          messageToDisplay1 = message;
        } else {
          messageToDisplay1 = `Thanks for checking out the application. You can still ask for jokes, just type in 'one joke please'`
        };
        messageToDisplay2 = ''
      break;
    case 'yes':
        messageToDisplay1 = message
        messageToDisplay2 = '<br>Would you like to read one more joke?';
      break;
    case 'limit':
        if (client){
          messageToDisplay1 = message
        } else {
          var limitTime = calcTimeout();
          console.log(limitTime);
          messageToDisplay1 = `You reached your 10 joke limit. Please wait until  ${limitTime[0]} at ${limitTime[1]}:${limitTime[2]}  hours (24 hours). When the time is up please type 'one joke please'`;
        }
        messageToDisplay2 = '';
      break;
    default:
      messageToDisplay1 = message;
      if (client){
        messageToDisplay2 = '';
      } else {
        messageToDisplay2 = '<br>Would you like to read one more joke?';
      };
  };
  if (client) {messageToDisplay2 = '';};
  $('.chat').append('<li class=' + position + '><div class="chat-body"><p><strong>' + messageToDisplay1 + '</strong>' + messageToDisplay2 +'</p></div></li>');
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// calculate remaining time
calcTimeout = function(){
  var currDate = new Date().getTime();
  var limit = currDate + (1000 * 60 * 60 * 24);
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
//send data to server
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//send sign in data to server
sendSignIn = function(el){
  socket.emit('signInData', el);
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//send sign in data to server
sendAnswer = (el) => {
  socket.emit('userInput', el);
}
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//collect all messages from chat wildow and send to server
histFromChat = function(dataToServer) {
  var chatHtml = $('.chat').html();
  var histArray = [dataToServer, chatHtml]
  socket.emit('chatHist', histArray);
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//send user to reset in db
sendResetData = function(el){
  socket.emit('resetData', el);
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//get data from server
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//load chat history to chat window
socket.on('history', function(hist){
  $('ul.chat').append(hist.history);
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//get response from server
socket.on('response-server', function(message){
  addToChat(message.message, 'right', false);
  // collect history from chat
  histFromChat(signInData);
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//disconnect message
socket.on('disconnect', function() {
  console.log('Disconnected from server');
});
///////////////////////////////////////////////////////////////////////////
