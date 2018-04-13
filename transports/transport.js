/**
 * transport.js
 *
 * Module for base transport class
 */
'use strict';

/**
 * Base transport class
 */
class Transport {
    /**
     * Class constructor
     * @param {Object} config Transport configuration
     */
    constructor(config) {
        this._config = config;
        if (config.format) {
            const Format = main.format(config.format);
            this._format = new Format();
        }
    }
    /**
     * Transfers the message
     * @param {Message} msg Message to transfer
     */
    // eslint-disable-next-line
    execute(msg) {
        main.error('Unimplemented transport method!');
    }
}

module.exports = Transport;
