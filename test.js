/**
 * test.js
 *
 * Used for message parsing tests
 * IRC messages to test are listed in test.txt file
 * and after running the script the results will be
 * shown in the test.out.txt file
 */
'use strict';
const fs = require('fs'),
      Message = require('./includes/msg.js');

/**
 * Writes output to file
 * @param {String} text Text to write into the file
 */
function write(text) {
    fs.writeFile('test.out.txt', text, function(err) {
        if (err) {
            console.error(
                'An error occurred while writing to the output file!',
                err
            );
        }
    });
}

/**
 * Reads the test file
 */
function read() {
    let output = '';
    fs.readFile('test.txt', function(err, data) {
        if (err) {
            console.error('An error occurred while reading test.txt!', err);
            return;
        }
        data.toString().split('\n').forEach(function(line) {
            const msg = new Message(line.trim());
            if (msg.type) {
                for (const i in msg) {
                    output += `${i}: ${JSON.stringify(msg[i])}\n`;
                }
            } else {
                output += `Couldn't parse line: ${line}\n`;
            }
            output += '--------------------\n';
        });
        write(output);
    });
}

read();
