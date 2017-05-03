/**
 * util.js
 *
 * Various utilities within the project
 */
'use strict';

/**
 * Class for project utilities
 * @class Util
 */
class Util {
    /**
     * Capitalizes the first letter in a string
     * @method cap
     * @static
     * @param {String} s String to capitalize
     * @return {String} String with first letter capitalized;
     */
    static cap(s) {
        if(typeof s !== 'string') {
            main.hook('parameterError', 'Util.cap');
            return;
        }
        return `${s[0].toUpperCase()}${s.substring(1)}`;
    }
    /**
     * Goes through all keys of an object
     * @method each
     * @static
     * @param {Object} object Object to go through
     * @param {Function} callback Callback function to call
     * @param {Object} context Context to bind to
     */
    static each(object, callback, context) {
        if(typeof callback !== 'function' || typeof object !== 'object') {
            main.hook('parameterError', 'Util.each');
            return;
        }
        for(let i in object) {
            try {
                callback.call(context || this, i, object[i]);
            } catch(e) {
                main.error(e);
            }
        }
    }
    /**
     * Deep-freezes an object
     * @method sleep
     * @static
     * @param {Object} object Object to deeply freeze
     * @return {Object} Frozen object
     * @todo Make this not recursive?
     */
    static sleep(object) {
        if(typeof object !== 'object') {
            main.hook('parameterError', 'Util.sleep');
        }
        Util.each(object, function(k, v) {
            if(
                object.hasOwnProperty(k) &&
                typeof v === 'object' &&
                v !== null
            ) {
                Util.sleep(v);
            }
        });
        return Object.freeze(object);
    }
}

module.exports = Util;
