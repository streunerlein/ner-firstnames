
var glob = require('glob'),
    fs = require('fs'),
    async = require('async'),
    _ = require('underscore');

var config = require('./config');

if (process.argv.length < 3) {
  console.log("Please specify which configuration to use:", Object.keys(config));
  process.exit();
}

config = config[process.argv[2]];

var stopNames = config.stopNames;

glob(config.files, function(err, matches) {
  if (err) {
    console.log(err);
    return;
  }

  async.map(matches, processFile, function(err, processedFiles) {
    var years = _.pluck(processedFiles, 'year');

    var byYears = _.map(years, function(year) {
      var files = _.where(processedFiles, {'year': year});

      return {
        year: year,
        names: _.uniq(_.flatten(_.pluck(files, 'names'))),
        people: _.uniq(_.flatten(_.pluck(files, 'people')))
      };
    });

    console.log("Read", processedFiles.length, "files");
    console.log(byYears);
  });
});

function processFile(file, cb) {
  async.waterfall([
    function(cb) {
      fs.readFile(file, 'utf8', function(err, content) {
        if(err) {
          cb(err, null);
        } else {
          var year = file.match(/[0-9]{4}/gi)[0];

          cb(null, {year: year}, content);
        }
      });
    },
    extractPeople,
    extractNames
  ], cb);
}

function extractPeople(obj, content, cb) {
  var regexp = /<firstname>([^<]+)<\/firstname>/igm;
  var people = [];

  var match = regexp.exec(content);
  while (match !== null) {
    people.push(match[1]);
    match = regexp.exec(content);
  }

  people = _.chain(people)
    .map(splitVariants)
    .map(function(variants) {
      return _.chain(variants)
        .map(splitTokens)
        .flatten()
        .uniq()
        .reject(isStopName)
        .reject(hasDot)
        .value();
    })
    .value();


  obj.people = people;

  cb(null, obj, people);
}

function extractNames(obj, people, cb) {
  var names = _.chain(people)
    .flatten()
    .uniq()
    .value();

  obj.names = names;

  cb(null, obj, names);
}

function hasHyphen(str) { return str.indexOf('-') !== -1; }
function sum(memo, num){ return memo + num; }
function splitVariants(name) { return name.split("|"); }
function splitTokens(name) { return name.split(" "); }
function isStopName(name) { return stopNames.indexOf(name.toLowerCase()) !== -1; }
function hasDot(name) { return name.indexOf(".") !== -1; }