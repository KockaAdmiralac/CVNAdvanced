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
 * @class ExampleFilter
 * @augments Filter
 */
class ExampleFilter extends Filter {
    /**
     * Determines if the message should be transported
     * @method execute
     * @param {Message} message Message to check
     * @return {Boolean} If the message should be transported
     */
    execute(message) { // jshint ignore:line
        return true;
    }
}

module.exports = ExampleFilter;
