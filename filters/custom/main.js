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
 * Custom Discussions filter class
 * @augments Filter
 */
class CustomFilter extends Filter {
    /**
     * Determines if the message should be transported
     * @param {Message} message Message to check
     * @returns {Boolean} If the message should be transported
     */
    execute(message) {
        return message.type === 'discussions' &&
               message.wiki === this._config.wiki;
    }
}

module.exports = CustomFilter;
