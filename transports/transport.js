/**
 * transport.js
 *
 * Module for base transport class
 */
'use strict';

/**
 * Base transport class
 * @class Transport
 */
class Transport {
    /**
     * Class constructor
     * @constructor
     * @param {Object} config Transport configuration
     */
    constructor(config) {
        this._config = config;
        if(!config.format) {
            main.hook('parameterError', 'Transport.constructor');
        }
        this._format = main.format(config.format);
    }
    /**
     * Transfers the message
     * @method execute
     * @param {Message} msg Message to transfer
     */
    execute(msg) { // jshint ignore: line
        main.error('Unimplemented transport method!');
    }
}

module.exports = Transport;
