# Message structure
This file explains the structure of the Message object in CVNAdvanced.

## Types
There are three message types, stored in the `type` property of a Message object. Possible values of it are:
- `edit` - If the message represents an edit or log action
- `list` - If the message represents a list modification
- `block` - If the message represents a block
- `discussions` - If the message represents a Discussions event
- `spam` - If the message represents possible spam
- `newusers` - If the message represents a new user registering
- `upload` - If the message represents a new file being uploaded

### Edit
If the message represents an edit, it can be one of three actions, stored in the `action` property:
- `edit` - If a page was edited
- `create` - If a page was created
- `log` - If a log action happened

This message can contain additional properties:

| Name        | Type    | Description                                                                                         | Present if action |
| ----------- | ------- | --------------------------------------------------------------------------------------------------- | ------- |
| `user`      | String  | Name of the user that did the action                                                                | Always |
| `userType`  | String  | Type of the user that did the action                                                                | Always |
| `title`     | String  | Page or log title                                                                                   | Always |
| `diffSize`  | Integer | Size of the diff                                                                                    | `edit` or `create` |
| `urlParams` | Object  | Parameters of the diff URL. Can contain `rcid`, `oldid` and `diff` keys.                            | `edit` or `create` |
| `summary`   | String  | Summary of the edit, creation or log action                                                         | Always |
| `watched`   | String  | If the edit hit a summary filter, this will contain the summary filter it hit                       | Always |
| `replace`   | String  | If the edit replaced a page with some content, this will contain content the page was replaced with | `edit` |
| `log`       | String  | Type of the log                                                                                     | `log` |
| `wiki`      | String  | Subdomain of the wiki                                                                               | Always |


#### User types
`userType` property can be set to one of the following:
- `ip` - Anonymous user
-  `user` - Normal user
- `whitelist` - Trusted user
- `admin` - Staff, VSTF or Helper
- `blacklist` - Blacklisted user
- `greylist` - User doing frequent similar actions

### Block
If the message represents a block, it contains a property `action` which can be set to `block` or `unblock` depending on whether the user was blocked or unblocked from a wiki. It can also contain the following properties:

| Name     | Type   | Description                            | Present if action |
| -------- | ------ | -------------------------------------- | ----------------- |
| `target` | String | User that was blocked/unblocked        | Always            |
| `user`   | String | User that blocked/unblocked the target | Always            |
| `length` | String | Length of the block                    | `block`           |
| `reason` | String | Reason for the block/unblock           | Always            |

### List
If the message represents a list modification, it contains an `action` property which can be set to one of:
- `add` - If the user was added into a list
- `delete` - If the user was removed from a list
- `update` - If the user's information on a list was updated
- `info` - If somebody from IRC was just seeking information about a user's presence on lists

This message can contain additional properties:

| Name      | Type   | Description                            | Present if action         |
| --------- | ------ | -------------------------------------- | ------------------------- |
| `user`    | String | User on the list                       | Always                    |
| `list`    | String | List type                              | Always                    |
| `addedBy` | String | User that added a user into a list     | `add`, `update` or `info` |
| `reason`  | String | Reason for a user's presence on a list | `add`, `update` or `info` |

### Discussions
If the message represents a Discussions event, it contains an `action` property which can be set to one of:
- `create` - If the target was created
- `delete` - If the target was deleted
- `undelete` - If the target was undeleted
- `move` - If the target was moved
- `edit` - If the target was edited

It also contains a `target` property which can be set to one of:
- `thread` - If the action was executed on a thread
- `report` - If the action was executed on a thread/reply report
- `reply` - If the action was executed on a thread reply
It can also contain the following properties:

| Name       | Type    | Description                             | Present if target |
| ---------- | ------- | --------------------------------------- | ----------------- |
| `user`     | String  | User executing the action               | Always            |
| `title`    | String  | Title of the thread                     | `thread`          |
| `reply`    | Integer | Number of the reply on the thread       | not `thread`      |
| `wiki`     | String  | Subdomain of the wiki                   | Always            |
| `threadId` | String  | ID of the thread                        | Always            |
| `replyId`  | String  | ID of the reply                         | not `thread`      |
| `summary`  | String  | Excerpt from the thread                 | Always            |

### Spam
If the message represents possible spam, it will have a `spamtype` property which can be set to either `coi` or `hit`,
depending on if the user hit one of the Conflict of Interest filters or the spam blacklist.

Meanings of spam filters are as following (names in braces are what spam filters are going to get renamed to in future):
- `COI1`
    - User inserted a link that matches their username (`URL`)
    - Anonymous user created a page with the same title and summary (`XRM`)
    - User with a small editcount created a thread on their wall with an external link (`THR`)
- `COI2` (`COI`) - Wiki URL matches its founder's username
- `COI3` (`COI`) - Wiki name matches its founder's username
- `COI4` (`WUR`) - User inserted a link into their newfounded wiki too soon
- `COI5` (`FLT`) - Content of a newly created page matches title, summary or content filter
- `COI6` (`ANS`) - Checks when a user inserts a link on a talkpage on an Answers wiki and also reports
  the main page's creator

It will also have an `action` property which represents what did the user do when they hit the filter:
- `edit` - The user was editing a page
- `create` - The user was creating a page
- `wiki` - The user was creating a wiki
It can also contain the following properties:

| Name       | Type    | Description                               | Present if                     |
| ---------- | ------- | ----------------------------------------- | ------------------------------ |
| `coi`      | Integer | Number of the Conflict of Interest filter | Always                         |
| `percent`  | Float   | How much the action matched the filter    | Always                         |
| `coitype`  | Number  | Type of the `COI5` filter                 | `coi` is 5                     |
| `user`     | String  | User that hit the filter                  | Always                         |
| `wiki`     | String  | On which wiki was the action attempted    | Always                         |
| `oldid`    | Integer | ID of the revision                        | Page was created               |
| `thread`   | String  | ID of the Discussions thread              | Filter was hit on Discussions  |
| `reply`    | String  | ID of the Discussions reply               | Filter was hit on Discussions  |
| `talkpage` | String  | Name of the talkpage                      | `coi` is 6                     |
| `title`    | String  | Title of the page                         | `COI5.2` was hit               |
| `url`      | String  | URL that was inserted                     | `COI5.4` was hit               |
| `summary`  | String  | Summary that was used                     | `COI5.3` was hit               |
| `xrumer`   | Boolean | If XRumer spam (`XRM`) has been detected  | Always                         |
| `thread`   | Boolean | If thread spam (`THR`) has been detected  | Always                         |
| `filter`   | Integer | Filter that was hit                       | `coi` is 5                     |
| `content`  | String  | Content of the filter that was hit        | `coi` is 5                     |
| `mainUser` | String  | Second user involved in `ANS` spam        | `coi` is 6                     |

### New users
If the message represents a user that just registered, it will contain the following properties:
| Name   | Type   | Description                                 |
| ------ | ------ | ------------------------------------------- |
| `user` | String | Name of the user that registered            |
| `wiki` | String | Subdomain of the wiki where they registered |

### Uploads
If the message represents a new file being uploaded, it will contain the following properties:
| Name        | Type    | Description                                       |
| ----------- | ------- | ------------------------------------------------- |
| `reupload`  | Boolean | `true` if the file has been reuploaded            |
| `user`      | String  | User who uploaded the file                        |
| `wiki`      | String  | Subdomain of the wiki where the file was uploaded |
| `namespace` | String  | Name of the file namespace on the wiki            |
| `file`      | String  | Filename of the uploaded file                     |

## Other
- To get a message's raw content, you can use its `raw` property
- Message properties cannot be modified
