var Bot = new require('./node_modules/TuckBot/TuckBot').TuckBot,
    lastFmNode = require('lastfm').LastFmNode, lastFmStream, lastFmName,
    spotify = require('spotify'),
    tracks = [];

var lastFm = new lastFmNode({
    api_key: '',
    secret : ''
});

function JukeBot(server, nick, opt) {

    var self = this,
        bot = new Bot(server, nick, opt);

    self.doHelp = function(from, args, info) {
        var msg = 'help: show this message\n'
                + 'lastfm <name>: set lastfm name\n'
                + 'start: begin to show songs\n'
                + 'stop: stop showing songs\n'
                + 'spotify: get spotify uri for last played song\n'
                + 'list: show the last 10 played songs'
            ;
        bot.reply(from, msg, info);
    }

    self.stop = function(from, args, info) {
        if (lastFmStream !== undefined)
            lastFmStream.stop();
    }

    self.decorateTrack = function(track) {
        return "♫ ♫ ~ " + track.artist['#text'] + " - " + track.name + " ~ ♫ ♫";
    }

    self.logTrack = function(track) {
        track.text = self.decorateTrack(track);
        tracks.unshift(track);
        if (tracks.length > 10)
            tracks.pop();
    }

    bot.api = {

        '?': self.doHelp,
        help: self.doHelp,

        start: function(from, args, info) {
            if (lastFmName == null || lastFmStream == null) {
                bot.reply(from, '!!! set lastfm name first', info);
                return;
            }
            lastFmStream.start();
        },

        stop: self.stop,

        lastfm: function(from, args, info) {
            self.stop();
            lastFmName = args[0];
            lastFmStream = lastFm.stream(lastFmName);
            lastFmStream.on('nowPlaying', function(track) {
                self.logTrack(track);
                bot.reply(from, track.text, info);
            });
        },

        spotify: function(from, args, info) {
            if (tracks.length <= 0) {
                bot.reply(from, '!!! play a song first', info);
            };

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
        },

        list: function(from, args, info) {
            if (!tracks.length) {
                bot.reply(from, 'no recent tracks', info);
                return;
            }
            var msg = '';
            tracks.forEach(function(track) {
                msg = track.text + '\n' + msg;
            });
            bot.reply(from, msg, info);
        }
    }
}

var jukebot = new JukeBot('irc.freenode.net', 'jukebot', {
    channels: ['#irc'],
    // debug: true
})