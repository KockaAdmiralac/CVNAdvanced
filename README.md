# CVNAdvanced

IRC bot for listening on Wikia CVN channels (`#cvn-wikia`,
`#wikia-discussions`, `#wikia-spam` and `#cvn-wikia-newusers` on Freenode)
and transferring message information over multiple transports.

Documentation on how to use it is in `docs` directory.

Built with Node.js, webhooks, cubes, stars, bricks, bots, parrots, whales,
laundry machines and probably many more I can't remember at this time.

## To Do
- I18N
- Coloring in CLI controller
- More commands
- Secure connection to IRC
- More efficient hook handling
- `Error: write after end` when stopping/restarting through commands
- Eliminate EventEmitter memory leak warning in newusers transport