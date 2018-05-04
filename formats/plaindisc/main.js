/**
 * main.js
 *
 * Module for the plain Discussions format
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
const ZWS = String.fromCharCode(8203);

/**
 * Main class
 * @augments Format
 */
class PlainDiscussionsFormat extends Format {
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
            content: `${this._getUserURL(msg)} ${this._getUserAction(msg)} ${this._getTarget(msg)} ${this._getContent(msg)}`
        };
    }
    /**
     * Escapes a string from mentions and links
     * @param {String} text Text to escape
     * @returns {String} Escaped text
     */
    _escape(text) {
        return text
            .replace(/discord\.gg/g, `discord${ZWS}.gg`)
            .replace(/@/g, `@${ZWS}`)
            .replace(/(https?:)\/\//g, `$1/${ZWS}/`);
    }
    /**
     * Returns a URL to user's contributions
     * @param {Message} msg Message to get the user from
     * @returns {String} Markdown link to user's contributions
     * @todo Return link to user's Discussions contributions instead
     */
    _getUserURL(msg) {
        return `[${this._escape(msg.user)}](<${util.wiki(msg.wiki)}/wiki/Special:Contribs/${util.encode(msg.user)}>)`;
    }
    /**
     * Formats a user's action
     * @param {Message} msg Message containing action information
     * @returns {String} Formatted action
     */
    _getUserAction(msg) {
        if (msg.target === 'report') {
            // You can only report and unreport, right?
            return msg.action === 'create' ? 'reported' : 'unreported';
        }
        return `${msg.action}${msg.action === 'edit' ? 'ed' : 'd'}`;
    }
    /**
     * Formats the target of an action
     * @param {Message} msg Message containing target information
     * @returns {String} Markdown URL to the target and title if it exists
     */
    _getTarget(msg) {
        return `[${msg.title ? this._escape(msg.title) : msg.target}](<${util.wiki(msg.wiki)}/d/p/${msg.replyId ?
            `${msg.threadId}/r/${msg.replyId}` :
            msg.threadId}>)`;
    }
    /**
     * Formats the content snippet to be italic
     * @param {Message} msg Message to get the content snippet from
     * @returns {String} Formatted content snippet
     */
    _getContent(msg) {
        return `(*${this._escape(msg.summary.trim()).replace(/\*|`/g, '')}*)`;
    }
}

module.exports = PlainDiscussionsFormat;
