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
 * Example filter class
 * @augments Filter
 */
class ExampleFilter extends Filter {
    /**
     * Determines if the message should be transported
     * @param {Message} message Message to check
     * @returns {Boolean} If the message should be transported
     */
    execute(message) {
        return Boolean(message.type);
    }
}

module.exports = ExampleFilter;
