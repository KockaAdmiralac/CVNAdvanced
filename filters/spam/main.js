/**
 * main.js
 *
 * Main filter module
 */
'use strict';

/**
 * Importing modules
 */
const Filter = require('../filter.js');

/**
 * Spam filter class
 * @augments Filter
 */
class SpamFilter extends Filter {
    /**
     * Class constructor
     * @constructor
     * @param {String} name Filter name
     * @param {Object} config Filter configuration
     */
    constructor(name, config) {
        super(name, config);
        this._goteem = {};
    }
    /**
     * Determines if the message should be transported
     * @param {Message} message Message to check
     * @returns {Boolean} If the message should be transported
     */
    execute(message) {
        if (message.type === 'spam') {
            if (this._goteem[message.user]) {
                if (this._goteem[message.user].length === 19) {
                    this._push(message.user, message.wiki);
                    return true;
                } else {
                    this._push(message.user, message.wiki);
                    return false;
                }
            }
            this._push(message.user, message.wiki);
            return true;
        }
        return false;
    }
    /**
     * goteem.
     * @param {String} user User to push
     * @param {String} wiki Wiki to push it in
     * @private
     */
    _push(user, wiki) {
        if (!this._goteem[user]) {
            this._goteem[user] = [];
        }
        if (!this._goteem[user].includes(wiki)) {
            this._goteem[user].push(wiki);
        }
    }
}

module.exports = SpamFilter;
