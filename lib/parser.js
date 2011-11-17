(function() {

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

	TDTwitterStream.prototype.get_options = function()
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

		return defaults.extend(this.options);
	}

	TDTwitterStream.prototype.check_options = function()
	{
		// Check we have all the info that we need
		var opts = this.get_options();

		// Starting with OAuth tokens (They're all required)
		for (i in opts.auth)
		{
			if (opts.auth[i] == null)
			{
				this.emit("error", "Option "+i+" is required");
			}
		}

		// Then a list of people to follow
		if (opts.follow.length < 1)
		{
			this.emit("error", "You need to follow at least one person's stream");
		}
	}

	
	TDTwitterStream.prototype.run = function()
	{
		var self = this; // Aliasing for later
		self.check_options(); // Check everything's valid

		// Fire up the ntwitter stream

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