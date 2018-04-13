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
     * Determines if the message should be transported
     * @param {Message} message Message to check
     * @returns {Boolean} If the message should be transported
     */
    execute(message) {
        return message.type === 'spam';
    }
}

module.exports = SpamFilter;
