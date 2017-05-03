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
      NickServ = require('nickserv');

/**
 * Constants
 */
const EVENTS = [
    'error',
    'join',
    'message',
    'registered',
    'notice'
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
                delete v.name;
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
                delete v.name;
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
     */
    _initClient() {
        const c = this._config,
              options = {
                  userName: c.user,
                  realName: c.name,
                  stripColors: true,
                  channels: [ '#' + c.channel ]
              };
        this._client = new irc.Client(c.server, c.nick, options);
        EVENTS.forEach(e => this._client.addListener(
            e, this[`_on${util.cap(e)}`].bind(this)
        ));
        if(c.password) {
            this._nickserv = new NickServ(c.nick, { password: c.password });
            this._nickserv.attach('irc', this._client);
        }
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
        }
    }
    /**
     * Event called when a message is received
     * @method _onMessage
     * @private
     * @param {String} nickname Nickname of the user that sent the message
     * @param {String} channel Channel the message was sent in
     * @param {String} text Message contents
     */
    _onMessage(nickname, channel, text) {
        const msg = new Message(text);
        if(channel === '#' + this._config.channel) {
            if(msg.type) {
                this._map.forEach(function(map) {
                    if(map.filter && map.filter.execute(msg)) {
                        map.transport.execute(msg);
                    }
                });
            }
        }
    }
    /**
     * Event called when the IRC client joins the IRC server
     * @method _onRegistered
     * @private
     */
    _onRegistered() {
        main.hook('serverJoin');
        if(this._nickserv) {
            this._nickserv.identify();
        }
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
     * Kills the IRC client
     * @method kill
     * @param {Function} callback Function to call after client has been killed
     * @param {Object} context Context to bind the callback function to
     */
    kill(callback, context) {
        this._client.disconnect(
            this._config.leaveMsg || `${process.env.npm_package_name} - Killed`,
            callback.bind(context || this)
        );
    }
}

module.exports = Client;
