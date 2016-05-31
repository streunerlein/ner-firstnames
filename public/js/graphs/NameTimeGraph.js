
var NameTimeGraph = Graph.extend({
  id: 'nametimegraph',
  margin: null,
  width: null,
  height: null,

  render: function() {
    var margin = {top: 20, right: 50, bottom: 20, left: 50};
    var width = Math.max(960, this.$el.width()) - margin.left - margin.right;
    var height = this.$el.height() / 2 - margin.top - margin.bottom;
    var namesRankedByYear = _.chain(this.data)
      .map(function(entry) {
        return {
          year: entry.year,
          ranking: _.pluck(_.first(_.sortBy(_.map(entry.names, function(name) {
            return {
              name: name,
              count: _.filter(entry.people, function(person) { return _.contains(person, name); }).length
            };
          }), 'count').reverse(), 10), 'name')
        };
      }).value();

    var namesInTop10 = _.chain(namesRankedByYear)
      .pluck('ranking')
      .flatten()
      .uniq()
      .value();

    var data = _.chain(namesInTop10)
      .map(function(name) {
        return {
          name: name,
          ranks: _.chain(namesRankedByYear)
            .map(function(entry) {
              return {
                year: entry.year,
                rank: _.indexOf(entry.ranking, name) + 1
              }
            })
            .value()
        };
      })
      .value();

    var x = d3.time.scale()
      .range([0, width])
      .domain(d3.extent(namesRankedByYear, function(d) { return new Date(d.year); }));

    var yExtent = d3.extent(data, function(d) { return _.max(_.pluck(d.ranks, 'rank')); });
    yExtent[1] += 1;
    yExtent[0] = 0;

    var y = d3.scale.linear()
      .range([height, 0])
      .domain(yExtent);

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

    var svg = d3.select(this.el).append("svg")
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append("g")
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg.append('rect')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('fill', 'transparent');

    var clip = svg.append("clipPath")
        .attr("id", "clipnametime")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

    var chartBody = svg.append("g")
        .attr("clip-path", "url(#clipnametime)");

    svg.append("g")
      .attr('class', 'x-axis axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

    svg.append("g")
      .attr('class', 'y-axis axis')
      .call(yAxis);

    var color = d3.scale.linear()
      .domain([0, data.length])
      .range([0, 360]);

    window.data = data;

    var sumRank = function(memo, num){ return memo + (num > 0 ? 10 - num : 0); };

    var namesByAccRanks = _.sortBy(_.map(data, function(nameRanking, ix) {
      return {
        text: nameRanking.name,
        name: nameRanking.name,
        year: nameRanking.year,
        ranks: nameRanking.ranks,
        sum: _.reduce(_.pluck(nameRanking.ranks, 'rank'), sumRank, 0)
      };
    }), 'sum').reverse();

    var fontsize = d3.scale.pow().exponent(0.25)
      .domain([0, data.length])
      .range([90, 5]);

    d3.select(this.el).append('div')
      .selectAll('span')
        .data(namesByAccRanks)
      .enter()
        .append('span')
          .attr('class', 'namecloud')
          .attr('data-name', function(d) { return d.text; })
          .text(function(d) { return d.text; })
          .attr('style', function(d, i) {
            return 'font-size:' + fontsize(i) + 'px; color:' + d3.hsl(color(i), 0.6, 0.6) + ';';
          })
          .on('mouseover', function(d, i) {
            svg.selectAll('.circle[data-name="' + d.text + '"]')
              .transition()
              .duration(300)
              .attr('r', 5);
            svg.select('.line[data-name="' + d.text + '"]')
              .transition()
              .duration(300)
              .attr('opacity', 1);
          })
          .on('mouseout', function(d, i) {
            svg.selectAll('.circle[data-name="' + d.text + '"]')
              .transition()
              .duration(300)
              .attr('r', 0);
            svg.select('.line[data-name="' + d.text + '"]')
              .transition()
              .duration(300)
              .attr('opacity', 0);
          });

    _.each(data, function(namesByAccRanks, ix) {
      var line = d3.svg.line()
        .x(function(d) { return x(new Date(d.year)); })
        .y(function(d) { return y(d.rank); });

      var lineArea = chartBody.append("g")
        .attr('class', 'nameintime linearea');

      lineArea.append("path")
        .datum(namesByAccRanks.ranks)
        .attr('class', 'line')
        .attr('data-name', namesByAccRanks.name)
        .attr('stroke-width', '3px')
        .attr('opacity', 0)
        .attr('stroke', d3.hsl(color(ix), 0.5, 0.5))
        .attr('d', line);

      lineArea.selectAll("circle")
        .data(namesByAccRanks.ranks)
          .enter().append("circle")
          .attr('data-name', namesByAccRanks.name)
          .attr("class", "circle")
          .attr("r", 0)
          .attr("cx", function(d) { return x(new Date(d.year)); })
          .attr("cy", function(d) { return y(d.rank); })
          .transition()
          .duration(500)
          .attr('r', 1);
    });
  }
});