/**
 * msg.js
 *
 * Module for handling message parsing logic
 */
'use strict';

/**
 * Importing modules
 */
const util = require('./util.js');

/**
 * Regexes
 * If you wanted to debug this you might as well just kill yourself right now
 * @todo Move this to a JSON file?
 */
const REGEX = {
    discussions: /\[\[User:([^\]]+)\]\] (replied|reported post|(created|deleted|undeleted|moved|edited) (thread|report|reply))(?: \[\[(.*)\]\])?(?: \((\d+)\))? http:\/\/(.+)\.wikia\.com\/d\/p\/(\d{19})(?:\/r\/(\d{19}))? : (.*)/, // jshint ignore:line
    edit: /^(User|IP|Whitelist|Blacklist|Admin|Greylist) \[\[User:([^\]]+)\]\] (edited|created|used edit summary "([^"]+)"( in creating)*|Copyvio\?|Tiny create|Possible gibberish\?|Large removal|create containing watch word "([^"]+)"|blanked)( watched)? \[\[([^\]]+)\]\] \(([\+-\d]+)\) (URL|Diff): http:\/\/([^\s]+)\.wikia\.com\/(?:index\.php\?|\?|wiki\/)*([^\s]+)(?: (.*))*/g, // jshint ignore:line
    replace: /^(User|IP|Whitelist|Blacklist|Admin|Greylist) \[\[User:([^\]]+)\]\] replaced \[\[([^\]]+)\]\] with "(.*)" \(([\+-\d]+)\) Diff: http:\/\/([^\s]+)\.wikia\.com\/\?([^\s]+)/g, // jshint ignore:line
    block: /^(Block|Unblock) [eE]ditor \[\[User:([^\]]+)\]\] (?:blocked|unblocked) by admin \[\[User:([^\]]+)\]\] (?:Length: (.*) )*"([^"]+)"/g, // jshint ignore:line
    // Add proper messages for bna
    list: /^(?:(Added|Updated): )*(.*) is on (global whitelist|global blacklist|global greylist|rc bot list|rc admin list|bad edit summary list|bad new articles list|bad new usernames list), added by (.*) until (.*) \("(.*)"\)$/g, // jshint ignore:line
    listRemove: /^Deleted (.*) from (global whitelist|global blacklist|rc bot list|rc admin list|bad edit summary list)$/g, // jshint ignore:line
    noList: /^(.*) is not on (global whitelist|global blacklist|rc bot list|rc admin list|bad edit summary list)$/g // jshint ignore:line
};

/**
 * Lists a user can be in
 * @todo Move this to a JSON file?
 */
const LISTS = {
    'global blacklist': 'bl',
    'global whitelist': 'wl',
    'global greylist': 'gl',
    'rc bot list': 'bot',
    'rc admin list': 'al',
    'bad edit summary list': 'bes',
    'bad new articles list': 'bna', // article???
    'bad new usernames list': 'bnu' // username???
};

/**
 * Class handling all message parsing logic
 * @class Message
 */
class Message {
    /**
     * Class constructor
     * @constructor
     * @param {String} message Message to parse
     */
    constructor(message) {
        this.raw = message;
        this._initType();
        util.sleep(this);
    }
    /**
     * Determines the message type and passes regex result to further methods
     * @method _initType
     * @private
     */
    _initType() {
        let hit = false;
        util.each(REGEX, function(k, v) {
            if(hit) {
                return;
            }
            let res = v.exec(this.raw);
            v.lastIndex = 0;
            if(res) {
                hit = true;
                res.shift();
                this[`_handle${util.cap(k)}`](res);
            }
        }, this);
    }
    /**
     * Handles message parsing in case the message was an edit sign
     * @method _handleEdit
     * @private
     * @param {Array} res Regular expression execution result
     */
    _handleEdit(res) {
        this._handleEditBase(res.shift(), res.shift());
        this.action = this._handleAction(
            res.shift(), res.shift(), res.shift(), res.shift()
        );
        this.watchlist = Boolean(res.shift());
        this.title = res.shift();
        this.diffSize = Number(res.shift());
        if(res.shift() === 'URL') {
            this.action = 'create';
        }
        this.wiki = res.shift();
        this.urlParams = this._handleURL(res.shift());
        this.summary = res.shift();
    }
    /**
     * Handles message parsing in case the message was a replacement sign
     * @method _handleReplace
     * @private
     * @param {Array} res Regular expression execution result
     */
    _handleReplace(res) {
        this._handleEditBase(res.shift(), res.shift());
        this.title = res.shift();
        this.replace = res.shift();
        this.diffSize = Number(res.shift());
        this.wiki = res.shift();
        this.urlParams = this._handleURL(res.shift());
    }
    /**
     * Handles message parsing in case the message was a block sign
     * @method _handleBlock
     * @private
     * @param {Array} res Regular expression execution result
     */
    _handleBlock(res) {
        this.type = 'block';
        this.action = res.shift() === 'Block' ? 'block' : 'unblock';
        this.target = res.shift();
        this.user = res.shift();
        this.length = res.shift();
        this.reason = res.shift();
    }
    /**
     * Handles message parsing in case the message was a list modification sign
     * @method _handleList
     * @private
     * @param {Array} res Regular expression execution result
     */
    _handleList(res) {
        this.type = 'list';
        const action = res.shift();
        this.action =
            action === 'Added' ?
                'add' :
                action === 'Updated' ?
                    'update' :
                    'info';
        this.user = res.shift();
        this.list = LISTS[res.shift()];
        this.addedBy = res.shift();
        this.length = res.shift();
        this.reason = res.shift();
    }
    /**
     * Handles message parsing in case the message was a list removal sign
     * @method _handleListRemove
     * @private
     * @param {Array} res Regular expression execution result
     */
    _handleListRemove(res) {
        this.type = 'list';
        this.action = 'delete';
        this.user = res.shift();
        this.list = LISTS[res.shift()];
    }
    /**
     * Handles message parsing in case the message was a sign of negation of
     * a member's existence in a list
     * @method _handleReplace
     * @private
     * @param {Array} res Regular expression execution result
     * @todo Word this description better
     * @todo Make this not a noop or insert an actual shrug in the comment
     */
    _handleNoList() {
        // shrug
    }
    /**
     * Handles Discussions events sent in #wikia-discussions channel
     * @method _handleDiscussions
     * @private
     * @param {Array} res Regular expression execution result
     */
    _handleDiscussions(res) {
        this.type = 'discussions';
        this.user = res.shift();
        const arr = this._handleDiscussionsAction(
            res.shift(), res.shift(), res.shift()
        );
        this.action = arr[0];
        this.target = arr[1];
        this.title = res.shift();
        this.reply = Number(res.shift());
        this.wiki = res.shift();
        this.threadId = res.shift();
        this.replyId = res.shift();
        this.summary = res.shift();
    }
    /**
     * Handles Discussions actions
     * @method _handleDiscussionsAction
     * @private
     * @param {String} action1 Whole action
     * @param {String} action2 If not a specific case, represents an action
     * @param {String} action3 If not a specific case, represents a target
     * @returns {Array<String>} Where first element is the action and second
     *                          the target
     */
    _handleDiscussionsAction(action1, action2, action3) {
        switch(action1) {
            case 'replied': return ['create', 'reply'];
            case 'reported post': return ['create', 'report'];
            default: switch(action2) {
                case 'created': return ['create', action3];
                case 'deleted': return ['delete', action3];
                case 'undeleted': return ['undelete', action3];
                case 'moved': return ['move', action3];
                case 'edited': return ['edit', action3];
                default: return [null, null];
            }
        }
    }
    /**
     * Handles some parsing logic in edit-related messages
     * @method _handleEditBase
     * @private
     * @param {String} type A user's type
     * @param {String} user User's name
     */
    _handleEditBase(type, name) {
        this.type = 'edit';
        this.userType = type.toLowerCase();
        this.user = name;
    }
    /**
     * Handles actions in edit-related messages
     * @method _handleAction
     * @private
     * @param {String} action Action that happened
     * @param {String} summary Watched edit summary if there is one
     * @param {String} create If the watched edit summary was used in creation
     * @param {String} watchWord Watched creation summary
     * @return {String} Action that happened
     */
    _handleAction(action, summary, create, watchWord) {
        switch(action) {
            case 'edited':
            case 'Copyvio?':
            case 'Possible gibberish?':
            case 'Large removal':
                return 'edit';
            case 'created':
            case 'Tiny create':
                return 'create';
            case 'blanked':
                this.blank = true;
                return 'edit';
            default:
                if(summary) {
                    this.watched = summary;
                    return create ? 'create' : 'edit';
                } else if(watchWord) {
                    this.watched = watchWord;
                    return 'create';
                } else {
                    main.debug(`
                        No action recognized!
                        Action: ${action}
                        Summary: ${summary}
                        Create: ${create}
                        Watch word: ${watchWord}
                    `);
                    return '';
                }
        }
    }
    /**
     * Handles diff URLs
     * @method _handleURL
     * @private
     * @param {String} params Query parameters
     * @return {Object} Object-ified query parameters
     */
    _handleURL(params) {
        const ret = {};
        if(params.includes('=')) {
            params.split('&').forEach(function(p) {
                const split = p.split('=');
                ret[split[0]] = split[1];
            });
        } else {
            this.action = 'log';
            this.log = params.split('/')[1];
        }
        return ret;
    }
}

module.exports = Message;
