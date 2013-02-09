var Bot = new require('tuckbot').TuckBot,
    lastFmNode = require('lastfm').LastFmNode, lastFmStream, lastFmName,
    spotify = require('spotify'),
    sa = require('spotify-node-applescript'),
    _ = require('underscore'),

    Configs = require('./configs.js').Configs,
    tracks = [];

var lastFm = new lastFmNode({
    api_key: 'e46b1634c50dcb82127e3874e8f94e15',
    secret : 'cd681c4820bbf757ceee729a86b59d98'
});

function JukeBot(server, nick, opt) {

    var self = this,
        bot = new Bot(server, nick, opt);

    _.extend(self, {
        doHelp: function(from, args, info) {
            var msg = 'help (?): show this message\n' +
                    'play [spotify URI]: play, or start the listed song\n' +
                    'pause (stop)\n' +
                    'next (skip)\n' +
                    'previous (prev, back)\n' +
                    'volume [up, down, max, mute, <value>] (vol): adjust or view volume\n' +
                    'mute\n' +
                    'unmute\n' +
                    'lastfm <name>: set lastfm name\n' +
                    'stream [stop, start]: begin to show songs\n';

            bot.reply(from, msg, info);
        },

        decorateTrack : function(track) {
            return "♫ ♫ ~ " + track.artist['#text'] + " - " + track.name + " ~ ♫ ♫";
        },

        logTrack : function(track) {
            track.text = self.decorateTrack(track);
            tracks.unshift(track);
            if (tracks.length > 10)
                tracks.pop();
        }
    });

    sa.getState(function(err, state) { self.savedVolume = state.volume; });

    bot.api = {
        '?': self.doHelp,
        help: self.doHelp,

        play: function(from, args, info) {
            if(args.length && args[0].length) {
                if(args[0].indexOf("spotify:") === 0) {
                    sa.playTrack(args[0], function() {});
                } else {
                    // TODO: search for song in LastFM and play first hit
                    bot.reply(from, "invalid Spotify uri", info);
                }
            } else {
                sa.play(function() {});
            }
        },
        pause: function(from, args, info) { sa.pause(function() {}); },
        stop: function(from, args, info) { this.pause(from, args, info); },

        next: function(from, args, info) { sa.next(function() {}); },
        previous: function(from, args, info) { sa.previous(function() {}); },
        skip: function(from, args, info) { this.next(from, args, info); },
        back: function(from, args, info) { this.previous(from, args, info); },
        prev: function(from, args, info) { this.previous(from, args, info); },
        '>' : function(from, args, info) { this.next(from, args, info); },
        '<' : function(from, args, info) { this.previous(from, args, info); },

        volume : function(from, args, info) {
            switch(args[0]) {
                case "up" : sa.volumeUp(function() {}); break;
                case "down" : sa.volumeDown(function() {}); break;
                case "max" : sa.setVolume(100, function() {}); break;
                case "mute" : sa.mute(function() {}); break;
                case "unmute" : sa.unmute(function() {}); break;
                default :
                    if(args.length && args[0].length) sa.setVolume(parseInt(args[0], 10), function() {});
                    else { sa.getState(function(err, state) { bot.reply(from, 'current volume: ' + state.volume, info); }); }
                    break;
            }
        },
        vol : function(from, args, info) { this.volume(from, args, info); },
        mute : function(from, args, info) { this.volume(from, ['mute'], info); },
        unmute : function(from, args, info) { this.volume(from, ['unmute'], info); },

        lastfm: function(from, args, info) {
            if(lastFmName != null && lastFmStream != null) lastFmStream.stop();
            lastFmName = args[0];
            lastFmStream = lastFm.stream(lastFmName);
            lastFmStream.on('nowPlaying', function(track) {
                self.logTrack(track);
                bot.reply(from, track.text, info);
            });
        },
        stream: function(from, args, info) {
            if (lastFmName == null || lastFmStream == null) {
                bot.reply(from, '!!! set lastfm name first', info);
                return;
            }
            switch(args[0]) {
                case "stop" : lastFmStream.stop(); break;
                case "start" : lastFmStream.start(); break;
                default : lastFmStream.start(); break;
            }
        },

        // TODO: deprecate and remove this function, get search functionality into "play"
        spotify: function(from, args, info) {
            if (tracks.length <= 0) {
                bot.reply(from, '!!! play a song first', info);
            }

            var q = tracks[0].name + ' ' + tracks[0].artist['#text'];
            if (tracks[0].album['#text'] != '')
                q += ' ' + tracks[0].album['#text'];

            spotify.search({ type: 'track', query: q }, function(err, data) {
                if (err) return;

                if (data.tracks.length > 0)
                    bot.reply(from, data.tracks[0].href, info);
                else
                    bot.reply(from, 'no songs found on spotify', info);
            });
        }
    };
}

if(process.argv.length > 2 && typeof Configs[process.argv[2]] !== "undefined") {
    var config = Configs[process.argv[2]];
    var jukebot = new JukeBot(config[0], config[1], config[2]);
} else {
    console.log("usage: node app.js <server> <nick> <opts>");
}
