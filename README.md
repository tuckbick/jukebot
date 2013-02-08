jukebot
=======
by Tucker Bickler
-----------------

##### an IRC bot which reports on recently played Last.fm (and via scrobbling, Spotify, Rdio, or iTunes) tracks #####

### usage ###

		$ > npm install .
		$ > cp configs_example.js configs.js

Inside your new configs.js, setup your desired config(s). Note that commented-out values are optional.
Then run your node:

		$ > node app.js [config]


If you're setup properly, jukebot should join your selected channels. To operate, simply talk to Jukebot in the IRC channel:

		jukebot lastfm [username]
		jukebot start