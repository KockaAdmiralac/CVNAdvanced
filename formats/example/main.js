/**
 * main.js
 *
 * Module for example format
 */
/* jshint maxlen: 200 */
'use strict';

/**
 * Importing modules
 */
const Format = require('../format.js'),
      util = require('../../includes/util.js');

/**
 * Constants
 */
const USER_TYPE_COLOR = {
    ip: 0x00FF00,
    user: 0xFF00FF,
    whitelist: 0x0080FF,
    blacklist: 0xFF0000,
    admin: 0xBADA55,
    greylist: 0xFFFF00
}, LIST_TYPE = {
    bl: 'blacklist',
    wl: 'whitelist',
    gl: 'greylist',
    bot: 'bot list',
    al: 'admin list',
    bes: 'bad edit summary list',
    bna: 'bad new article list',
    bnu: 'bad new username list'
}, LIST_ACTION = {
    add: 'Added to',
    delete: 'Removed from',
    update: 'Updated on',
    info: 'Is currently on'
}, LIST_COLOR = {
    bl: 0x000000,
    wl: 0xFFFFFF,
    gl: 0xAAAAAA,
    bot: 0xDDDDDD,
    al: 0x00FF00,
    bes: 0xFF5500,
    bna: 0xFF1188,
    bnu: 0xFF44AA
};

/**
 * Main class
 * @class ExampleFormat
 * @augments Format
 */
class ExampleFormat extends Format {
    /**
     * Main class method
     * @method execute
     * @param {Message} msg Message to format
     * @return {Object} Formatted embed
     */
    execute(transport, msg) {
        if(msg.type === 'discussions') {
            return;
        }
        switch(transport.constructor.name) {
            case 'Discord':
                return { embeds: [ this[`_embed${util.cap(msg.type)}`](msg) ] };
            default:
                main.hook('parameterError');
        }
    }
    /**
     * Formats an embed if it's an edit
     * @method _embedEdit
     * @private
     * @param {Message} msg Message to format
     * @return {Object} Formatted embed
     */
    _embedEdit(msg) {
        return {
            title: msg.userType,
            description: this._editDescription(msg),
            color: this._editColor(msg),
            author: {
                name: `${msg.user} [${msg.wiki}]`,
                url: this._userURL(msg)
            }
        };
    }
    /**
     * Formats the embed if it's a list action
     * @method _embedList
     * @private
     * @param {Message} msg Message to format
     * @return {Object} Formatted embed
     */
    _embedList(msg) {
        return {
            title: `${LIST_ACTION[msg.action]} ${LIST_TYPE[msg.list]}`,
            description: msg.addedBy && msg.length && msg.reason ?
                `By ${msg.addedBy} until ${msg.length} ${this._summary(msg)}` :
                undefined,
            color: LIST_COLOR[msg.list],
            author: {
                name: msg.user,
                url: this._userURL(msg)
            }
        };
    }
    /**
     * Formats the embed if it's a block
     * @method _embedBlock
     * @private
     * @param {Message} msg Message to format
     * @return {Object} Formatted embed
     */
    _embedBlock(msg) {
        const block = msg.action === 'block';
        return {
            title: `${block ? 'Blocked' : 'Unblocked'} by ${msg.user}`,
            description: block ?
                `For ${msg.length} ${this._summary(msg)}` :
                this._summary(msg),
            author: {
                name: msg.target,
                url: this._userURL(msg)
            }
        };
    }
    /**
     * Formats the embed description if it's an edit
     * @method _editDescription
     * @private
     * @param {Message} msg Message to format
     * @return {String} Embed description
     */
    _editDescription(msg) {
        switch(msg.action) {
            case 'edit': return `Edited ${this._makePageURL(msg)} (${this._diffSize(msg)}) {${this._makeDiffURL(msg)}} ${this._notices(msg)} ${this._summary(msg)}`;
            case 'create': return `Created ${this._makePageURL(msg)} (${this._diffSize(msg)}) ${this._notices(msg)} ${this._summary(msg)}`;
            case 'log': return `Log action \`${msg.log}\` ${this._notices(msg)} ${this._summary(msg)}`;
        }
    }
    /**
     * Returns the embed color if it's an edit
     * @method _editColor
     * @private
     * @param {Message} msg Message to format
     * @return {Number} Embed color
     */
    _editColor(msg) {
        switch(msg.action) {
            case 'edit':
            case 'create':
                if(msg.diffSize < -1500 || msg.diffSize > 10000) {
                    return 0xFF0000;
                } else if(msg.watched) {
                    return 0xFFFF00;
                } else {
                    return USER_TYPE_COLOR[msg.userType];
                }
                break;
            case 'log': return USER_TYPE_COLOR[msg.userType];
        }
    }
    /**
     * Formats a Markdown URL
     * @method _makeURL
     * @private
     * @param {String} wiki Wiki subdomain
     * @param {String} page Page name
     * @param {String} text Text in the URL, defaults to page name
     * @return {String} Markdown URL
     */
    _makeURL(wiki, page, text) {
        return `[${text || page}](http://${wiki}.wikia.com/${page})`;
    }
    /**
     * Encodes a page title to fit in a Markdown URL properly
     * @method _encodePageTitle
     * @private
     * @param {String} title Page title to encode
     * @return {String} Encoded page title
     */
    _encodePageTitle(title) {
        return encodeURIComponent(title.replace(/ /g, '_'))
            .replace(/\)/g, '%29');
    }
    /**
     * Creates a Markdown URL to a wiki page
     * @method _makePageURL
     * @private
     * @param {Message} msg Message to format
     * @return {String} Markdown URL
     */
    _makePageURL(msg) {
        const t = msg.title;
        return this._makeURL(msg.wiki, `wiki/${this._encodePageTitle(t)}`, t);
    }
    /**
     * Creates a Markdown URL to a diff page
     * @method _makeDiffURL
     * @private
     * @param {Message} msg Message to format
     * @return {String} Markdown URL
     */
    _makeDiffURL(msg) {
        return this._makeURL(msg.wiki, `?diff=${msg.urlParams.diff}`, 'diff');
    }
    /**
     * Formats an edit summary
     * @method _summary
     * @private
     * @param {Message} msg Message to format
     * @return {String} Formatted edit summary
     */
    _summary(msg) {
        const text = msg.summary || msg.reason;
        if(text) {
            const trim = text.trim();
            if(trim && trim !== '""') {
                return `(*${trim}*)`;
            }
        }
        return '';
    }
    /**
     * Shows if a watched summary was used, page was blanked or replaced
     * @method _notices
     * @private
     * @param {Message} msg Message to format
     * @return {String} Formatted edit summary
     */
    _notices(msg) {
        if(msg.watched) {
            return `**watched edit summary** "${msg.watched}"`;
        } else if(msg.blanked) {
            return `**page blanked**`;
        } else if(msg.replace) {
            return `**replaced with** "${msg.replace}"`;
        }
        return '';
    }
    /**
     * Formats the diff size number
     * @method _diffSize
     * @private
     * @param {Message} msg Message to format
     * @return {String} Formatted diff size number
     */
    _diffSize(msg) {
        const size = msg.diffSize;
        let res = size;
        if(size > 0) {
            res = `+${res}`;
        }
        if(size > 1000 || size < -1000) {
            res = `*${res}*`;
        }
        return res;
    }
    /**
     * Makes an URL to user's contributions page on a wiki
     * @method _userURL
     * @private
     * @param {Message} msg Message to format
     * @return {String} URL to user's contributions
     */
    _userURL(msg) {
        return `http://${msg.wiki || 'c'}.wikia.com/wiki/Special:Contribs/${encodeURIComponent(msg.user)}`;
    }
}

module.exports = ExampleFormat;
