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
    admin: 0xBADA55,
    blacklist: 0xFF0000,
    greylist: 0xFFFF00,
    ip: 0x00FF00,
    user: 0xFF00FF,
    whitelist: 0x0080FF
}, LIST_TYPE = {
    al: 'admin list',
    bes: 'bad edit summary list',
    bl: 'blacklist',
    bna: 'bad new article list',
    bnu: 'bad new username list',
    bot: 'bot list',
    gl: 'greylist',
    wl: 'whitelist'
}, LIST_ACTION = {
    add: 'Added to',
    delete: 'Removed from',
    info: 'Is currently on',
    update: 'Updated on'
}, LIST_COLOR = {
    al: 0x00FF00,
    bes: 0xFF5500,
    bl: 0x000000,
    bna: 0xFF1188,
    bnu: 0xFF44AA,
    bot: 0xDDDDDD,
    gl: 0xAAAAAA,
    wl: 0xFFFFFF
};

/**
 * Main class
 * @augments Format
 */
class ExampleFormat extends Format {
    /**
     * Main class method
     * @param {Transport} transport Transport transporting the message
     * @param {Message} msg Message to format
     * @returns {Object} Formatted embed
     */
    execute(transport, msg) {
        if (!['edit', 'list', 'block', 'upload'].includes(msg.type)) {
            return;
        }
        switch (transport.constructor.name) {
            case 'Discord':
                return {embeds: [this[`_embed${util.cap(msg.type)}`](msg)]};
            default:
                main.hook('parameterError');
        }
    }
    /**
     * Formats an embed if it's an edit
     * @private
     * @param {Message} msg Message to format
     * @returns {Object} Formatted embed
     */
    _embedEdit(msg) {
        return {
            author: {
                name: `${msg.user} [${msg.wiki}]`,
                url: this._userURL(msg)
            },
            color: this._editColor(msg),
            description: this._editDescription(msg),
            title: msg.userType
        };
    }
    /**
     * Formats the embed if it's a list action
     * @private
     * @param {Message} msg Message to format
     * @returns {Object} Formatted embed
     */
    _embedList(msg) {
        return {
            author: {
                name: msg.user,
                url: this._userURL(msg)
            },
            color: LIST_COLOR[msg.list],
            description: msg.addedBy && msg.length && msg.reason ?
                `By ${msg.addedBy} until ${msg.length} ${this._summary(msg)}` :
                undefined,
            title: `${LIST_ACTION[msg.action]} ${LIST_TYPE[msg.list]}`
        };
    }
    /**
     * Formats the embed if it's a block
     * @private
     * @param {Message} msg Message to format
     * @returns {Object} Formatted embed
     */
    _embedBlock(msg) {
        const block = msg.action === 'block';
        return {
            author: {
                name: msg.target,
                url: this._userURL(msg, 'target')
            },
            description: block ?
                `For ${msg.length} ${this._summary(msg)}` :
                this._summary(msg),
            title: `${block ? 'Blocked' : 'Unblocked'} by ${msg.user}`,
            url: this._userURL(msg)
        };
    }
    /**
     * Formats the embed if it's a file upload
     * @private
     * @param {Message} msg Message to format
     * @returns {Object} Formatted embed
     */
    _embedUpload(msg) {
        return {
            author: {
                name: msg.user,
                url: this._userURL(msg)
            },
            description: `${
                msg.reupload ? 'Reuploaded' : 'Uploaded'
            } ${
                this._makeURL(
                    msg.wiki,
                    `${msg.namespace}:${msg.title}`,
                    msg.title
                )
            } (${this._makeURL(msg.wiki, 'wiki/Special:Log/upload', 'log')})`
        };
    }
    /**
     * Formats the embed description if it's an edit
     * @private
     * @param {Message} msg Message to format
     * @returns {String} Embed description
     */
    _editDescription(msg) {
        switch (msg.action) {
            case 'edit':
                return `Edited ${this._makePageURL(msg)} (${this._diffSize(msg)}) {${this._makeDiffURL(msg)}} ${this._notices(msg)} ${this._summary(msg)}`;
            case 'create':
                return `Created ${this._makePageURL(msg)} (${this._diffSize(msg)}) ${this._notices(msg)} ${this._summary(msg)}`;
            case 'log':
                return `Log action \`${msg.log}\` ${this._notices(msg)} ${this._summary(msg)}`;
            default:
                return 'Something really bad happened';
        }
    }
    /**
     * Returns the embed color if it's an edit
     * @private
     * @param {Message} msg Message to format
     * @returns {Number} Embed color
     */
    _editColor(msg) {
        switch (msg.action) {
            case 'edit':
            case 'create':
                if (msg.diffSize < -1500 || msg.diffSize > 10000) {
                    return 0xFF0000;
                } else if (msg.watched) {
                    return 0xFFFF00;
                }
                return USER_TYPE_COLOR[msg.userType];
            case 'log': return USER_TYPE_COLOR[msg.userType];
            default: return 'Something bad happened';
        }
    }
    /**
     * Formats a Markdown URL
     * @private
     * @param {String} wiki Wiki subdomain
     * @param {String} page Page name
     * @param {String} text Text in the URL, defaults to page name
     * @returns {String} Markdown URL
     */
    _makeURL(wiki, page, text) {
        return `[${text || page}](${util.wiki(wiki)}/${page})`;
    }
    /**
     * Creates a Markdown URL to a wiki page
     * @private
     * @param {Message} msg Message to format
     * @returns {String} Markdown URL
     */
    _makePageURL(msg) {
        const t = msg.title;
        return this._makeURL(msg.wiki, `wiki/${util.encode(t)}`, t);
    }
    /**
     * Creates a Markdown URL to a diff page
     * @private
     * @param {Message} msg Message to format
     * @returns {String} Markdown URL
     */
    _makeDiffURL(msg) {
        return this._makeURL(msg.wiki, `?diff=${msg.urlParams.diff}`, 'diff');
    }
    /**
     * Formats an edit summary
     * @private
     * @param {Message} msg Message to format
     * @returns {String} Formatted edit summary
     */
    _summary(msg) {
        const text = msg.summary || msg.reason;
        if (text) {
            const trim = text.trim();
            if (trim && trim !== '""') {
                return `(*${trim}*)`;
            }
        }
        return '';
    }
    /**
     * Shows if a watched summary was used, page was blanked or replaced
     * @private
     * @param {Message} msg Message to format
     * @returns {String} Formatted edit summary
     */
    _notices(msg) {
        if (msg.watched) {
            return `**watched edit summary** "${msg.watched}"`;
        } else if (msg.blanked) {
            return '**page blanked**';
        } else if (msg.replace) {
            return `**replaced with** "${msg.replace}"`;
        }
        return '';
    }
    /**
     * Formats the diff size number
     * @private
     * @param {Message} msg Message to format
     * @returns {String} Formatted diff size number
     */
    _diffSize(msg) {
        const size = msg.diffSize;
        let res = size;
        if (size > 0) {
            res = `+${res}`;
        }
        if (size > 1000 || size < -1000) {
            res = `*${res}*`;
        }
        return res;
    }
    /**
     * Makes an URL to user's contributions page on a wiki
     * @private
     * @param {Message} msg Message to format
     * @param {String} prop Property out of which to take the user
     * @returns {String} URL to user's contributions
     */
    _userURL(msg, prop) {
        return `${util.wiki(msg.wiki)}/wiki/Special:Contribs/${util.encode(msg[prop || 'user'])}`;
    }
}

module.exports = ExampleFormat;
