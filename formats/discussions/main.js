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
const COLOR = {
    report: 0xFF0000,
    thread: 0xFFFF00,
    reply:  0x00FF00,
};

/**
 * Main class
 * @class DiscussionsFormat
 * @augments Format
 */
class DiscussionsFormat extends Format {
    /**
     * Main class method
     * @method execute
     * @param {Message} msg Message to format
     * @return {Object} Formatted embed
     */
    execute(transport, msg) {
        if(msg.type !== 'discussions' || transport.constructor.name !== 'Discord') {
            return;
        }
        return {
            embeds: [
                {
                    title: msg.title ?
                        `${msg.title} [${this._processAction(msg)}]` :
                        this._processAction(msg),
                    url: `http://${msg.wiki}.wikia.com/d/p/${msg.replyId ?
                             `${msg.threadId}/r/${msg.replyId}` :
                             msg.threadId
                         }`,
                    description: msg.summary,
                    color: COLOR[msg.target],
                    author: {
                        name: `${msg.user} [${msg.wiki}]`,
                        url: `http://${msg.wiki || 'c'}.wikia.com/wiki/Special:Contribs/${encodeURIComponent(msg.user)}`
                    }
                }
            ]
        };
    }
    /**
     * Extracts a readable string with the executed action
     * @method _processAction
     * @private
     * @param {Message} msg Action to process
     * @return {String} Action in past tense
     */
    _processAction(msg) {
        switch(msg.action) {
            case 'edit': return `${util.cap(msg.target)} ${msg.action}ed`;
            default: return `${util.cap(msg.target)} ${msg.action}d`;
        }
    }
}

module.exports = DiscussionsFormat;
