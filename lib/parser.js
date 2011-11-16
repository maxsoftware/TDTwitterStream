(function() {

  var events = require('events')

  function TDTwitterStream(options) {
    if (!(this instanceof TDTwitterStream)) return new TDTwitterStream(options);
  }
  TDTwitterStream.prototype = new events.EventEmitter();

  module.exports = TDTwitterStream;
}).call(this);
