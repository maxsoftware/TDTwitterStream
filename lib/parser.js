/*
Copyright (C) 2011 by Max Software Ltd

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

(function() {

	/*
	 *	With these events, there are some naming conventions
	 *	If it's ""event_me" it's an event by someone else that affects the recipient
	 *	If it's "own_event", it's an event that the recipient themselves triggered
	 */

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
			"with": "followings",
			"replies": null	
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
		ntwit.stream('site', {"follow": self.options.follow, "with": self.options.with, "replies": self.options.replies}, function(stream) {

			stream.on("error", function (data) {
				console.log("AN ERROR");
				self.emit("error", data, stream);
			});

			// Disconnection
			stream.on("end", function (end) {
				self.emit("stream_end", end, stream);
			});

			// Silent Disconnection
			stream.on("destroy", function (end) {
				self.emit("stream_destroy", end);
			});

			stream.on("missedHeartbeat", function () {
				self.emit("missed_heartbeat", stream);
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


					if (typeof data.message != "undefined")
					{
						self._direct_message(data.for_user, data.message);

						if (typeof data.message.event != "undefined")
						{
							self._favourite(data.for_user, data.message);
							self._follow(data.for_user, data.message);
							self._user(data.for_user, data.message);
							self._block(data.for_user, data.message);
							self._list(data.for_user, data.message);
						}
					}

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


	TDTwitterStream.prototype._direct_message = function(recipient, data)
	{

		if (typeof data.direct_message != "undefined")
		{
			this.emit("direct_message", recipient, data.direct_message, data.direct_message.sender, data.direct_message.recipient);
		}
		

		if (typeof data.delete != "undefined")
		{
			if (typeof data.delete.direct_message != "undefined")
			{
				this.emit("direct_message_deleted", recipient, data.delete.direct_message.user_id, data.delete.direct_message.id_str);
			}
		}
	}


	TDTwitterStream.prototype._tweet = function(recipient, data)
	{
		if (typeof data.text != "undefined")
		{
			// If it was a RT
			if ( typeof data.retweeted_status != "undefined" )
			{

				this.emit("tweet", recipient, data, data.user);
				
				this.emit("user", recipient, data.retweeted_status.user);

				if (data.retweeted_status.in_reply_to_user_id_str == recipient){
					this.emit("mention", recipient, data.retweeted_status);
				}

				// Retweets
	            if (data.user.id_str == recipient){
					this.emit("retweet_by_me", recipient, data.retweeted_status, data);
		        }

				if (data.retweeted_status.user.id_str == recipient){
					this.emit("retweet_of_me", recipient, data.retweeted_status, data);
	        	}

	        	this.emit("retweet_by_following", recipient, data.retweeted_status, data);

			}

			// It's not a RT
			else
			{
				this.emit("tweet", recipient, data, data.user);
			}

			// Always, if it's a RT or not
			if (data.user.id_str == recipient){
              this.emit("own_tweet", recipient, data);
            }

			this.emit("user", recipient, data.user);

            // Once we get this point, we're using either the original tweet, or a RT if it exists
            
            if ( typeof data.retweeted_status != "undefined" )
            {
            	data = data.retweeted_status;
            }
            
            // Places
            if (data.place != null)
            {
            	this.emit("location", recipient, data, data.place);
            }            
            
            // Entities
            
            for (i in data.entities.urls)
			{
				var link = data.entities.urls[i];
				this.emit("url", recipient, data, link.url, link.display_url, link.expanded_url);
			}
			
			for (i in data.entities.user_mentions)
			{
				var user = data.entities.user_mentions[i];
				this.emit("mention", recipient, data, user.id_str, user.screen_name);
			}
			
			for (i in data.entities.hashtags)
			{
				var hashtag = data.entities.hashtags[i];
				this.emit("hashtag", recipient, data, hashtag.text);
			}

		}

		// Deleting tweets
		if (typeof data.delete != "undefined")
		{
			if (typeof data.delete.direct_message == "undefined")
			{
				this.emit("tweet_deleted", recipient, data.delete.status.user_id_str, data.delete.status.id_str);
			}
		}
	}

	TDTwitterStream.prototype._favourite = function(recipient, data)
	{
		if (data.event == "favorite")
		{
			this.emit("favourite", recipient, data.target_object, data.target_object.user, data.source);

			if (data.target_object.user.id_str == recipient)
			{
				this.emit("favourite_me", recipient, data.target_object, data.target_object.user, data.source);
			}
		}

		if (data.event == "unfavorite")
		{
			this.emit("unfavourite", recipient, data.target_object, data.target_object.user, data.source);

			if (data.target_object.user.id_str == recipient)
			{
				this.emit("unfavourite_me", recipient, data.target_object, data.target_object.user, data.source);
			}
		}
	}

	TDTwitterStream.prototype._follow = function(recipient, data)
	{
		if (data.event == "follow")
		{
			this.emit("follow", recipient, data.target, data.source);

			if (data.target.id_str == recipient)
			{
				this.emit("follow_me", recipient, data.target, data.source);
			}

			if (data.source.id_str == recipient)
			{
				this.emit("own_follow", recipient, data.target, data.source);
			}
		}

		if (data.event == "unfollow")
		{
			this.emit("unfollow", recipient, data.target, data.source);

			/*
			
			I'd like to do this, but Twitter don't emit an event, so we can't

			if (data.target.id_str == recipient)
			{
				this.emit("unfollow_me", recipient, data.target, data.source);
			}

			*/

			if (data.source.id_str == recipient)
			{
				this.emit("own_unfollow", recipient, data.target, data.source);
			}
		}
	}

	TDTwitterStream.prototype._user = function(recipient, data)
	{
		if (data.event == "user_update")
		{
			this.emit("user_profile", recipient, data.target);
		}
	}

	TDTwitterStream.prototype._block = function(recipient, data)
	{
		if (data.event == "block")
		{
			this.emit("block", recipient, data.target, data.source);

			if (recipient == data.source.id_str)
			{
				this.emit("own_block", recipient, data.target, data.source);
			}

			if (recipient == data.target.id_str)
			{
				this.emit("block_me", recipient, data.target, data.source);
			}
		}

		if (data.event == "unblock")
		{
			this.emit("unblock", recipient, data.target, data.source);

			if (recipient == data.source.id_str)
			{
				this.emit("own_unblock", recipient, data.target, data.source);
			}

			if (recipient == data.target.id_str)
			{
				this.emit("unblock_me", recipient, data.target, data.source);
			}
		}
	}
	
	TDTwitterStream.prototype._list = function(recipient, data)
	{
		if (data.event == "list_created")
		{
			this.emit("list_created", recipient, data.target_object, data.source);
		}	
		
		if (data.event == "list_updated")
		{
			this.emit("list_updated", recipient, data.target_object, data.source);
		}	
		
		if (data.event == "list_destroyed")
		{
			this.emit("list_destroyed", recipient, data.target_object, data.source);
		}	
		
		if (data.event == "list_member_added")
		{
			this.emit("list_member_added", recipient, data.target_object, data.target, data.source);
		}
		
		if (data.event == "list_member_removed")
		{
			this.emit("list_member_removed", recipient, data.target_object, data.target, data.source);
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
