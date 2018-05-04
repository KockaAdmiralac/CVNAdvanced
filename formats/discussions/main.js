/**
 * main.js
 *
 * Module for the Discussions format
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
    reply: 0x00FF00,
    report: 0xFF0000,
    thread: 0xFFFF00
};

/**
 * Main class
 * @augments Format
 */
class DiscussionsFormat extends Format {
    /**
     * Main class method
     * @param {Transport} transport Transport transporting the message
     * @param {Message} msg Message to format
     * @returns {Object} Formatted embed
     */
    execute(transport, msg) {
        if (
            msg.type !== 'discussions' ||
            transport.constructor.name !== 'Discord'
        ) {
            return;
        }
        return {
            embeds: [
                {
                    author: {
                        name: `${msg.user} [${msg.wiki}]`,
                        url: `${util.wiki(msg.wiki)}/wiki/Special:Contribs/${util.encode(msg.user)}`
                    },
                    color: COLOR[msg.target],
                    description: msg.summary,
                    title: msg.title ?
                        `${msg.title} [${this._processAction(msg)}]` :
                        this._processAction(msg),
                    url: `${util.wiki(msg.wiki)}/d/p/${msg.replyId ?
                             `${msg.threadId}/r/${msg.replyId}` :
                             msg.threadId
                    }`
                }
            ]
        };
    }
    /**
     * Extracts a readable string with the executed action
     * @private
     * @param {Message} msg Action to process
     * @returns {String} Action in past tense
     */
    _processAction(msg) {
        switch (msg.action) {
            case 'edit': return `${util.cap(msg.target)} ${msg.action}ed`;
            default: return `${util.cap(msg.target)} ${msg.action}d`;
        }
    }
}

module.exports = DiscussionsFormat;
