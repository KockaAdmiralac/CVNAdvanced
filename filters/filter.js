/**
 * filter.js
 *
 * Module for the base filter class
 */
'use strict';

/**
 * Base filter class
 */
class Filter {
    /**
     * Class constructor
     * @param {String} name Filter name
     * @param {Object} config Filter configuration
     */
    constructor(name, config) {
        this._name = name;
        this._config = config;
    }
    /**
     * Determines if the message should be transported
     * @param {Message} message Message to check
     * @returns {Boolean} If the message should be transported
     */
    // eslint-disable-next-line
    execute(message) {
        // To be implemented by other filters
        return false;
    }
}

module.exports = Filter;
