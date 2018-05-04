/**
 * main.js
 *
 * New users transport implementation
 */
'use strict';

/**
 * Importing modules
 */
const Transport = require('../transport.js'),
      io = require('../../includes/io.js'),
      mysql = require('mysql');

/**
 * Constants
 */
const QUERY = 'INSERT INTO `newusers` (`name`, `wiki`) VALUES(?, ?)',
      INTERVAL = 5000;

/**
 * New users transport class
 * @augments Transport
 */
class NewUsers extends Transport {
    /**
     * Class constructor
     * @param {Object} config Transport configuration
     */
    constructor(config) {
        super(config);
        if (!config.user || !config.password) {
            throw new Error('Database username or password missing!');
        }
        if (!config.id || !config.token) {
            throw new Error('Invalid or missing webhook configuration!');
        }
        if (!this._format) {
            throw new Error('Format is required for newusers transport!');
        }
        this._url = `https://discordapp.com/api/webhooks/${config.id}/${config.token}`;
        this._config.interval = this._config.interval || 30 * 60 * 1000;
        this._db = mysql.createPool({
            connectionLimit: config.limit || 100,
            database: config.database || 'wikia',
            debug: false,
            host: config.host || 'localhost',
            password: config.password,
            user: config.user
        });
        this._queue = [];
        this._tQueue = {};
        setInterval(this._interval.bind(this), INTERVAL);
    }
    /**
     * Transfers the message
     * @param {Message} msg Message to transfer
     * @returns {void}
     */
    execute(msg) {
        this._queue.push(Date.now());
        this._queue.push(msg.user);
        this._queue.push(msg.wiki);
        this._insert(msg.user, msg.wiki);
    }
    /**
     * Registers an account creation in the database
     * @private
     * @param {String} user User that created an account
     * @param {String} wiki Subdomain where the user created the account
     * @returns {void}
     */
    _insert(user, wiki) {
        this._db.getConnection(function(err, conn) {
            if (err) {
                main.error(err);
            } else {
                conn.once('error', function() {
                    main.error('[newusers] `error` event fired!');
                });
                conn.query(QUERY, [user, wiki], function(err1) {
                    if (err1) {
                        main.error(err1);
                    }
                    conn.release();
                });
            }
        });
    }
    /**
     * Checks latest entries in the newusers object
     * and transports them to Discord
     * @private
     * @returns {void}
     */
    _interval() {
        const now = Date.now();
        while (this._queue[0] && now - this._queue[0] > this._config.interval) {
            this._queue.shift();
            const user = this._queue.shift();
            this._tQueue[user] = this._queue.shift();
            this._transport(user);
        }
    }
    /**
     * Checks the user's ID and passes it on
     * @private
     * @param {String} user Username of the user
     * @returns {void}
     */
    _transport(user) {
        io.api(
            'community',
            'query',
            {
                list: 'users',
                ususers: user
            },
            d => d.users[0].userid
        ).then(this._cbId.bind(this)).catch(e => main.error(e));
    }
    /**
     * Checks the user's masthead information and passes it on
     * @private
     * @param {Number} id User's ID
     * @returns {void}
     */
    _cbId(id) {
        io.get(
            `https://services.wikia.com/user-attribute/user/bulk?id=${id}`,
            'notjson',
            d => JSON.parse(d).users[id]
        ).then(this._cbService.bind(this)).catch(e => main.error(e));
    }
    /**
     * Transports the user's masthead information
     * @private
     * @param {Object} info User's masthead information
     * @returns {void}
     */
    _cbService(info) {
        if (!info || !info.website) {
            return;
        }
        info.wiki = this._tQueue[info.username];
        if (!info.wiki) {
            return;
        }
        delete this._tQueue[info.username];
        const format = this._format.execute(this, info);
        if (format) {
            io.post(this._url, format, null, true).catch(e => main.error(e));
        }
    }
}

module.exports = NewUsers;
