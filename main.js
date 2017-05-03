/**
 * main.js
 *
 * Entry point for CVNAdvanced
 */
'use strict';

/**
 * Constants
 */
const CONTROLLER = 'cli';

/**
 * Importing modules
 */
const Controller = require(`./controllers/${CONTROLLER}/main.js`);

/**
 * Initialization
 */
global.main = new Controller();
main.initialize();
