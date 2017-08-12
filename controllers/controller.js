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
     * @param {Array<Extension>} extensions Array of extension classes
     */
    _onLoad(config, filters, transports, formats, extensions) {
        if(typeof config !== 'object') {
            this.hook('configError');
        }
        this._config = config;
        this._filters = filters;
        this._transports = transports;
        this._formats = formats;
        this._initExtensions(extensions);
        this._client = new Client(this._config);
        this.hook('init');
    }
    /**
     * Initializes the extensions
     * @method _initExtensions
     * @private
     * @param {Extension} classes Extension classes
     */
    _initExtensions(classes) {
        this._extensions = [];
        if(this._config.extensions) {
            util.each(this._config.extensions, function(key, value) {
                const Extension = classes[key];
                if(Extension) {
                    this._extensions.push(new Extension(value));
                } else {
                    this.hook('noExtension', key);
                }
            }, this);
        }
    }
    /**
     * Calls a hook
     * @method hook
     */
    hook() {
        const args = Array.prototype.slice.call(arguments),
              name = args.shift(),
              func = this[`_on${util.cap(name)}`];
        if(typeof func === 'function') {
            util.safeRun(() => func.apply(this, args), this);
        }
        this._extensions.forEach(
            e => util.safeRun(() => e.hook(name, args), this)
        );
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
     * Calls a warning hook
     * @method warn
     * @param {String} warning Warning to show
     */
    warn(warning) {
        this.hook('warn', warning);
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
     * Stops/reloads the process
     * @method stop
     */
    stop(reload) {
        this._extensions.forEach(e => e.kill());
        this._client.kill(function() {
            if(reload) {
                util.clear(require.cache);
                util.clear(module.constructor._pathCache);
                this.initialize();
            } else {
                process.exit();
            }
        }, this);
    }
    /**
     * Event that allows extensions sending IRC commands
     * @method _onIrc
     * @private
     */
    _onIrc() {
        const args = Array.prototype.slice.call(arguments),
              name = args.shift(),
              client = this._client.client;
        if(typeof client[name] === 'function') {
            client[name].apply(client, args);
        }
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
