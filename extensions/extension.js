/**
 * extension.js
 *
 * Module for base extension class
 */
'use strict';

/**
 * Importing modules
 */
const util = require('../includes/util.js');

/**
 * Base extension class
 */
class Extension {
    /**
     * Class constructor
     * @param {Object} config Extension configuration
     */
    constructor(config) {
        this._config = config;
    }
    /**
     * Calls a hook
     * @param {String} name The hook's name
     * @param {Array} args The hook's parameters
     */
    hook(name, args) {
        const func = this[`_on${util.cap(name)}`];
        if (typeof func === 'function') {
            func.apply(this, args);
        }
    }
    /**
     * Does extension disposal
     */
    kill() {
        // To be implemented by extensions
    }
}

module.exports = Extension;
