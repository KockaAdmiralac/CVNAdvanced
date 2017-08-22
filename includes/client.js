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
      util = require('./util.js');

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
    'wikia-discussions'
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
     * @method _initFilters
     * @private
     */
    _initFilters() {
        this._filters = {};
        util.each(this._config.filters, function(k, v) {
            if(v.name) {
                const Filter = main.filters[v.name];
                if(Filter) {
                    this._filters[k] = new Filter(k, v);
                }
            }
        }, this);
    }
    /**
     * Initializes transports
     * @method _initTransports
     * @private
     * @todo DRY
     */
    _initTransports() {
        this._transports = {};
        util.each(this._config.transports, function(k, v) {
            if(v.name) {
                const Transport = main.transports[v.name];
                if(Transport) {
                    this._transports[k] = new Transport(v);
                }
            }
        }, this);
    }
    /**
     * Initializes filter-transport map
     * @method _initMap
     * @private
     */
    _initMap() {
        this._map = [];
        util.each(this._config.map, function(k, v) {
            const filter = this._filters[k];
            if(typeof v === 'string') {
                this._map.push({
                    filter: filter,
                    transport: this._transports[v]
                });
            } else if(v instanceof Array) {
                v.forEach(t => this._map.push({
                    filter: filter,
                    transport: this._transports[t]
                }));
            }
        }, this);
    }
    /**
     * Initializes the IRC client object
     * @method _initClient
     * @private
     * @todo Secure connection
     */
    _initClient() {
        const c = this._config;
        this._client = new irc.Client('chat.freenode.net', c.nick, {
            userName: c.user,
            realName: c.name,
            channels: CHANNELS.map(ch => `#${ch}`),
            stripColors: true,
            sasl: true,
            password: c.password
        });
        EVENTS.forEach(e => this._client.addListener(
            e, this[`_on${util.cap(e)}`].bind(this)
        ));
    }
    /**
     * Event called when an error in IRC client occurs
     * @method _onError
     * @private
     * @param {Object} message IRC message with the error
     */
    _onError(message) {
        main.debug(JSON.stringify(message));
    }
    /**
     * Event called when a channel is joined in IRC
     * @method _onJoin
     * @private
     * @param {String} channel Channel that was joined
     * @param {String} nickname Nickname of the user that joined
     */
    _onJoin(channel, nickname) {
        if(nickname === this._config.nick) {
            main.hook('channelJoin', channel);
        } else {
            main.hook('userJoin', nickname, channel);
        }
    }
    /**
     * Event called when a message is received
     * @method _onMessage
     * @private
     * @param {String} nickname Nickname of the user that sent the message
     * @param {String} channel Channel the message was sent in
     * @param {String} text Message contents
     * @param {Object} message IRC message object
     */
    _onMessage(nickname, channel, text, message) {
        if(!util.includes(CHANNELS, channel.substring(1))) {
            main.hook('extMsg', nickname, channel, text, message);
            return;
        }
        try {
            const msg = new Message(text);
            if(msg.type) {
                this._map.forEach(function(map) {
                    if(map.filter && map.filter.execute(msg)) {
                        map.transport.execute(msg);
                    }
                });
            } else {
                main.hook('unknownMsg', nickname, channel, text, message);
            }
        } catch(e) {
            main.error(e);
        }
    }
    /**
     * Event called when the IRC client joins the IRC server
     * @method _onRegistered
     * @private
     */
    _onRegistered() {
        this._connected = true;
        main.hook('serverJoin');
    }
    /**
     * Event called when an IRC notice is sent
     * @method _onNotice
     * @private
     * @param {String} nick Nickname sending the notice
     * @param {String} to Notice receiver
     * @param {String} text Message contents
     **/
    _onNotice(nick, to, text) {
        main.hook('ircNotice', nick, text);
    }
    /**
     * Event called when a user leaves a channel
     * @method _onPart
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
     * @method _onKick
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
     * @method _onQuit
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
     * @method kill
     * @param {Function} callback Function to call after client has been killed
     * @param {Object} context Context to bind the callback function to
     */
    kill(callback, context) {
        if(this._connected) {
            this._client.disconnect(
                this._config.leaveMsg ||
                    `${process.env.npm_package_name} - Killed`,
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
