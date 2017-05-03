/**
 * main.js
 *
 * Module for CLI handling
 */
'use strict';

/**
 * Importing modules
 */
const Controller = require('../controller.js');

/**
 * CLI controller class
 * @class CLI
 * @augments Controller
 */
class CLI extends Controller {
    /**
     * Class constructor
     * @constructor
     */
    constructor() {
        super();
        this._read = require('readline').createInterface({
        	input: process.stdin,
        	output: process.stdout
        });
        console.log('Initialized client, connecting to server...');
    }
    /**
     * Event called when a debug is requested
     * @method _onDebug
     * @private
     * @param {String} text Text to debug
     */
    _onDebug(text) {
        if(typeof text === 'string') {
            console.log(`Debug: ${text.replace(/( |\t)( |\t)+/g, '')}`);
        } else {
            console.log(`Debug: ${JSON.stringify(text)}`);
        }
    }
    /**
     * Event called after an internal error occurs
     * @method _onError
     * @private
     * @param {String|Error} err Error being thrown
     */
    _onError(err) {
        if(err instanceof Error) {
            console.error(err.stack);
        } else {
            console.error(err);
        }
    }
    /**
     * Shows an error text
     * @method _error
     * @private
     * @param {String} text Error text to show
     */
    _error(text) {
        console.error(text.replace(/( |\t)( |\t)+/g, ''));
    }
    /**
     * Event called after an error with configuration occurs
     * Closes the program.
     * @method _onConfigError
     * @private
     * @todo Make this show the actual error in configuration
     */
    _onConfigError() {
        this._error(`
            An error with configuration occurred!
            Please see the documentation for further explaination of the
            configuration format. The program will now close.
        `);
        process.exit();
    }
    /**
     * Event called if a method is called with unexpected parameters
     * @method _onParameterError
     * @private
     * @param {String} method Method that was called
     */
    _onParameterError(method) {
        this._error(`
            ${method} was called with unexpected parameters!
            You can ignore this error unless you're the developer.
        `);
    }
    /**
     * Event called upon joining an IRC channel
     * @method _onChannelJoin
     * @private
     * @param {String} channel Joined channel
     */
    _onChannelJoin(channel) {
        console.info(`Joined ${channel}!`);
    }
    /**
     * Event called upon joining the IRC server
     * @method _onServerJoin
     * @private
     */
    _onServerJoin() {
        console.info(`Joined the server!`);
    }
    /**
     * Event called when IRC notice is received
     * @method _onIrcNotice
     * @private
     * @param {String} nick Nickname of the notice sender
     * @param {String} text Notice contents
     */
    _onIrcNotice(nick, text) {
        console.log(`[${nick || 'server'}] ${text}`);
    }
}

module.exports = CLI;
