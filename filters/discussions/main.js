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
 * Discussions filter class
 * @class DiscussionsFilter
 * @augments Filter
 */
class DiscussionsFilter extends Filter {
    /**
     * Determines if the message should be transported
     * @method execute
     * @param {Message} message Message to check
     * @return {Boolean} If the message should be transported
     */
    execute(message) { // jshint ignore:line
        return message.type === 'discussions';
    }
}

module.exports = DiscussionsFilter;
