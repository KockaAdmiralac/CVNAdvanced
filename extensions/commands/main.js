/**
 * main.js
 *
 * Main extension module
 */
'use strict';

/**
 * Importing modules
 */
const Extension = require('../extension.js'),
      util = require('../../includes/util.js'),
      fs = require('fs');

/**
 * Main extension class
 * @augments Extension
 */
class Commands extends Extension {
    /**
     * Class constructor
     * @param {Object} config Extension configuration
     */
    constructor(config) {
        super(config);
        this._permissions = config.permissions || {};
        if (this._permissions.length === 0) {
            // TODO: Extract to i18n
            main.warn(
                'Command whitelist is empty!\n' +
                'That means nobody will be able to use IRC commands'
            );
        }
    }
    /**
     * Checks whether a user is allowed to execute a command
     * @private
     * @param {String} host Host of the user
     * @param {String} command Command to execute
     * @returns {Boolean} If the user is allowed to execute the command
     */
    _isAllowed(host, command) {
        const perms = this._permissions[host],
              def = this._permissions['#default'];
        return (
            perms instanceof Array ?
                perms.concat(def) :
                def instanceof Array ?
                    def :
                    []
        ).includes(command);
    }
    /**
     * Event emitted when a message is sent outside of regular channels
     * @private
     * @param {String} nickname User sending the message
     * @param {String} channel Channel the message is sent in
     * @param {String} text Contents of the message
     * @param {Object} message IRC message object
     */
    _onPrivateMsg(nickname, channel, text, message) {
        const split = text.trim().split(' '),
              name = split.shift().toLowerCase(),
              func = this[`_cmd${util.cap(name)}`];
        if (
            typeof func === 'function' &&
            this._isAllowed(message.host, name)
        ) {
            const ret = func.apply(this, split);
            if (typeof ret === 'string') {
                main.hook('irc', 'say', nickname, ret);
            } else if (ret instanceof Promise) {
                ret.then(rep => main.hook('irc', 'say', nickname, rep));
            }
        }
    }
    /**
     * Hello
     * @private
     * @returns {String} Hello
     */
    _cmdHello() {
        return 'Hello';
    }
    /**
     * Restart the bot
     * @private
     */
    _cmdRestart() {
        main.stop(true);
    }
    /**
     * Stops the bot
     * @private
     */
    _cmdStop() {
        main.stop();
    }
    /**
     * Configures the bot
     * @private
     * @param {String} action Action to execute on configuration
     * @param {String} option Configuration option to change
     * @param {String} value Value to set on the configuration option
     * @param {String} action2 Additional action for arrays and objects
     * @returns {String} Response to the configuration command
     */
    _cmdConfig(action, option, value, action2) {
        if (!action || !option) {
            return 'Action and option required for this command!';
        }
        const obj = require('./../../config.json');
        let ref = obj, last = null;
        if (option !== '*') {
            const split = option.split('.');
            while (split.length > 1) {
                ref = typeof ref === 'object' ? ref[split.shift()] : null;
            }
            last = split.shift();
        }
        const val = last ? ref[last] : ref,
              type = typeof val;
        switch (action) {
            case 'show':
                if (val === null || type === 'string' || type === 'number') {
                    return JSON.stringify(val);
                } else if (val instanceof Array) {
                    return `(${val.length}) [${
                        val.map(function(el) {
                            if (el instanceof Array) {
                                return 'Array[]';
                            } else if (typeof el === 'object') {
                                return 'Object{}';
                            }
                            return JSON.stringify(el);
                        }).join(', ')
                    }]`;
                } else if (type === 'object') {
                    return `{${Object.keys(val).join(', ')}}`;
                } else if (type === 'undefined') {
                    return 'undefined';
                }
                break;
            case 'edit':
                if (!value) {
                    return 'No value specified!';
                }
                if (val instanceof Array) {
                    switch (action2) {
                        case 'push':
                            ref[last].push(value);
                            break;
                        case 'pop':
                            ref[last].pop();
                            break;
                        // TODO: More actions
                        case undefined:
                            return 'You must specify an array action!';
                        default:
                            return 'Unknown array action!';
                    }
                } else if (type === 'object') {
                    return 'You cannot modify an object directly!';
                } else {
                    ref[last] = value;
                }
                return new Promise(function(resolve, reject) {
                    fs.writeFile(
                        'config.json',
                        JSON.stringify(obj, null, '    '),
                        function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve('Configuration saved!');
                            }
                        }
                    );
                });
            default:
                return 'No such action!';
        }
    }
}

module.exports = Commands;
