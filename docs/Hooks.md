# Hooks
This file lists all hooks used in CVNAdvanced.

## List
### channelJoin
Fired when an IRC channel is joined.
#### Parameters
- `client` (`Client`) &mdash; IRC client instance that joined the channel
- `channel` (`String`) &mdash; Channel that was joined

### configError
Fired when an error with configuration happens.
Should generally exit the program.

### debug
Fired when debug is requested from the controller.
#### Parameters
- `text` (`String`) &mdash; Text to debug

### error
Fired when an error occurs
#### Parameters
- `err` (`String|Error`) &mdash; The error that happened

### serverJoin
Fired when an IRC server is joined.
#### Parameters
- `client` (`Client`) &mdash; IRC client instance that joined the server
