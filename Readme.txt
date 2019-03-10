Project: Chuck Norris Challenge - job application
Requested by: Iva Bosanac Hoblaj/Jakob Reiter/theventury.com
Author: Lorant Takacs

Project input:
////////////////////////////////////////////////////////////////////////////////////
Please write a little chatbot in nodeJs that:
  You can ask for a Joke
  After you got at least one joke you can ask for more (not before)
  After 10 jokes it should tell you to wait 24h
  Also implement a reset and help functionality in a way that you see fit.
  The Chatbot can be either Web-, Console or FB Messenger based. (later is preferred)
Please don’t use any externally hosted NLP providers)
Jokes can be received from this API: http://www.icndb.com/api/
////////////////////////////////////////////////////////////////////////////////////

To run the application and check the code please visit the following links
https://gentle-inlet-95966.herokuapp.com/
https://github.com/lorantakacs/Ventury.git

Solution:
////////////////////////////////////////////////////////////////////////////////////
Programing languages: frontend - HTML, CSS, Javascript
                      backend - Javascript(nodeJs)

Frameworks and libraries: frontend - jQuery - included from CDN
                          backend - nodeJs modules: path, http, express, socketIO, request, fs

Files:
---------------------------
db/user-info.json - this file is used to store user information such as: first/last name, first/last name in lower case letters, number of displayed jokes, time of the last displayed joke, jokes, chat history

node_modules/ - this directory contains all the installed node module files

public/css/style.css, help.css - stylesheet files
public/image/profile.jpg - picture on index.html
public/js/index.js - Javascript on the frontend
public/index.html, help.html - html of the front and help page

server/server.js - server side Javascript executed by nodeJs

package.json, package-lock.json - list of nodeJs dependencies

Readme.txt - detailed explanation of the project

User Guide:
---------------------------
After the page is loaded the user can do the following actions:
- enter the help page by clicking the help link in the welcome text and find out how to interact with the chatbot
- enter last and first name to the text input field and click sign in to start the chat - both first and last name are mandatory, leaving one of them empty will cause an error message
- after signing in, a chat window will be shown, the user have to type 'Hi' to the text input field to start the communication with the chatbot.
- the user always have to click the 'Send' button to send the message to the server
- the user can type the name and other messages in upper and lower case letters but it will evaluated in lower case always
- the users positive or negative answers will be evaluated
- if the answers are positive the chatbot will show a joke to the user and will ask if the user want's more
  -the following answers are evaluated as positive: 'one joke please', 'yes', 'yea', 'yep', 'y', 'yo', 'positive', 'fine', 'good', 'k', 'ok', 'okay', 'ja', 'true', 'please', 'yes please', 'naturlich'
- if the answer is negative the chatbot will thank the user for visiting but if the user types in 'one joke please' the chatbot will return a new joke
  -the following answers are evaluated as negative: 'no', 'nope', 'not', 'nix', 'nay', 'nein', 'negative', 'n', 'false'
- after 10 jokes the user have to wait 24 hours
- after reaching the 24h time limit the user have to type 'one joke please' to continue the chat and request more jokes
- by signing in as 'Chuck Norris' the user can type in any users name and clear the specified user from the database, so the user can continue and request more jokes from the server
