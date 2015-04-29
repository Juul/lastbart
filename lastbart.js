#!/usr/bin/env nodejs


var argv = require('minimist')(process.argv.slice(2), {boolean: ['l', 'n']});

var BART = require('./bart.js');
var settings = require('./settings.js');
var moment = require('moment');

var bart = new BART(settings.bart_api_key);

var directions = {
    sf: ['DALY', 'MLBR', 'SFIA'],
    richmond: ['RICH'],
    pittsburg: ['PITT'],
    fremont: ['FRMT']
}

function usage() {
    console.log("Usage: ./lastbart.js from_station_name to direction");
    console.log("");
    console.log("  -l: List all stations");
    console.log("  -n: Only output seconds until next BART");
    console.log("  -h / --help: Show usage information.");
    console.log("");
    console.log("Station name and direction can be the complete or partial.")
    console.log("Direction must be one of:");
    console.log("  sf");
    console.log("  richmond");
    console.log("  fremont");
    console.log("  pittsburg");
}

if(argv.h || argv.help) {
    usage();
    process.exit(0);
}

function get_stations(callback) {
    var list = [];
    
    bart.query('stn', 'stns', {}, function(err, xml, body) {
        if(err) {
            return callback(err);
        }

        var stations = xml.find('//station');
        var i;
        for(i=0; i < stations.length; i++) {
            list.push({
                abbr: stations[i].get('abbr').text(),
                name: stations[i].get('name').text()
            });
        }
        callback(null, list);
    });
}

// get the station abbreviation from a (possibly incomplete) station name
// or abbreviation
function find_abbr(name, callback) {
    name = name.replace(/\s+/g, '');
    var found = [];
    get_stations(function(err, list) {
        if(err) {
            return callback(err);
        }
        var i, cur_name, cur_abbr;
        for(i=0; i < list.length; i++) {
            cur_name = list[i].name.replace(/\s+/g, '');
            cur_abbr = list[i].abbr.replace(/\s+/g, '');
            if(cur_name.match(new RegExp(name, 'i')) || cur_abbr.match(new RegExp(name, 'i'))) {
                found.push(list[i]);
            }
        }
        if(found.length > 1) {
            return callback("The station name you specified is ambiguous.");
        }
        if(found.length <= 0) {
            return callback(null, null);
        }

        callback(null, found[0]);
    });
}

function list_stations() {
    get_stations(function(err, list) {
        if(err) {
            console.error("Error: " + err);
            process.exit(1);
        };

        console.log("Listing stations:");
        console.log("");

        var i;
        for(i=0; i < list.length; i++) {
            console.log(list[i].abbr + ' | ' + list[i].name);
        }
    });
}

function get_schedule(station, date, callback) {
    bart.query('sched', 'stnsched', {
        orig: station,
        date: date
    }, function(err, xml, body) {
        if(err) {
            return callback(err, xml, body);
        }

        callback(null, xml, body);
    });
}

function parse_bart_time(time) {
    return moment(time, "h:mm A")
}

function find_first_toward(items, direct) {

    var dnames = directions[direct];
    if(!dnames) {
        return false;
    }

    var i, j;
    for(i=0; i < items.length; i++) {
        for(j=0; j < dnames.length; j++) {
            if(items[i].attr('trainHeadStation').value() == dnames[j]) {
                return parse_bart_time(items[i].attr('origTime').value());
            }
        }
    }

    return null;
}

function find_last_toward(items, direct) {
    return find_first_toward(items.reverse(), direct);
}

function get_last_bart(station, direct, callback) {

    get_schedule(station, "now", function(err, xml, body) {
        
        var items = xml.find('//item');
        var first = find_first_toward(items, direct);
        var last = find_last_toward(items, direct);
        if(!first || !last) {
            return callback("Could not find any scheduled BART trains matching the specified criteria");
        }

        // If current time is later than last BART then we must have gotten the schedule for the upcoming "bart day"
        if(moment().unix() > last.unix()) {
            return callback(null, null, first);
        }

        callback(null, last);

    });          
}

function printnext(station, m) {
    var now = moment();
    console.log("Next BART for " + station + " station departs in " + Math.abs(now.diff(m, 'hours')) + " and " + Math.abs(now.diff(m, 'minutes')) % 60  + " minutes [at " + m.format("h:mm a") + "]");
}

function printnext_seconds(m) {
    console.log(Math.abs(moment().diff(m, 'seconds')));
}

if(argv.l) {
    list_stations();
} else if((argv._.length == 3) && argv._[1].match(/to/i)) {
    var station_name = argv._[0];
    var direction = argv._[2];

    find_abbr(station_name, function(err, station) {
        if(err) {
            console.error("Error: " + err);
            process.exit(1);
        }
        get_last_bart(station.abbr, direction, function(err, last, next) {
            if(err) {
                console.error("Error: " + err);
                process.exit(1);
            }
            
            if(!last) {
                if(argv.n) {
                    printnext_seconds(next);
                } else {
                    console.log("The last BART has already sailed!");
                    printnext(station.name, next);
                }
            } else {
                if(argv.n) {
                    printnext_seconds(last);
                } else {
                    printnext(station.name, last);
                }
            }
        });
    });

} else {
    usage();
    process.exit(1);
}



