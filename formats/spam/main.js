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
                        url: `https://${msg.wiki}.wikia.com/wiki/Special:Contribs/${util.encode(msg.user)}`
                    },
                    color: 0xFFFFFF,
                    description: this._embedDescription(msg),
                    title: this._embedTitle(msg),
                    url: this._embedURL(msg)
                }
            ]
        };
    }
    /**
     * Formats the embed title
     * @private
     * @param {Message} msg Message to format
     * @returns {String} Formatted title
     */
    _embedTitle(msg) {
        switch (msg.spamtype) {
            case 'coi':
                switch (msg.coi) {
                    case 1: return 'Inserted link matches username';
                    case 2: return 'Wiki URL similar to founder';
                    case 3: return 'Wiki name similar to founder';
                    case 4: return 'Inserted a link to a new wiki too soon';
                    case 5: return 'Content matches spam filter';
                    default: return `Unknown conflict of interest #${msg.coi}`;
                }
            case 'hit': return 'Blacklist hitting';
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
        switch (msg.coi) {
            case 2:
            case 3:
                return `https://${msg.wiki}.wikia.com`;
            default:
                return `https://${msg.wiki}.wikia.com/?oldid=${msg.oldid}`;
        }
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
                return `${p}: [${msg.url}](http://${msg.url})`;
            case 2:
                return p;
            case 3:
                return `${p}: ${msg.title}`;
            case 4:
                return `[${msg.url}](http://${msg.url})`;
            case 5:
                return `${p}: #${msg.filter}`;
            default:
                // HIT
                return `${p}: [${msg.url}](http://${msg.url}); ${msg.filter}`;
        }
    }
}

module.exports = SpamFormat;
