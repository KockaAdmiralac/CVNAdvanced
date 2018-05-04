/**
 * client.js
 *
 * Module for handling connection to IRC
 */
 'use strict';

/**
 * Importing modules
 */
const irc = require('irc'),
      Message = require('./msg.js'),
      util = require('./util.js'),
      packageJSON = require('../package.json');

/**
 * Constants
 */
const EVENTS = [
    'error',
    'join',
    'message',
    'registered',
    'notice',
    'part',
    'kick',
    'quit'
], CHANNELS = [
    'cvn-wikia',
    'cvn-wikia-newusers',
    'cvn-wikia-uploads',
    'wikia-discussions',
    'wikia-spam'
];

/**
 * IRC client class
 */
class Client {
    /**
     * Class constructor
     * @constructor
     * @param {Object} config Configuration object
     */
    constructor(config) {
        this._config = config;
        this._initFilters();
        this._initTransports();
        this._initMap();
        this._initClient();
    }
    /**
     * Initializes filters
     * @private
     */
    _initFilters() {
        this._filters = {};
        for (const i in this._config.filters) {
            const v = this._config.filters[i],
                  Filter = main.filters[v.name || i];
            if (Filter) {
                this._filters[i] = new Filter(i, v);
            }
        }
    }
    /**
     * Initializes transports
     * @private
     * @todo DRY
     */
    _initTransports() {
        this._transports = {};
        for (const i in this._config.transports) {
            const v = this._config.transports[i],
                  Transport = main.transports[v.name || i];
            if (Transport) {
                this._transports[i] = new Transport(v);
            }
        }
    }
    /**
     * Initializes filter-transport map
     * @private
     */
    _initMap() {
        this._map = [];
        for (const i in this._config.map) {
            const v = this._config.map[i],
                  filter = this._filters[i];
            if (typeof v === 'string') {
                this._map.push({
                    filter,
                    transport: this._transports[v]
                });
            } else if (v instanceof Array) {
                v.forEach(t => this._map.push({
                    filter,
                    transport: this._transports[t]
                }));
            }
        }
    }
    /**
     * Initializes the IRC client object
     * @private
     * @todo Secure connection
     */
    _initClient() {
        const c = this._config;
        this.channels = c.channels || CHANNELS;
        this._client = new irc.Client('chat.freenode.net', c.nick, {
            channels: this.channels.map(ch => `#${ch}`),
            password: c.password,
            realName: c.name,
            sasl: true,
            stripColors: true,
            userName: c.user
        });
        EVENTS.forEach(e => this._client.addListener(
            e, this[`_on${util.cap(e)}`].bind(this)
        ));
    }
    /**
     * Event called when an error in IRC client occurs
     * @private
     * @param {Object} message IRC message with the error
     */
    _onError(message) {
        main.debug(JSON.stringify(message));
    }
    /**
     * Event called when a channel is joined in IRC
     * @private
     * @param {String} channel Channel that was joined
     * @param {String} nickname Nickname of the user that joined
     */
    _onJoin(channel, nickname) {
        if (nickname === this._config.nick) {
            main.hook('channelJoin', channel);
        } else {
            main.hook('userJoin', nickname, channel);
        }
    }
    /**
     * Event called when a message is received
     * @private
     * @param {String} nickname Nickname of the user that sent the message
     * @param {String} channel Channel the message was sent in
     * @param {String} text Message contents
     * @param {Object} message IRC message object
     */
    _onMessage(nickname, channel, text, message) {
        if (!this.channels.includes(channel.substring(1))) {
            main.hook(
                this._client.nick === channel ?
                    'privateMsg' :
                    'extMsg',
                nickname,
                channel,
                text,
                message
            );
            return;
        }
        try {
            const msg = new Message(text);
            if (msg.type) {
                this._map.forEach(function(map) {
                    if (map.filter && map.filter.execute(msg)) {
                        map.transport.execute(msg);
                    }
                });
            } else {
                main.hook('unknownMsg', nickname, channel, text, message);
            }
        } catch (e) {
            main.error(e);
        }
    }
    /**
     * Event called when the IRC client joins the IRC server
     * @private
     */
    _onRegistered() {
        this._connected = true;
        main.hook('serverJoin');
    }
    /**
     * Event called when an IRC notice is sent
     * @private
     * @param {String} nick Nickname sending the notice
     * @param {String} to Notice receiver
     * @param {String} text Message contents
     */
    _onNotice(nick, to, text) {
        main.hook('ircNotice', nick, text);
    }
    /**
     * Event called when a user leaves a channel
     * @private
     * @param {String} channel Channel the user left
     * @param {String} nickname Nickname of the user that left
     * @param {String} reason Reason for leaving
     * @param {Object} message IRC message object
     */
    _onPart(channel, nickname, reason, message) {
        main.hook('part', channel, nickname, reason, message);
    }
    /**
     * Event called when a user gets kicked from a channel
     * @private
     * @param {String} channel Channel the user got kicked from
     * @param {String} nickname User that got kicked
     * @param {String} user User that executed the kick
     * @param {String} reason Reason for the kick
     * @param {Object} message IRC message object
     */
    _onKick(channel, nickname, user, reason, message) {
        main.hook('kick', channel, nickname, user, reason, message);
    }
    /**
     * Event called when a user quits IRC
     * @private
     * @param {String} nickname Nickname of the user that quit
     * @param {String} reason Reason for quitting
     * @param {String} channels Channels the user quit
     * @param {Object} message IRC message object
     */
    _onQuit(nickname, reason, channels, message) {
        main.hook('quit', nickname, reason, channels, message);
    }
    /**
     * Kills the IRC client
     * @param {Function} callback Function to call after client has been killed
     * @param {Object} context Context to bind the callback function to
     */
    kill(callback, context) {
        if (this._connected) {
            this._client.disconnect(
                this._config.leaveMsg ||
                    `${packageJSON.name} - Killed`,
                callback.bind(context || this)
            );
        } else {
            callback.call(context || this);
        }
    }
    /**
     * Gets the client
     * @returns {irc.Client} The IRC client
     */
    get client() {
        return this._client;
    }
    /**
     * Gets if the client is connected to a server
     * @returns {Boolean} If the client is connected to a server
     */
    get connected() {
        return this._connected;
    }
}

module.exports = Client;
