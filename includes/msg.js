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
    discussions: /^\[\[User:([^\]]+)\]\] (replied|reported post|(created|deleted|undeleted|moved|edited) (thread|report|reply))(?: \[\[(.*)\]\])?(?: \((\d+)\))? https?:\/\/(.+)\.wikia\.com\/d\/p\/(\d{19})(?:\/r\/(\d{19}))? : (.*)/,
    spam: /^(COI(\d+)|HIT) \((\d(?:\.\d{1,2})?|direct|!)\) \[\[User:([^\]]+)\]\] (created|created wiki|edited) https?:\/\/(.+)\.wikia\.com\/(?:index\.php\?oldid=(\d+))?(?: (with title|with URL|matching filter) ([^,]+)(?:, filter (.+)$)?)?/g,
    newusers: /^(.*) New user registration https?:\/\/(.*)\.wikia\.com\/wiki\/Special:Log\/newusers - https?:\/\/.*\.wikia\.com\/wiki\/Special:Contributions\/.*/g,
    edit: /^(User|IP|Whitelist|Blacklist|Admin|Greylist) \[\[User:([^\]]+)\]\] (edited|created|used edit summary "([^"]+)"( in creating)*|Copyvio\?|Tiny create|Possible gibberish\?|Large removal|create containing watch word "([^"]+)"|blanked)( watched)? \[\[([^\]]+)\]\] \(([+-\d]+)\) (URL|Diff): https?:\/\/([^\s]+)\.wikia\.com\/(?:index\.php\?|\?|wiki\/)*([^\s]+)(?: (.*))*/g,
    replace: /^(User|IP|Whitelist|Blacklist|Admin|Greylist) \[\[User:([^\]]+)\]\] replaced \[\[([^\]]+)\]\] with "(.*)" \(([+-\d]+)\) Diff: https?:\/\/([^\s]+)\.wikia\.com\/\?([^\s]+)/g,
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
     * @returns {void}
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
     * Handles message parsing in case the message was an edit sign
     * @private
     * @param {Array} res Regular expression execution result
     * @returns {void}
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
     * @returns {void}
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
     * @returns {void}
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
     * @returns {void}
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
     * @returns {void}
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
     * @returns {void}
     */
    _handleNoList() {
        // ¯\_(ツ)_/¯
    }
    /**
     * Handles some parsing logic in edit-related messages
     * @private
     * @param {String} type A user's type
     * @param {String} name User's name
     * @returns {void}
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
     * @returns {void}
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
     * @returns {void}
     */
    _handleSpam(res) {
        this.type = 'spam';
        this.spamtype = res.shift().toLowerCase() === 'hit' ? 'hit' : 'coi';
        this.coi = Number(res.shift());
        const percent = res.shift();
        this.percent = percent === 'direct' || percent === '!' ?
            1 : Number(percent);
        this.user = res.shift();
        this.action = SPAM_ACTIONS[res.shift()];
        this.wiki = res.shift();
        this.oldid = Number(res.shift());
        const additional = res.shift();
        if (additional === 'with title') {
            this.title = res.shift();
        } else if (additional === 'with URL') {
            this.url = res.shift();
        } else if (additional === 'matching filter') {
            this.filter = Number(res.shift().substring(1));
        }
        if (!this.filter) {
            this.filter = res.shift();
        }
    }
    /**
     * Handles new user registration messages
     * @private
     * @param {Array} res Regular expression execution result
     * @returns {void}
     */
    _handleNewusers(res) {
        this.type = 'newusers';
        this.user = res.shift();
        this.wiki = res.shift();
    }
}

module.exports = Message;
