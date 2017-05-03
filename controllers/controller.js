/**
 * controller.js
 *
 * Module for base controller class
 */
'use strict';

/**
 * Importing modules
 */
const Client = require('../includes/client.js'),
      Loader = require('../includes/load.js'),
      util = require('../includes/util.js');

/**
 * Base controller class
 * @class Controller
 */
class Controller {
    /**
     * Class constructor
     * @constructor
     */
    constructor() {
        this._loader = new Loader();
    }
    /**
     * Initializer
     * @method initialize
     */
    initialize() {
        this._loader.load(this._onLoad, this);
    }
    /**
     * Event called after loader loads the resources
     * @method _onLoad
     * @private
     * @param {Object} config Configuration object
     * @param {Array<Filter>} filters Array of filter classes
     * @param {Array<Transport>} transports Array of transport classes
     * @param {Array<Format>} formats Array of format classes
     */
    _onLoad(config, filters, transports, formats) {
        if(typeof config !== 'object') {
            this.hook('configError');
        }
        this._config = config;
        this._filters = filters;
        this._transports = transports;
        this._formats = formats;
        this._client = new Client(this._config);
    }
    /**
     * Calls a hook
     * @method hook
     */
    hook() {
        const args = Array.prototype.slice.call(arguments),
              func = this[`_on${util.cap(args.splice(0, 1)[0])}`];
        if(typeof func === 'function') {
            func.apply(this, args);
        }
    }
    /**
     * Calls a debug hook
     * @method debug
     * @param {String} text Text to debug
     */
    debug(text) {
        this.hook('debug', text);
    }
    /**
     * Calls an error hook
     * @method error
     * @param {String|Error} err Error to throw
     */
    error(err) {
        this.hook('error', err);
    }
    /**
     * Returns a requested format object
     * @method format
     * @return {Format} Requested format by name
     */
    format(name) {
        return this._formats[name];
    }
    /**
     * Get available filters
     * @return {Array<Filter>} Array of filter classes
     */
    get filters() {
        return this._filters;
    }
    /**
     * Get available transports
     * @return {Array<Transport>} Array of Transport classes
     */
    get transports() {
        return this._transports;
    }
}

module.exports = Controller;
