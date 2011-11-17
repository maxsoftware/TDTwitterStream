(function() {

	var events = require('events');
	var ntwitter = require('ntwitter');

	function TDTwitterStream(options) {
		if (!(this instanceof TDTwitterStream)) { return new TDTwitterStream(options); }
	}

	TDTwitterStream.prototype = new events.EventEmitter();



	module.exports = TDTwitterStream;
}).call(this);
