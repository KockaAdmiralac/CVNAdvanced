/**
 * main.js
 *
 * Module for example format
 */
'use strict';

/**
 * Importing modules
 */
const Format = require('../format.js'),
      util = require('../../includes/util.js');

/**
 * Constants
 */
/* eslint-disable */
const PROPERTY_MAP = {
    website: 'Website',
    name: 'aka',
    location: 'I live in',
    UserProfilePagesV3_birthday: 'I was born on',
    UserProfilePagesV3_gender: 'I am',
    fbPage: 'Facebook',
    twitter: 'Twitter',
    bio: 'Bio'
}, PREFIXES = {
    fbPage: 'https://facebook.com/',
    twitter: 'https://twitter.com/'
};
/* eslint-enable */

/**
 * Main class
 * @augments Format
 */
class ExampleFormat extends Format {
    /**
     * Main class method
     * @param {Transport} transport Transport to pass the message to
     * @param {Object} info Message to format
     * @returns {Object} Formatted embed
     */
    execute(transport, info) {
        if (transport.constructor.name !== 'NewUsers') {
            return;
        }
        const wiki = info.wiki === 'www' ? 'c' : info.wiki,
              user = util.encode(info.username);
        const ret = {
            fields: [],
            title: info.username,
            url: `http://${wiki}.wikia.com/wiki/Special:Contribs/${user}`
        };
        if (info.avatar) {
            ret.image = {
                url: info.avatar
            };
        }
        util.each(PROPERTY_MAP, function(k, v) {
            if (info[k]) {
                ret.fields.push({
                    inline: true,
                    name: v,
                    value: PREFIXES[k] ?
                        PREFIXES[k] + info[k] :
                        info[k]
                });
            }
        });
        return {embeds: [ret]};
    }
}

module.exports = ExampleFormat;
