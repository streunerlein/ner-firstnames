
var HyphenGraph = Graph.extend({
  id: 'hyphengraph',

  render: function() {
    var margin = {top: 20, right: 50, bottom: 20, left: 50};
    var width = Math.min(960, this.$el.width()) - margin.left - margin.right;
    var height = this.$el.height() - margin.top - margin.bottom;

    var data = _.map(this.data, function(d) {
      return {
        year: d.year,
        names: d.names,
        hyphenPercentage: (_.filter(d.names, function(name) { return name.indexOf('-') !== -1; }).length / d.names.length)
      };
    });

    this.margin = margin;
    this.width = width;
    this.height = height;

    var formatPercent = d3.format(".0%");

    var x = d3.time.scale()
      .range([0, width])
      .domain(d3.extent(data, function(d) { return new Date(d.year); }));

    var y = d3.scale.linear()
      .range([height, 0])
      .domain(d3.extent(data, function(d) { return d.hyphenPercentage * 1.1; }));

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

    var yAxis = d3.svg.axis()
      .scale(y)
      .tickFormat(formatPercent)
      .orient("left");

    var area = d3.svg.area()
      .x(function(d) { return x(new Date(d.year)); })
      .y0(height)
      .y1(function(d) { return y(d.hyphenPercentage); });

    var svg = d3.select(this.el).append("svg")
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append("g")
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var clip = svg.append("clipPath")
        .attr("id", "hyphenclip")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

    var chartBody = svg.append("g")
        .attr("clip-path", "url(#hyphenclip)");

    var zoom = d3.behavior.zoom()
        .x(x)
        .scaleExtent([1, 1000])
        .on("zoom", zoomed);

    svg.call(zoom);
    
    function zoomed() {
      svg.select(".x-axis").call(xAxis);
      svg.select(".y-axis").call(yAxis);

      svg.select('.hyphenarea')
        .attr('d', area);
    }

    svg.append("g")
      .attr('class', 'x-axis axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

    svg.append("g")
      .attr('class', 'y-axis axis')
      .call(yAxis);

    chartBody.append("path")
      .datum(data)
      .attr("class", "hyphenarea area color-1")
      .attr("d", area);


  }
});