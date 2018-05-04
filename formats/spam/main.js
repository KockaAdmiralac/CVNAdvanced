/**
 * main.js
 *
 * Module for spam format
 */
'use strict';

/**
 * Importing modules
 */
const Format = require('../format.js'),
      util = require('../../includes/util.js');

/**
 * Constants
 */
const COLORS = [
    0xFF0000,
    0xFFFF00,
    0x00FF00,
    0x0000FF,
    0xFF00FF,
    0x00FFFF,
    0xFFFFFF
];

/**
 * Main class
 * @augments Format
 */
class SpamFormat extends Format {
    /**
     * Main class method
     * @param {Transport} transport Transport to pass the message to
     * @param {Message} msg Message to format
     * @returns {Object} Formatted embed
     */
    execute(transport, msg) {
        if (msg.type !== 'spam' || transport.constructor.name !== 'Discord') {
            return;
        }
        return {
            embeds: [
                {
                    author: {
                        name: msg.user,
                        url: `${util.wiki(msg.wiki)}/wiki/Special:Contribs/${util.encode(msg.user)}`
                    },
                    color: COLORS[msg.coi] || 0xFFFFFF,
                    description: this._embedDescription(msg),
                    title: this._embedTitle(msg),
                    url: this._embedURL(msg)
                }
            ]
        };
    }
    /**
     * Gets a URL to a user's contributions
     * @param {String} wiki Wiki to get the URL from
     * @param {String} user User whose contributions to link to
     * @returns {String} URL to user's contributions
     */
    _userURL(wiki, user) {
        return `${util.wiki(wiki)}/wiki/Special:Contribs/${util.encode(user)}`;
    }
    /**
     * Formats the embed title
     * @private
     * @param {Message} msg Message to format
     * @returns {String} Formatted title
     */
    _embedTitle(msg) {
        switch (msg.coi) {
            case 1: return msg.xrumer ?
                'XRumer spam' :
                'Inserted link matches username';
            case 2: return 'Wiki URL similar to founder';
            case 3: return 'Wiki name similar to founder';
            case 4: return 'Inserted a link to a new wiki too soon';
            case 5: return `${
                msg.summary ?
                    'Summary' :
                    msg.title ?
                        'Title' :
                        msg.url ?
                            'URL' :
                            'Content'
                } matches spam filter`;
            case 6: return 'Answers spam';
            default: return 'Unknown spam type';
        }
    }
    /**
     * Generates the embed URL
     * @private
     * @param {Message} msg Message to use to generate the URL
     * @returns {String} Link to the wiki or oldid of the revision
     */
    _embedURL(msg) {
        const wiki = util.wiki(msg.wiki);
        if (msg.oldid) {
            return `${wiki}/?oldid=${msg.oldid}`;
        } else if (msg.reply) {
            return `${wiki}/d/p/${msg.thread}/${msg.reply}`;
        } else if (msg.thread) {
            return `${wiki}/d/p/${msg.thread}`;
        } else if (msg.coi === 6) {
            return `${wiki}/wiki/${util.encode(msg.talkpage)}`;
        }
        return wiki;
    }
    /**
     * Generates the embed description
     * @private
     * @param {Message} msg Message to take the description from
     * @returns {String} Markdown in embed's description
     */
    _embedDescription(msg) {
        const p = `**${Math.round(msg.percent * 100, 2)}%**`;
        switch (msg.coi) {
            case 1:
                return msg.xrumer ?
                    '' :
                    `${p}: [${msg.url}](http://${msg.url})`;
            case 2:
                return p;
            case 3:
                return `${p}: ${msg.title}`;
            case 4:
                return `[${msg.url}](http://${msg.url})`;
            case 5:
                if (msg.content) {
                    return `${p}: "${msg.content}" (#${msg.filter})`;
                }
                return `${p}: #${msg.filter}`;
            case 6:
                return `[${msg.url}](http://${msg.url}), [${msg.mainUser}](${
                    this._userURL(msg.wiki, msg.mainUser)
                })`;
            default:
                return '';
        }
    }
}

module.exports = SpamFormat;
