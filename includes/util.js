/**
 * util.js
 *
 * Various utilities within the project
 */
'use strict';

/**
 * Class for project utilities
 */
class Util {
    /**
     * Class constructor
     * @throws {Error} when called
     */
    constructor() {
        main.hook('error', 'This is a static class!', 'Util', 'constructor');
    }
    /**
     * Capitalizes the first letter in a string
     * @static
     * @param {String} s String to capitalize
     * @returns {String} String with the first letter capitalized
     */
    static cap(s) {
        if (typeof s !== 'string') {
            main.hook('parameterError', 'Util.cap');
            return;
        }
        return `${s[0].toUpperCase()}${s.substring(1)}`;
    }
    /**
     * Goes through all keys of an object
     * @static
     * @param {Object} object Object to go through
     * @param {Function} callback Callback function to call
     * @param {Object} context Context to bind to
     */
    static each(object, callback, context) {
        if (typeof callback !== 'function' || typeof object !== 'object') {
            main.hook('parameterError', 'Util.each');
            return;
        }
        for (const i in object) {
            try {
                callback.call(context || this, i, object[i]);
            } catch (e) {
                main.error(e);
            }
        }
    }
    /**
     * Deep-freezes an object
     * @static
     * @param {Object} object Object to deeply freeze
     * @returns {Object} Frozen object
     * @todo Make this not recursive?
     */
    static sleep(object) {
        if (typeof object !== 'object') {
            main.hook('parameterError', 'Util.sleep');
        }
        Util.each(object, function(k, v) {
            if (
                Object.prototype.hasOwnProperty.call(object, k) &&
                typeof v === 'object' &&
                v !== null
            ) {
                Util.sleep(v);
            }
        });
        return Object.freeze(object);
    }
    /**
     * Removes all properties from an object
     * @static
     * @param {Object} object Object to clear
     */
    static clear(object) {
        Object.keys(object).forEach(k => delete object[k]);
    }
    /**
     * Execute a function and catch any errors in
     * @static
     * @param {Function} func Function to safely execute
     * @param {Object} context Context to bind the function to
     */
    static safeRun(func, context) {
        try {
            func.call(context);
        } catch (e) {
            main.error(e);
        }
    }
    /**
     * Encodes URL components MediaWiki-style
     * Based on mw.util.wikiUrlencode
     * @static
     * @param {String} url URL component to encode
     * @returns {String} Encoded URL
     */
    static encode(url) {
        return encodeURIComponent(url)
            .replace(/!/g, '%21')
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
            .replace(/\*/g, '%2A')
            .replace(/~/g, '%7E')
            .replace(/%20/g, '_')
            .replace(/%3A/g, ':')
            .replace(/%2F/g, '/');
    }
}

module.exports = Util;
