// index.js
///////////////////////////////////////////////////////////////////////////
//create connection to server via socket.io
var socket = io();
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//variable and function declaration
// var signedIn = false;
var limited = false;
var negativeMessage = false;
var pleaseToContinue = false;
var dataToServer;
var collectUseName, sendSIData, sendResetData, scrollFunc, yesMessageFunc, noMessageFunc, welcomeMessageFunc,  evalTextInput, limitMessage, clearInput, openChat, addMessage, sendAnswData, histFromChat;
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//action control depending on user input
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//action when sign in clicked
$('#sign-in').click(function(){
  //collect data to send to server
  dataToServer = collectUseName();
  //clear input field
  $('#first-name, #last-name').val('');
  // iff sign in data exist
  if (dataToServer){
    //hide sign in elements depending on access
    if (dataToServer.access === 'admin'){
      $('#sign-in').toggle();
      // show reset button as block
      $('#reset').toggle(function(){
        if ($(this).is(':visible'))
           $(this).css('display','block');
      });
    } else {
      $('.name-input, #sign-in').toggle();
      // open dialog box if it is not opened
      openChat();
    };
    //send sign in info
    sendSIData(dataToServer);
    // show sign out button as block
    $('#sign-out').toggle(function(){
      if ($(this).is(':visible'))
         $(this).css('display','block');
    });
  } else {
    alert('Please fill out all name fields');
  };
});
// changes 2019 03 10
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//action when reset clicked
$('#reset').click(function(){
  //collect data to send to server
  var userToReset = collectUseName();
  // if user exist
  if (userToReset){
    //check if signed in as chuch Norris
    if (userToReset.firstLow === 'chuck' || userToReset.lastLow === 'norris') {
      alert('Please do not reset Chuck Norris...this will create a black hole');
    } else {
      //send user info to reset user
      sendResetData(userToReset);
    };
  } else {
    alert('Please fill out all name fields');
  }
})
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//action when reset all clicked
$('#reset-all').click(function(){

})
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
  //scroll the chat
  scrollFunc();
  var textResponse = ($('#text-input').val());
  var textResponseLow = ($('#text-input').val()).toLowerCase();
  //clear text input
  $('#text-input').val('');
  //evaluate if user typed positive, negative or different
  evalTextInput(textResponse, textResponseLow);
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//function descriptions
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//collect user info
collectUseName = function(){
  //get user name
  var firstName = $('#first-name').val();
  var lastName = $('#last-name').val();
  var firstLow = firstName.toLowerCase().trim();
  var lastLow = lastName.toLowerCase().trim();
  //get sign in date
  var date = new Date().getTime();
  var dateMinutes = date / (1000 * 60) ;
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
    date: dateMinutes,
    chat: ' ',
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
//evaluate if user typed positive, negative, hi or else in tex box
evalTextInput = function(text, textL){
  //check if history is empty and check if last message was about tinme limit
  if ( $('ul').children().length > 0 ) {
    if (negativeMessage || pleaseToContinue){
      if (textL === 'one joke please'){
        pleaseToContinue = false;
        negativeMessage = false;
        evalAnswer = text;
        //add positive message to dialog box from user input
        yesMessageFunc(evalAnswer);
      } else {
        alert(`Cannot evaluate your message: '${text}'. Please type 'one joke please'`);
      };
    } else {
      // evaulate message
      var evalAnswer;
      switch (textL) {
        case 'hi':
            evalAnswer = text;
            //add positive message to dialog box from user input
            welcomeMessageFunc(evalAnswer);
          break;
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
            evalAnswer = text;
            //add positive message to dialog box from user input
            yesMessageFunc(evalAnswer);
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
            evalAnswer = text;
            negativeMessage = true;
            //add negative message to dialog box from user input
            noMessageFunc(evalAnswer);
          break;
        default:
          alert('Cannot evaluate your message: ' + text);
      };
    };
  } else {
    if (textL === 'hi'){
      evalAnswer = text;
      //send welcome message
      welcomeMessageFunc(evalAnswer);
    } else {
      alert(`Please say 'Hi' to Johnny 5`);
    }
  };
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//send reset data to server
clearInput = function(el){
  $('#first-name, #last-name').val('');
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//open dialog box if it is not opened
openChat = function(){
  if($('#collapseOne').css('display') == 'none'){
    $('#collapseOne').slideToggle( "slow" );
  };
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
//add yes message to dialog box from user input
yesMessageFunc = function(el){
  //add user message to chat if not limited
  if (el){
    if (limited == false){
      addMessage(el, 'left', false);
    };
  } else {
    if (limited == false){
      addMessage('Yes', 'left', false);
    };
  }
  //send positive request to server
  sendAnswData(dataToServer, 'Yes');
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//add no message to dialog box from user input
noMessageFunc = function(el){
  //add user message to chat if not limited
  if (el){
    if (limited == false){
      addMessage(el, 'left', false);
    };
  } else {
    if (limited == false){
      addMessage('No', 'left', false);
    };
  }
  //add user notification of negative answer
  if (limited == false){
    var noMessage = `Thanks for checking out the application. You still can ask for jokes, just type in 'one joke please'`;
    addMessage(noMessage, 'right', false);
  };
  //send  negative request to server
  sendAnswData(dataToServer, 'No');
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//add no message to dialog box from user input
welcomeMessageFunc = function(el){
  //add user and welcome message to chat if not limited
  if (limited == false){
    addMessage(el, 'left', false);
    var welcomeMessage = 'Hi! Would you like to read a joke?';
    addMessage(welcomeMessage, 'right', false);
  };
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//add message to dialog box
addMessage = function(message, position, server){
  var question;
  (server) ? question = '<br>Would you like to read one more joke?' : question = '';
  $('.chat').append('<li class=' + position + '><div class="chat-body"><p><strong>' + message + '</strong>' + question +'</p></div></li>');
  //send history to server
  histFromChat();
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//send data to server
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//send sign in data to server
sendSIData = function(el){
  socket.emit('signInData', el);
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//send answer to server
sendAnswData = function(el, answer){
  socket.emit('answData', el, answer);
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//send reset data to server
sendResetData = function(el){
  socket.emit('resetData', el);
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//collect all messages from chat wildow and send to server
histFromChat = function() {
  var chatHtml = $('.chat').html();
  var histArray = [dataToServer, chatHtml]
  socket.emit('chatHist', histArray);
};
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//get message from server and display it
socket.on('jokeToDisplay', function(joke){

  //diplsay message
  (joke.lastOne) ? addMessage(joke.jokeToDisplay, 'right', false) : addMessage(joke.jokeToDisplay, 'right', true);
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//load chat history to chat window
socket.on('history', function(hist){
  $('ul.chat').append(hist.history);
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//when limit reached display the following message
socket.on('limit-reached', function(limit){
  //set up time limit message
  var limitmessage = `You reached your 10 joke limit. Please wait until  ${limit.timeLimit[0]} at ${limit.timeLimit[1]}:${limit.timeLimit[2]}  hours (24 hours). When the time is up please type 'one joke please'`;
  //add limit message
  if (limited == false){
    addMessage(limitmessage, 'right', false);
  };
  limited = true;
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//set limit - no message is sent to server when it is true
socket.on('set-limit', function(){
  limited = true;
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//set limit - no message is sent to server when it is true
socket.on('set-after-time-limit', function(){
  pleaseToContinue = true;
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//connect message
socket.on('connect', function(){
  console.log('connected to server');
});
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
//disconnect message
socket.on('disconnect', function() {
  console.log('Disconnected from server');
});
///////////////////////////////////////////////////////////////////////////
