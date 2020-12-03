var tai = require("t-a-i");

var date = new Date
var now = date.getTime() ;
var offset = tai.unixToAtomic(now) - now;
console.log(offset,date.toUTCString())