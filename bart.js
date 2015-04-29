
var request = require('request');
var libxmljs = require('libxmljs');
var qs = require('querystring');

module.exports = function(api_key) {
    
    this.api_key = api_key;
    this.base_uri = 'http://api.bart.gov/api/';

    this.query = function(resource, command, opts, cb) {

        var obj = {
            cmd: command,
            key: this.api_key
        };

        Object.keys(opts).forEach(function (k) {
           obj[k] = opts[k];
        });

        var uri = this.base_uri + resource + '.aspx?' + qs.stringify(obj);

        var req = request.get(uri, function (err, res, body) {
            if (err) {
                return cb(err);
            }

            if (res.statusCode !== 200) {
                return cb("Got http status code " + res.statusCode, body);
            }
            
            cb(null, libxmljs.parseXml(body.toString()), body);

        });

    };
};








 
