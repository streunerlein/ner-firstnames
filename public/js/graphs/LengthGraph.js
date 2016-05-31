
var LengthGraph = Graph.extend({
  id: 'lengthgraph',

  render: function() {
    var margin = {top: 50, right: 50, bottom: 20, left: 50};
    var width = Math.min(960, this.$el.width()) - margin.left - margin.right;
    var height = this.$el.height() - margin.top - margin.bottom;
    var data = this.data;

    this.margin = margin;
    this.width = width;
    this.height = height;

    var x = d3.time.scale()
      .range([0, width])
      .domain(d3.extent(data, function(d) { return new Date(d.year); }));

    var formatPercent = d3.format(".0%");

    var y = d3.scale.linear()
      .range([height, 0]);

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(formatPercent);

    var area = d3.svg.area()
      .x(function(d) { return x(new Date(d.year)); })
      .y0(function(d) { return y(d.y0); })
      .y1(function(d) { return y(d.y0 + d.y); });

    var stack = d3.layout.stack()
          .values(function(d) { return d.values; });

    var color = d3.scale.category20c()
      .domain(["Kurz (< 5)", "Mittel (5-7)", "Lang (8-10)", "Riesig (11-13)", "Gigantisch (> 13)"]);

    var lengthsData = stack(_.map(color.domain(), function(name, ix) {
      var set = {name: name};
      var lengthFilter;

      switch (ix) {
        case 0:
          lengthFilter = function(name) { return (name.length < 5); };
          break;
        case 1:
          lengthFilter = function(name) { return (name.length > 4 && name.length < 8); };
          break;
        case 2:
          lengthFilter = function(name) { return (name.length > 7 && name.length < 11); };
          break;
        case 3:
          lengthFilter = function(name) { return (name.length > 10 && name.length < 14); };
          break;
        default:
          lengthFilter = function(name) { return (name.length > 13); };
          break;
      }

      set.values = _.map(data, function(d) {
        return {
          year: d.year,
          y: _.filter(d.names, lengthFilter).length / d.names.length || 0
        };
      });

      return set;
    }));

    var svg = d3.select(this.el).append("svg")
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append("g")
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var clip = svg.append("clipPath")
        .attr("id", "lengthclip")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

    var chartBody = svg.append("g")
        .attr("clip-path", "url(#lengthclip)");

    var zoom = d3.behavior.zoom()
        .x(x)
        .y(y)
        .scaleExtent([1, 1000])
        .on("zoom", zoomed);

    svg.call(zoom);
    
    function zoomed() {
      svg.select(".x-axis").call(xAxis);
      svg.select(".y-axis").call(yAxis);

      svg.selectAll('.lengths .area')
        .attr('d', function(d) { return area(d.values); });
    }

    svg.append("g")
      .attr('class', 'x-axis axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

    svg.append("g")
      .attr('class', 'y-axis axis')
      .call(yAxis);

    var lengths = chartBody.selectAll(".lengths")
        .data(lengthsData)
      .enter().append("g")
        .attr("class", "lengths");

    lengths.append("path")
        .attr("class", "area")
        .attr("d", function(d) { return area(d.values); })
        .style("fill", function(d) { return color(d.name); });

    var legends = svg.append('g')
      .attr('class', 'legends');
    var legendWidth = -10;

    _.each(color.domain(), function(name) {
      var legend = legends.append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate(' + (legendWidth + 10) + ', ' + (-margin.top+10) + ')');

      legend.append('rect')
        .attr('fill', color(name))
        .attr('y', 0)
        .attr('x', 0)
        .attr('width', 25)
        .attr('height', 15);

      legend.append('text')
        .attr('text-anchor', 'left')
        .attr('x', 29)
        .attr('y', 8)
        .attr('dy', '.35em')
        .text(name);

        legendWidth = legends[0][0].getBBox().width;
    });

    legends.attr('transform', 'translate(' + (width / 2 - legendWidth /2) + ', 0)');
  }
});