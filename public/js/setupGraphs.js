(function() {
  window.setupGraphs = function(config) {
    $.getJSON('./../data.min.json', function(data) {
      _.each(config, function(graph) {
        $(graph.target).each(function(ix, el) {
          var graphObj = new graph.view({
            data: data,
            el: el
          });

          graphObj.render();
        });
      });

      function replaceNumber(number, selector) {
        var $el = $(selector), str = number;

        if (_.isFunction(number)) {
          str = number();
        }

        if ($el.hasClass('nice-number')) {
          str = str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
        }

        $(selector).text(str);
      }

      var hasHyphen = function(name) { return name.indexOf('-') !== -1; };
      var uniqNames = _.uniq(_.flatten(_.pluck(data, 'names')));
      var uniqPureNames = _.reject(uniqNames, hasHyphen);
      var maxLength = _.max(_.map(uniqNames, 'length'));
      var minLength = _.min(_.map(uniqNames, 'length'));
      var maxPureLength = _.max(_.map(uniqPureNames, 'length'));
      var sortedByHyphenPercentage = _.sortBy(_.map(data, function(d) { return {year: d.year, names: d.names, hyphenPercentage: _.filter(d.names, hasHyphen).length / d.names.length}; }), 'hyphenPercentage');
      var groupByLength = _.groupBy(uniqNames, function(name) { return name.length; });
      var mostLength = _.filter(uniqNames, function(name) { return name.length < 8 && name.length > 4; });

      var numbers = {
        ".count_totalnames": uniqNames.length,
        ".count_yearlower": _.min(_.pluck(data, 'year')),
        ".count_yearupper": _.max(_.pluck(data, 'year')),
        ".count_highestlength": maxLength,
        ".count_lowestlength": minLength,
        ".count_highestpurelength": maxPureLength,
        ".count_yearmosthyphens": _.last(sortedByHyphenPercentage).year,
        ".count_yearmosthyphenspercentage": parseInt(_.last(sortedByHyphenPercentage).hyphenPercentage * 100, 10),
        ".count_mostlength": "5–7",
        ".example_highestlength": function() { return _.sample(_.filter(uniqNames, function(d) { return d.length == maxLength; })); },
        ".example_lowestlength": function() { return _.sample(_.filter(uniqNames, function(d) { return d.length == minLength; })); },
        ".example_highestpurelength": function() { return _.sample(_.filter(uniqPureNames, function(d) { return d.length == maxPureLength; })); },
        ".example_yearmosthyphens": function() { return _.sample(_.filter(_.last(sortedByHyphenPercentage).names, hasHyphen)); },
        ".example_mostlength": function() { return _.sample(mostLength); },
      };

      _.each(numbers, replaceNumber);
      setInterval(function() {
        _.each(numbers, replaceNumber);
      }, 2500);
    });
  };
})();