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
 * Constants
 */
const COMMANDS = [
    'info',
    'stop',
    'restart'
];

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
        this._initRead();
    }
    /**
     * Initializes the command line
     * @method _initRead
     * @private
     */
    _initRead() {
        this._read = require('readline').createInterface({
        	input: process.stdin,
            output: process.stdout,
            historySize: 100,
            removeHistoryDuplicates: true,
            completer: this._readCompleter
        }).on('line', this._readLine.bind(this))
        .on('close', this._readClose.bind(this));
        this._read.setPrompt('');
    }
    /**
     * Outputs text into console and does additional handling
     * related to it
     * @method _output
     * @private
     * @param {String} text Text to output
     */
    _output(text) {
        if(this._initialized) {
            console.log();
        }
        console.log(text.replace(/( |\t)( |\t)+/g, ''));
        if(this._initialized) {
            this._read.prompt(true);
        }
    }
    /**
     * Autocompletes command input
     * @method _readCompleter
     * @private
     * @param {String} line
     */
    _readCompleter(line) {
        const hits = COMMANDS.filter(c => c.startsWith(line));
        return [hits.length ? hits : COMMANDS, line];
    }
    /**
     * Lists all names of resources of a specific type
     * (filters, extensions, formats, transports...)
     * @method _classNames
     * @private
     * @param {String} name Name of the resource
     */
    _classNames(name) {
        return Object.keys(this[`_${name}s`]).join(', ');
    }
    /**
     * Callback after a line is inputted into the console
     * @method _readLine
     * @private
     * @param {String} line Line that was inputted
     */
    _readLine(line) {
        const args = line.split(' ');
        switch(args.shift()) {
            case 'info':
                const pkg = require('../../package.json');
                this._output(`
                == Package info ==
                Name: ${pkg.name}
                Version: ${pkg.version}
                License: ${pkg.license}
                Repository: ${pkg.repository.url}
                == Resources ==
                Installed filters: ${this._classNames('filter')}
                Installed extensions: ${this._classNames('extension')}
                Installed transports: ${this._classNames('transport')}
                Installed formats: ${this._classNames('format')}
                `);
                break;
            case 'stop':
                this.stop();
                break;
            case 'restart':
                this.stop(true);
                break;
            default:
                console.log('No such command!');
                break;
        }
    }
    /**
     * Callback after the console stream closes
     * @method _readClose
     * @private
     */
    _readClose() {
        console.log('Closing...');
        main.stop();
    }
    /**
     * Event called after all resources have loaded
     * @method _onInit
     * @private
     */
    _onInit() {
        console.log('All resources loaded, connecting to server...');
    }
    /**
     * Event called when a debug is requested
     * @method _onDebug
     * @private
     * @param {String} text Text to debug
     */
    _onDebug(text) {
        this._output(`Debug: ${typeof text === 'string' ?
            text :
            JSON.stringify(text)
        }`);
    }
    /**
     * Event called after an internal error occurs
     * @method _onError
     * @private
     * @param {String|Error} err Error being thrown
     */
    _onError(err) {
        if(err instanceof Error) {
            this._output(err.stack);
        } else {
            this._output(err);
        }
    }
    /**
     * Event called when a non-fatal unexpected event occurs
     * @method _onWarn
     * @private
     * @param {String} warning Warning to display
     */
    _onWarn(warning) {
        this._output(`Warning: ${warning}`);
    }
    /**
     * Event called after an error with configuration occurs
     * Closes the program.
     * @method _onConfigError
     * @private
     * @todo Make this show the actual error in configuration
     */
    _onConfigError() {
        this._output(`
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
        this._output(`
            ${method} was called with unexpected parameters!
            You can ignore this error unless you're the developer.
        `);
    }
    /**
     * Event called if an extension doesn't exist
     * @method _onNoExtension
     * @private
     * @param {String} extension 
     */
    _onNoExtension(extension) {
        this._output(`
            Extension '${extension}' does not exist!
            Please fix your configuration.
        `);
    }
    /**
     * Event called upon joining an IRC channel
     * @method _onChannelJoin
     * @private
     * @param {String} channel Joined channel
     */
    _onChannelJoin(channel) {
        this._output(`Joined ${channel}!`);
    }
    /**
     * Event called upon joining the IRC server
     * @method _onServerJoin
     * @private
     */
    _onServerJoin() {
        this._output(`Joined the server!`);
        this._initialized = true;
        this._read.setPrompt('> ');
        this._read.prompt();
    }
    /**
     * Event called when IRC notice is received
     * @method _onIrcNotice
     * @private
     * @param {String} nick Nickname of the notice sender
     * @param {String} text Notice contents
     */
    _onIrcNotice(nick, text) {
        this._output(`[${nick || 'server'}] ${text}`);
    }
}

module.exports = CLI;
