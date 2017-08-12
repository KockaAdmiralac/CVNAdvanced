/**
 * main.js
 * 
 * Main extension module
 */
'use strict';

/**
 * Importing modules
 */
const fs = require('fs'),
      io = require('../../includes/io.js'),
      Extension = require('../extension.js');

/**
 * Constants
 */
const RELAY_REGEX = /^<([^>]+)> (.*)/;

/**
 * Main extension class
 * @class Logging
 * @augments Extension
 */
class Logging extends Extension {
    /**
     * Class constructor
     * @constructor
     * @param {Object} config Extension configuration
     */
    constructor(config) {
        super(config);
        this._log = fs.createWriteStream(config.file || 'log.txt', {
            flags: 'a'
        });
        if(config.id && config.token) {
            this._url = `https://discordapp.com/api/webhooks/${config.id}/${config.token}`; // jshint ignore: line
            this._channel = config.channel || '#wikia-vstf';
            this._relay = config.relayPrefix || 'RansomRelay';
        } else {
            throw new Error('Incorrect parameters!');
        }
    }
    /**
     * Event called upon joining the IRC server
     * @method _onServerJoin
     * @private
     */
    _onServerJoin() {
        this._write('JOIN', 'server');
        if(this._channel) {
            main.hook('irc', 'join', this._channel);
        }
    }
    /**
     * Event called upon joining an IRC channel
     * @method _onChannelJoin
     * @private
     * @param {String} channel Joined channel
     */
    _onChannelJoin(channel) {
        this._write('JOIN', `channel: ${channel}`);
    }
    /**
     * Event emitted when another user joins a channel
     * @method _onUserJoin
     * @private
     * @param {String} nickname User that joined
     * @param {String} channel Channel the user joined
     */
    _onUserJoin(nickname, channel) {
        this._write('JOIN', `channel: ${channel}, user: ${nickname}`);
        if(channel === this._channel) {
            this._callWebhook(`${nickname} joined`);
        }
    }
    /**
     * Event emitted when a message is sent outside of regular channels
     * @method _onExtMsg
     * @private
     * @param {String} nickname User sending the message
     * @param {String} channel Channel the message is sent in
     * @param {String} text Contents of the message
     * @param {Object} message IRC message object
     */
    _onExtMsg(nickname, channel, text, message) {
        if(channel === this._channel) {
            if(nickname.startsWith(this._relay)) {
                const res = RELAY_REGEX.exec(text);
                RELAY_REGEX.lastIndex = 0;
                if(res) {
                    res.shift();
                    nickname = `${res.shift()} [Relay]`;
                    text = res.shift();
                }
            }
            this._callWebhook(text, nickname);
            
        } else if(message.command === 'PRIVMSG') {
            this._write('PM', `<${nickname}> ${message}`);
        }
    }
    /**
     * Calls a logging webhook
     * @method _callWebhook
     * @private
     * @param {String} text Contents of the webhook message
     * @param {String} username Username in the webhook
     */
    _callWebhook(text, username) {
        io.post(this._url, {
            content: text
                .replace(/\@/g, '@​')
                .replace(/discord\.gg/g, 'discord​.gg'),
            username: username
        }, null, true);
    }
    /**
     * Event emitted when an unparsable message gets sent into
     * #cvn-wikia or #wikia-discussions
     * @method _onUnknownMsg
     * @private
     * @param {String} nickname User sending the message
     * @param {String} channel The channel message was sent in
     * @param {String} text Contents of the message
     */
    _onUnknownMsg(nickname, channel, text) {
        this._write('UNKNOWN', `{${channel}} <${nickname}> ${text}`);
    }
    /**
     * Writes to the file
     * @method _write
     * @private
     * @param {String} type Type of the message
     * @param {String} text Text to write to the file
     */
    _write(type, text) {
        const date = new Date(),
              s = this._padNum(date.getUTCSeconds()),
              mi = this._padNum(date.getUTCMinutes()),
              h = this._padNum(date.getUTCHours()),
              d = this._padNum(date.getUTCDate()),
              m = this._padNum(date.getUTCMonth()),
              y = this._padNum(date.getUTCFullYear()),
              str = `[${d}/${m}/${y} ${h}:${mi}:${s}] [${type}]`;
        this._log.write(`${text
            .split('\n')
            .map(line => `${str} ${line}`)
            .join('\n')
        }\n`);
    }
    /**
     * Ensures a number string is two spaces wide
     * @method _padNum
     * @private
     * @param {Number} number Number to pad
     * @returns {String} Padded number
     */
    _padNum(number) {
        if(number < 10) {
            return '0' + number;
        }
        return String(number);
    }
    /**
     * Event called if an extension doesn't exist
     * @method _onNoExtension
     * @private
     * @param {String} extension 
     */
    _onNoExtension(extension) {
        this._write('ERROR', `No extension: ${extension}`);
    }
    /**
     * Event called when a debug is requested
     * @method _onDebug
     * @private
     * @param {String} text Text to debug
     */
    _onDebug(text) {
        this._write('DEBUG', text);
    }
    /**
     * Event called after an internal error occurs
     * @method _onError
     * @private
     * @param {String|Error} err Error being thrown
     */
    _onError(err) {
        this._write('ERROR', err instanceof Error ? err.stack : err);
    }
    /**
     * Event called when a non-fatal unexpected event occurs
     * @param {String} warning Warning to display
     */
    _onWarn(warning) {
        this._write('WARN', warning);
    }
    /**
     * Event called if a method is called with unexpected parameters
     * @method _onParameterError
     * @private
     * @param {String} method Method that was called
     */
    _onParameterError(method) {
        this._write('ERROR', `Unexpected parameters for ${method}`);
    }
    /**
     * Event called when IRC notice is received
     * @method _onIrcNotice
     * @private
     * @param {String} nick Nickname of the notice sender
     * @param {String} text Notice contents
     */
    _onIrcNotice(nick, text) {
        this._write('NOTICE', `[${nick || 'server'}] ${text}`);
    }
    /**
     * Event called after all resources have loaded
     * @method _onInit
     * @private
     */
    _onInit() {
        this._write('LOAD', '');
    }
    /**
     * Event called when a user gets kicked from a channel
     * @method _onKick
     * @private
     * @param {String} channel Channel the user got kicked from
     * @param {String} nickname User that got kicked
     * @param {String} user User that executed the kick
     * @param {String} reason Reason for the kick
     */
    _onKick(channel, nickname, user, reason) {
        reason = reason || 'No reason specified';
        this._write('KICK', `${user} -> ${nickname}: "${reason}"`);
        if(channel === this._channel) {
            this._callWebhook(`${user} kicked ${nickname} (*${reason}*)`);
        }
    }
    /**
     * Event called when a user leaves an IRC channel
     * @method _onPart
     * @private
     * @param {String} channel Channel the user left
     * @param {String} nickname User that left
     * @param {String} reason Reason for leaving
     */
    _onPart(channel, nickname, reason) {
        reason = reason || 'No reason specified';
        this._write('PART', `${nickname} -> ${channel}: "${reason}"`);
        if(channel === this._channel) {
            this._callWebhook(`${nickname} left ("${reason}")`);
        }
    }
    /**
     * Does extension disposal
     * @method kill
     */
    kill() {
        if(this._log) {
            this._write('END', '');
            this._log.end();
        }
    }
}

module.exports = Logging;
