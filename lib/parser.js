(function() {

	var sys = require('sys');
	var events = require('events');
	var ntwitter = require('ntwitter');

	function TDTwitterStream(options) {
		if (!(this instanceof TDTwitterStream)) { return new TDTwitterStream(options); }

		if (typeof options != "undefined")
		{
			this.set_options(options);
		}
	}

	TDTwitterStream.prototype = new events.EventEmitter();

	TDTwitterStream.prototype.set_options = function(options)
	{
		if (typeof options != "object")
		{
			this.emit("error", "Options must be an object");
		}

		this.options = options;
	}

	TDTwitterStream.prototype.merge_options = function()
	{
		var defaults = {
			"auth": {
				"consumer_key": null,
				"consumer_secret": null,
				"access_token_key": null,
				"access_token_secret": null,
			},
			"follow": [],
			"with": "followings"	
		};

		this.options = defaults.extend(this.options);

		this.check_options();
	}

	TDTwitterStream.prototype.check_options = function()
	{
		// Starting with OAuth tokens (They're all required)
		for (i in this.options.auth)
		{
			if (this.options.auth[i] == null)
			{
				this.emit("error", "Option "+i+" is required");
			}
		}

		// Then a list of people to follow
		if (this.options.follow.length < 1)
		{
			this.emit("error", "You need to follow at least one person's stream");
		}

	}

	
	TDTwitterStream.prototype.run = function()
	{
		var self = this; // Aliasing for later
		self.merge_options(); // Make sure we use defaults if we need

		// Fire up the ntwitter stream
		ntwit = new ntwitter(self.options.auth);
		ntwit.stream('site', {"follow": self.options.follow, "with": self.options.with}, function(stream) {

			stream.on("error", function (error) {
				console.log(sys.inspect(error));

				// Exit process so Forever can restart it
				stream.destroy();
				process.exit(1);
			});

			stream.on("end", function (end) {
				console.log(sys.inspect(end));

				// Exit process so Forever can restart it
				stream.destroy();
				process.exit(1);
			});

			stream.on('data', function (data) {  
				// Aimed at the system
				self._control(data);

				// Aimed at a user
				// We call all of these functions, but most won't do anything
				if (typeof data.for_user != "undefined")
				{
					self._connect(data.for_user, data.message);
					self._tweet(data.for_user, data.message);
					self._favourite(data.for_user, data.message);
				}

				//console.log(sys.inspect(data));
				
			});
		});

	}

	// "Private" methods of taking an envelope and checking if we need to do anything with it

	TDTwitterStream.prototype._control = function(data)
	{
		if (typeof data.control != "undefined")
		{
			this.emit("control", data.control.control_uri);
		}
	}

	TDTwitterStream.prototype._connect = function(recipient, data)
	{
		if (typeof data.friends != "undefined")
		{
			this.emit("connect", recipient, data.friends);
		}
	}


	TDTwitterStream.prototype._tweet = function(recipient, data)
	{
		if (typeof data.text != "undefined")
		{

			// If it was a RT
			if ( typeof data.retweeted_status != "undefined" )
			{
				this.emit("tweet", recipient, data.retweeted_status, data.retweeted_status.user);
				
				this.emit("user", recipient, data.retweeted_status.user);

				if (data.retweeted_status.in_reply_to_user_id_str == recipient){
					self.emit("mention", recipient, data.retweeted_status);
				}

				// Retweets
	            if (data.user.id_str == recipient){
					self.emit("retweet_by_me", recipient, data.retweeted_status, data);
		        }

				if (data.retweeted_status.user.id_str == recipient){
					self.emit("retweet_of_me", recipient, data.retweeted_status, data);
	        	}

	        	this.emit("retweet_by_following", recipient, data.retweeted_status, data);

			}

			// It's not a RT
			else
			{
				this.emit("tweet", recipient, data, data.user);
				if (data.in_reply_to_user_id_str == recipient){
					self.emit("mention", recipient, data);
				}
			}

			// Always, if it's a RT or not
			if (data.user.id_str == recipient){
              self.emit("own_tweet", recipient, data);
            }

			this.emit("user", recipient, data.user);

            

		}

		// Deleting tweets
		if (typeof data.delete != "undefined")
		{
			console.log();
			this.emit("tweet_deleted", data.delete.status.user_id_str, data.delete.status.id_str);
		}
	}

	TDTwitterStream.prototype._favourite = function(recipient, data)
	{
		if (typeof data.friends != "undefined")
		{
			this.emit("connect", data.friends);
		}
	}


	module.exports = TDTwitterStream;
}).call(this);













// Helpers

// via http://onemoredigit.com/post/1527191998/extending-objects-in-node-js
Object.defineProperty(Object.prototype, "extend", {
    enumerable: false,
    value: function(from) {
        var props = Object.getOwnPropertyNames(from);
        var dest = this;
        props.forEach(function(name) {
            if (name in dest) {
                var destination = Object.getOwnPropertyDescriptor(from, name);
                Object.defineProperty(dest, name, destination);
            }
        });
        return this;
    }
});