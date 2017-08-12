# Hooks
## Introduction
**Hooks** are events fired when certain events happen and are used for communication between some parts of *CVNAdvanced*.

## Usage
Hooks can be called from any part of the application and get handled by the controller which passes them onto installed extensions as well. They can be called like:
```javascript
main.hook('hookname', parameter1, parameter2, ...);
```
Hooks can be used by both the parts of the application that want to notify other parts about an event or by extensions that want to control parts of the application they have no access to.

## List
### channelJoin
Fired when an IRC channel is joined.
#### Parameters
- `client` (`Client`) — IRC client instance that joined the channel
- `channel` (`String`) — Channel that was joined

### configError
Fired when an error with configuration happens.
Should generally exit the program.

### debug
Fired when debug is requested from the controller.
#### Parameters
- `text` (`String`) — Text to debug

### error
Fired when an error occurs. Can be used as a way of handling non-fatal errors (and also gracefully failing).
#### Parameters
- `err` (`String|Error`) — The error that happened

### extMsg
Fires when a message gets sent in a non-countervandalism channel.
#### Parameters
- `nickname` (`String`) — Nickname of the user that sent the message
- `channel` (`String`) — The channel the message was sent in
- `text` (`String`) — Contents of the message
- `message` (`Object`) — IRC message object

### irc
Fired when an extension wants to call a method of the IRC client object. This was implemented so extensions wouldn't have to call the controller which calls the client implementation which calls the IRC client object.
#### Parameters
First parameter is the method name of the IRC client object to call (`String`), other parameters are parameters of that method.

### init
Fired when all resources of the application get loaded.

### ircNotice
Fired when the IRC client receives a notice.
#### Parameters
- `nickname` (`String`) — Nickname of the user sending the notice. Can be `undefined` if the server is sending the notice
- `text` (`String`) — Contents of the notice

### kick
Fired when a user gets kicked from an IRC channel.
#### Parameters
- `channel` (`String`) — Channel the user was kicked from
- `nickname` (`String`) — Nickname of the user that was kicked
- `user` (`String`) — Nickname of the user that did the kick
- `reason` (`String`) — Reason for the kick
- `message` (`Object`) — IRC message object

### noExtension
Fired when an extension cannot be found.
#### Parameters
- `extension` (`String`) — Name of the extension that cannot be found

### parameterError
Fired when parameters of some function (often highly used) are unexpected/invalid.
#### Parameters
- `method` (`String`) — Method which was called with unexpected parameters

### part
Fired when a user leaves an IRC channel.
#### Parameters
- `channel` (`String`) — Channel that the user left
- `nickname` (`String`) — User that left the channel
- `reason` (`String`) — Reason for leaving
- `message` (`Object`) — IRC message object

### serverJoin
Fired when an IRC server is joined.
#### Parameters
- `client` (`Client`) — IRC client instance that joined the server

### unknownMsg
Fired when a message from a countervandalism channel failed to parse.
#### Parameters
- `nickname` (`String`) — Nickname of the user that sent the message
- `channel` (`String`) — The channel the message was sent in
- `text` (`String`) — Contents of the message
- `message` (`Object`) — IRC message object

### userJoin
Fired when some user other than the bot joins an IRC channel.
#### Parameters
- `nickname` (`String`) — Nickname of the user that joined
- `channel` (`String`) — Channel the user joined

### warn
Fired when a part of the app wants to warn the user/controller about something.
#### Parameters
- `warning` (`String`) — Text of the warning
