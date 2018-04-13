/**
 * main.js
 *
 * Discord transport implementation
 */
'use strict';

/**
 * Importing modules
 */
const Transport = require('../transport.js'),
      io = require('../../includes/io.js');

/**
 * Discord transport class
 * @augments Transport
 */
class Discord extends Transport {
    /**
     * Class constructor
     * @param {Object} config Transport configuration
     */
    constructor(config) {
        super(config);
        if (!this._format) {
            throw new Error('Discord transport requires a configured format!');
        }
        if (config.id && config.token) {
            // TODO: Store this in a JSON file?
            this._url = `https://discordapp.com/api/webhooks/${config.id}/${config.token}`;
        } else {
            throw new Error('Incorrect parameters!');
        }
    }
    /**
     * Transfers the message
     * @param {Message} msg Message to transfer
     */
    execute(msg) {
        const format = this._format.execute(this, msg);
        if (format) {
            io.post(this._url, format, null, true).catch(e => main.error(e));
        }
    }
}

module.exports = Discord;
