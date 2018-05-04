/**
 * io.js
 * Module for HTTP communication
 * Completely copied from WikiaActivityLogger
 */
'use strict';

/**
 * Importing modules
 */
const http = require('request-promise-native'),
      pkg = require('../package.json');

/**
 * Static class for handling HTTP requests
 */
class IO {
    /**
     * Class constructor
     * @throws {Error} when called
     */
    constructor() {
        main.hook('error', 'This is a static class!', 'IO', 'constructor');
    }
    /**
     * Makes a new cookie jar
     * Cookies made separately
     */
    static makeJar() {
        IO.jar = http.jar();
    }
    /**
     * Internal method for handling HTTP requests
     * @private
     * @param {String} method If to use GET or POST
     * @param {String} url URL to send the HTTP request to
     * @param {Object} data Data to send in the request
     * @param {Function} transform How to transform the data when receieved
     * @param {Boolean} body If the data should be in POST body
     * @returns {Promise} Promise on which to listen for response
     */
    static _request(method, url, data, transform, body) {
        const lol = [
                'socket.io sucks',
                'Brandon is a witch',
                'This user agent string is random',
                '69% of people don\'t understand things correctly',
                '"Kocka" means "cube" in Serbian',
                'A cube has 6 sides',
                'Cubes aren\'t Illuminati'
            ],
            options = {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `${pkg.name} v${pkg.version} (${pkg.homepage}) [Did you know? ${lol[Math.floor(Math.random() * lol.length)]}]`
                },
                jar: IO.jar,
                // TODO: Hacky
                json: data !== 'notjson',
                method,
                uri: url
            };
        if (data) {
            options[body ? 'body' : 'qs'] = data;
        }
        if (transform) {
            options.transform = transform;
        }
        return http(options);
    }
    /**
     * Makes a GET request
     * @param {String} url URL to send the HTTP request to
     * @param {Object} data Data to send in the request
     * @param {Function} transform How to transform the data when receieved
     * @returns {Promise} Promise on which to listen for response
     */
    static get(url, data, transform) {
        return IO._request('GET', url, data, transform);
    }
    /**
     * Makes a GET request
     * @param {String} url URL to send the HTTP request to
     * @param {Object} data Data to send in the request
     * @param {Function} transform How to transform the data when receieved
     * @param {Boolean} body If the data should be in POST body
     * @returns {Promise} Promise on which to listen for response
     */
    static post(url, data, transform, body) {
        return IO._request('POST', url, data, transform, body);
    }
    /**
     * Calls the MediaWiki API
     * @param {String} wiki Wiki to query
     * @param {String} action Action to use
     * @param {Object} options Other data to supply
     * @param {Function} transform How to transform the data when receieved
     * @param {String} method Method to use when communicating with the API.
     *                        Set to GET by default
     * @returns {Promise} Promise on which to listen for response
     */
    static api(wiki, action, options, transform, method) {
        if (typeof action !== 'string') {
            main.hook('error', '`action` parameter invalid', 'IO', 'api');
        }
        options.action = action;
        options.format = 'json';
        return IO._request(
            method || 'GET',
            `https://${wiki}.wikia.com/api.php`,
            options,
            function(data) {
                // TODO: Improve this
                if (!data) {
                    main.hook('error', 'API returned no data!');
                } else if (data.error) {
                    const e = data.error;
                    main.hook('error', `API error: ${e.code}: ${e.info}`);
                    return data[action] ? data[action] : data;
                } else if (typeof data[action] === 'undefined') {
                    main.hook('error', 'API returned no data!');
                } else if (typeof transform === 'function') {
                    return transform(data[action]);
                } else {
                    return data[action];
                }
            }
        );
    }
}

module.exports = IO;
