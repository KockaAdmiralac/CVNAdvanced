/**
 * filter.js
 *
 * Module for the base filter class
 */
'use strict';

/**
 * Base filter class
 * @class Filter
 */
class Filter {
    /**
     * Class constructor
     * @constructor
     * @param {String} name Filter name
     * @param {Object} config Filter configuration
     */
    constructor(name, config) {
        this._name = name;
        this._config = config;
    }
    /**
     * Determines if the message should be transported
     * @method execute
     * @param {Message} message Message to check
     * @return {Boolean} If the message should be transported
     */
    execute(message) { // jshint ignore: line
        // To be implemented by other filters
        return false;
    }
}

module.exports = Filter;
