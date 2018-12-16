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
/* eslint-disable */
const REGEX = {
    discussions: /^\[\[User:([^\]]+)\]\] (replied|reported post|(created|deleted|undeleted|moved|edited) (thread|report|reply))(?: \[\[(.*)\]\])?(?: \((\d+)\))? https?:\/\/([a-z0-9-.]+)\.(wikia|fandom)\.com\/(?:([a-z-]+)\/)?d\/p\/(\d{19})(?:\/r\/(\d{19}))? : (.*)/,
    spam: /^COI(\d+) \((\d(?:\.\d{1,2})?|!)(?:, (\d+))?\) \[\[User:([^\]]+)\]\] (created|created wiki|edited) https?:\/\/([a-z0-9-.]+)\.(wikia|fandom)\.com\/(?:([a-z-]+)\/)?(?:index\.php\?oldid=(\d+)|d\/p\/(\d{19,})(?:\/r\/(\d{19,}))?|Talk:([^\s]+))?(?: (with title|with URL|with title|with summary|matching filter|matching criteria:) ([^,]+)(?:, filter (.+), #(\d+)$|, main page created by \[\[User:([^\]]+)\]\]$)?)?/g,
    newusers: /^(.*) New user registration https?:\/\/(.*)\.wikia\.com\/wiki\/Special:Log\/newusers - https?:\/\/([a-z0-9-.]+)\.(wikia|fandom)\.com\/(?:([a-z-]+)\/)?wiki\/Special:Contributions\/.*/g,
    uploads: /^New (upload|reupload) \[\[User:([^\]]+)\]\] https?:\/\/([a-z0-9-.]+)\.(wikia|fandom)\.com\/(?:([a-z-]+)\/)?wiki\/Special:Log\/upload \[\[([^:]+):([^\]]+)\]\]$/g,
    edit: /^(User|IP|Whitelist|Blacklist|Admin|Greylist) \[\[User:([^\]]+)\]\] (edited|created|used edit summary "([^"]+)"( in creating)*|Copyvio\?|Tiny create|Possible gibberish\?|Large removal|create containing watch word "([^"]+)"|blanked)( watched)? \[\[([^\]]+)\]\] \(([+-\d]+)\) (URL|Diff): https?:\/\/([a-z0-9-.]+)\.(wikia|fandom)\.com\/(?:([a-z-]+)\/)?(?:index\.php\?|\?|wiki\/)*([^\s]+)(?: (.*))*/g,
    replace: /^(User|IP|Whitelist|Blacklist|Admin|Greylist) \[\[User:([^\]]+)\]\] replaced \[\[([^\]]+)\]\] with "(.*)" \(([+-\d]+)\) Diff: https?:\/\/([a-z0-9-.]+)\.(wikia|fandom)\.com\/(?:([a-z-]+)\/)?\?([^\s]+)/g,
    block: /^(Block|Unblock) [eE]ditor \[\[User:([^\]]+)\]\] (?:blocked|unblocked) by admin \[\[User:([^\]]+)\]\] (?:Length: (.*) )*"([^"]+)"/g,
    // Add proper messages for bna
    list: /^(?:(Added|Updated): )*(.*) is on (global whitelist|global blacklist|global greylist|rc bot list|rc admin list|bad edit summary list|bad new articles list|bad new usernames list), added by (.*) until (.*) \("(.*)"\)$/g,
    listRemove: /^Deleted (.*) from (global whitelist|global blacklist|rc bot list|rc admin list|bad edit summary list)$/g,
    noList: /^(.*) is not on (global whitelist|global blacklist|rc bot list|rc admin list|bad edit summary list)$/g
};
/* eslint-enable */

/**
 * Lists a user can be in
 * @todo Move this to a JSON file?
 */
const LISTS = {
    'bad edit summary list': 'bes',
    'bad new articles list': 'bna',
    'bad new usernames list': 'bnu',
    'global blacklist': 'bl',
    'global greylist': 'gl',
    'global whitelist': 'wl',
    'rc admin list': 'al',
    'rc bot list': 'bot'
}, SPAM_ACTIONS = {
    'created': 'page',
    'created wiki': 'wiki',
    'edited': 'edit'
};

/**
 * Class handling all message parsing logic
 */
class Message {
    /**
     * Class constructor
     * @param {String} message Message to parse
     */
    constructor(message) {
        this.raw = message;
        this._initType();
        util.sleep(this);
    }
    /**
     * Determines the message type and passes regex result to further methods
     * @private
     */
    _initType() {
        for (const i in REGEX) {
            const v = REGEX[i],
                  res = v.exec(this.raw);
            v.lastIndex = 0;
            if (res) {
                res.shift();
                this[`_handle${util.cap(i)}`](res);
                break;
            }
        }
    }
    /**
     * Debugs text into appropriate place
     * @param {String} text Text to debug
     */
    _debug(text) {
        if (global.main) {
            main.debug(text);
        } else {
            console.log(text);
        }
    }
    /**
     * Handles message parsing in case the message was an edit sign
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
        if (res.shift() === 'URL') {
            this.action = 'create';
        }
        this.wiki = res.shift();
        this.urlParams = this._handleURL(res.shift());
        this.summary = res.shift();
    }
    /**
     * Handles message parsing in case the message was a replacement sign
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
     * @private
     * @param {Array} res Regular expression execution result
     * @todo Word this description better
     * @todo Make this not a noop
     */
    _handleNoList() {
        // ¯\_(ツ)_/¯
    }
    /**
     * Handles some parsing logic in edit-related messages
     * @private
     * @param {String} type A user's type
     * @param {String} name User's name
     */
    _handleEditBase(type, name) {
        this.type = 'edit';
        this.userType = type.toLowerCase();
        this.user = name;
    }
    /**
     * Handles actions in edit-related messages
     * @private
     * @param {String} action Action that happened
     * @param {String} summary Watched edit summary if there is one
     * @param {String} create If the watched edit summary was used in creation
     * @param {String} watchWord Watched creation summary
     * @returns {String} Action that happened
     */
    _handleAction(action, summary, create, watchWord) {
        switch (action) {
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
                if (summary) {
                    this.watched = summary;
                    return create ? 'create' : 'edit';
                } else if (watchWord) {
                    this.watched = watchWord;
                    return 'create';
                }
                this._debug(`
                    No action recognized!
                    Action: ${action}
                    Summary: ${summary}
                    Create: ${create}
                    Watch word: ${watchWord}
                `);
                return '';
        }
    }
    /**
     * Handles diff URLs
     * @private
     * @param {String} params Query parameters
     * @returns {Object} Object-ified query parameters
     */
    _handleURL(params) {
        const ret = {};
        if (params.includes('=')) {
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
    /**
     * Handles Discussions events sent in #wikia-discussions channel
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
     * @private
     * @param {String} action1 Whole action
     * @param {String} action2 If not a specific case, represents an action
     * @param {String} action3 If not a specific case, represents a target
     * @returns {Array<String>} Where first element is the action and second
     *                          the target
     */
    _handleDiscussionsAction(action1, action2, action3) {
        switch (action1) {
            case 'replied': return ['create', 'reply'];
            case 'reported post': return ['create', 'report'];
            default: switch (action2) {
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
     * Handles possible spam sent in #wikia-spam channel
     * @private
     * @param {Array} res Regular expression execution result
     */
    _handleSpam(res) {
        this.type = 'spam';
        this.coi = Number(res.shift());
        const percent = res.shift();
        this.percent = percent === '!' ?
            1 : Number(percent);
        this.coitype = Number(res.shift());
        this.user = res.shift();
        this.action = SPAM_ACTIONS[res.shift()];
        this.wiki = res.shift();
        this.isFandom = res.shift() === 'fandom';
        this.lang = res.shift();
        this.oldid = Number(res.shift());
        this.thread = res.shift();
        this.reply = res.shift();
        this.talkpage = decodeURIComponent(res.shift());
        this._handleAdditional(res.shift(), res.shift());
        const content = res.shift(),
              filter = res.shift();
        if (!this.filter && filter && content) {
            this.content = content;
            this.filter = Number(filter);
        }
        this.mainUser = res.shift();
    }
    /**
     * Handles additional content with the spam filter hitting
     * @param {String} type Type of the additional content
     * @param {String} content Additional content
     */
    _handleAdditional(type, content) {
        switch (type) {
            case 'with title':
                this.title = content;
                break;
            case 'with URL':
                this.url = content;
                break;
            case 'with summary':
                this.summary = content;
                break;
            case 'matching filter':
                this.filter = Number(content.substring(1));
                break;
            case 'matching criteria:':
                if (content === 'IP and title equals summary') {
                    this.xrumer = true;
                } else if (content === 'user and URL addition to Wall') {
                    this.thread = true;
                } else {
                    this._debug(`Unknown criteria: ${content}`);
                }
                break;
            case undefined:
                break;
            default:
                this._debug(`
                    No additional content recognized!
                    Additional: ${content}
                `);
                break;
        }
    }
    /**
     * Handles new user registration messages
     * @private
     * @param {Array} res Regular expression execution result
     */
    _handleNewusers(res) {
        this.type = 'newusers';
        this.user = res.shift();
        this.wiki = res.shift();
    }
    /**
     * Handles new file upload messages
     * @private
     * @param {Array} res Regular expression execution result
     */
    _handleUploads(res) {
        this.type = 'upload';
        this.reupload = res.shift() === 'reupload';
        this.user = res.shift();
        this.wiki = res.shift();
        this.namespace = res.shift();
        this.file = res.shift();
    }
}

module.exports = Message;
