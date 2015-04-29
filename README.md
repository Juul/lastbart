
WARNING: Untested. Use at your own risk.

This is a command line utility to show when the last bart is leaving from a specific station.

# Usage

```
./lastbart.js from_station_name to direction

  -l: List all stations
  -h / --help: Show usage information.

Station name and direction can be the complete or partial.
Direction must be one of:
  sf
  richmond
  fremont
  pittsburg
```

## Example

```
./lastbart.js mac to sf
The last BART has already sailed!
Next BART for MacArthur station departs in 1 and 1 minutes [at 4:31 am]
```

# ToDo

* Test this just before and after last bart leaves
* Support arbitrary stations as directions
* If the next bart is the last bart then use real time scheduling API to get a better prediction of time
** http://api.bart.gov/docs/etd/etd.aspx

# License

License is GPLv3.

Copyright 2015 Marc Juul.

