var jukebot = (function() { var

    lastfm, lastfmStream, lastFmName, tracks = [],
    client, command, channels, from,
    spot,
    exec,

    init = function(c,lfm,s,x) {
        client = c;
        lastfm = lfm;
        spot = s;
        exec = x;
        channels = client.opt.channels;
        client.addListener('pm', handleMessage);
        channels.forEach(function(chan) {
            client.addListener('message'+chan, handleMessage);
        })
    },

    handleMessage = function(f, msg) {
        command = msg.trim().match(/^jukebot(.*)+/gi);
        if (command != null) {
            command = command[0].split(' ');
            command.shift();
            from = f;
            handleCommand();
        }
    },

    handleCommand = function() {
        if (api.hasOwnProperty(command[0])) {
            api[command[0]]();
        }
    },

    broadcast = function(msg) {
        channels.forEach(function(chan) {
            client.say(chan,msg);
        });
    },

    decorateTrack = function(t) {
        return "♫ ♫ ~ " + t.artist['#text'] + " - " + t.name + " ~ ♫ ♫";
    },

    nowPlaying = function(t) {
        t.text = decorateTrack(t);
        tracks.unshift(t);
        if (tracks.length > 10)
            tracks.pop();
        broadcast(t.text);
    },

    showHelp = function() {
        broadcast('help: show this message\nlastfm <name>: set lastfm name\nstart: begin to show songs\nstop: stop showing songs\nspotify: get spotify uri for last played song\nlist: show the last 10 played songs');
    },

    reply = function(msg) {
        broadcast(from + ': ' + msg);
    },

    api = {
        '?': showHelp,
        help: showHelp,
        start: function() {
            if (lastFmName == null || lastfmStream == null) {
                reply('set lastfm name first');
                return;
            }
            lastfmStream.start();
        },
        stop: function() {
            if (lastfmStream !== undefined)
                lastfmStream.stop();
        },
        lastfm: function() {
            this.stop();
            lastFmName = command[1];
            lastfmStream = lastfm.stream(lastFmName);
            lastfmStream.on('nowPlaying', nowPlaying);
        },
        spotify: function() {
            if (tracks.length <= 0) {
                reply('play a song first');
            };

            var q = tracks[0].name + ' ' + tracks[0].artist['#text'];
            if (tracks[0].album['#text'] != '')
                q += ' ' + tracks[0].album['#text'];

            spot.search({ type: 'track', query: q }, function(err, data) {
                if (err) return;

                if (data.tracks.length > 0)
                    reply(data.tracks[0].href);
                else
                    reply('no songs found on spotify');
            });
        },
        list: function() {
            var msg = '';
            tracks.forEach(function(track) {
                msg = track.text + '\n' + msg;
            });
            broadcast(msg);
        },
        // test: function() {
        //     exec("open spotify:track:58HpsDKeYoLtNhXFQyQmz5");
        // }
    }

    return {
        init: init
    }
})();


var irc = require('irc'),
    LastFmNode = require('lastfm').LastFmNode,
    spotify = require('spotify'),
    exec = require('child_process').exec;

var client = new irc.Client('irc.freenode.net', 'jukebot', {
    channels: ['#irc'],
    // debug: true
});

var lastfm = new LastFmNode({
    api_key: '',
    secret : ''
});

jukebot.init(client, lastfm, spotify, exec);