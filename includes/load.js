/**
 * load.js
 *
 * Module for handling resource loading
 * Disclaimer: I hate writing resource loaders
 */
'use strict';

/**
 * Importing modules
 */
const fs = require('fs'),
      util = require('./util.js');

/**
 * Constants
 */
const RESOURCES = [
    'filter',
    'transport',
    'format'
];

/**
 * Resource loader class
 * @class Loader
 */
class Loader {
    /**
     * Loads resources and ruins a callback function
     * @constructor
     * @param {Function} callback Callback function
     * @param {Object} context Context to bind the callback to
     */
    load(callback, context) {
        if(typeof callback !== 'function') {
            main.hook('parameterError', 'Loader#load');
        }
        this._loadConfig();
        this._promises = [];
        RESOURCES.forEach(this._loadResource, this);
        Promise.all(this._promises).then(() => callback.call(
            context,
            this._config,
            this._filters,
            this._transports,
            this._formats
        ));
    }
    /**
     * Loads configuration and initalizes a Promise object
     * @method _loadConfig
     * @private
     */
    _loadConfig() {
        try {
            this._config = require('../config.json');
        } catch(e) {
            main.error(e);
        }
    }
    /**
     * Returns a Promise for reading a directory
     * @method _readDir
     * @private
     * @param {String} dir Directory to read
     * @return {Promise} Promise on which to listen for directory listing
     */
    _readDir(dir) {
        return new Promise(function(resolve, reject) {
            fs.readdir(dir, function(error, files) {
                if(error) {
                    main.error(error);
                    reject(error);
                } else {
                    resolve(files);
                }
            });
        });
    }
    /**
     * Loads a specified resource
     * @method _loadResource
     * @private
     * @param {String} resource Resource to load
     */
    _loadResource(resource) {
        this[`_${resource}s`] = {};
        this._promises.push(this._readDir(`${resource}s`)
            .then((function(files) {
                files.filter(f => f !== `${resource}.js`).forEach(
                    this[`_load${util.cap(resource)}s`],
                    this
                );
            }).bind(this)));
    }
    /**
     * Handles filter loading
     * @method _loadFilters
     * @private
     * @param {String} name Filter name
     */
    _loadFilters(name) {
        const filter = require(`../filters/${name}/main.js`);
        filter.prototype.data = require(`../filters/${name}/main.json`);
        this._filters[name] = filter;
    }
    /**
     * Handles transport loading
     * @method _loadTransports
     * @private
     * @param {String} name Transport name
     */
    _loadTransports(name) {
        this._transports[name] = require(`../transports/${name}/main.js`);
    }
    /**
     * Handles format loading
     * @method _loadFormats
     * @private
     * @param {String} name Format name
     */
    _loadFormats(name) {
        const Format = require(`../formats/${name}/main.js`);
        this._formats[name] = new Format();
    }
}

module.exports = Loader;
