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
    'format',
    'extension'
], REQUIRED_PARAMS = [
    'authors',
    'description',
    'name',
    'version'
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
            this._formats,
            this._extensions
        )).catch(e => main.error(e));
    }
    /**
     * Loads configuration
     * @method _loadConfig
     * @private
     */
    _loadConfig() {
        util.safeRun(() => this._config = require('../config.json'), this);
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
     * @param {String} name Resource to load
     * @todo Fix extension loading inconsistencies
     */
    _loadResource(name) {
        this[`_${name}s`] = {};
        const dir = `../${name}s`;
        this._promises.push(this._readDir(`${name}s`).then((function(files) {
            files.filter(f => f !== `${name}.js`).forEach(function(file) {
                const res = require(`${dir}/${file}/main.js`),
                      data = require(`${dir}/${file}/main.json`);
                if(typeof data !== 'object') {
                    throw new Error(`Loading data for \`${file}\` failed`);
                }
                REQUIRED_PARAMS.forEach(function(param) {
                    if(!data[param]) {
                        main.warn(`Incomplete data in \`${file}\``);
                    }
                });
                res.prototype.data = data;
                this[`_${name}s`][file] = res;                
            }, this);
        }).bind(this)));
    }
}

module.exports = Loader;
