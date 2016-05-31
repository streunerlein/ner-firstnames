
var NameGraph = Graph.extend({
  id: 'namegraph',
  currentAxis: 0,
  margin: null,
  width: null,
  height: null,
  svg: null,

  render: function() {
    var margin = {top: 20, right: 50, bottom: 20, left: 50};
    var width = Math.min(960, this.$el.width()) - margin.left - margin.right;
    var height = this.$el.height() - margin.top - margin.bottom;
    var data = this.data;

    this.margin = margin;
    this.width = width;
    this.height = height;

    var x = d3.time.scale()
      .range([0, width])
      .domain(d3.extent(data, function(d) { return new Date(d.year); }));

    var y = d3.scale.linear()
      .range([height, 0])
      .domain(d3.extent(data, function(d) { return d.names.length * 1.1; }));
    
    var y1 = d3.scale.linear()
      .range([height, 0])
      .domain([0, 1]);

    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
        return "<strong><span class='value'>" + d.year + "</span></strong>" +
          "<br /><small><strong>Personen:</strong> <span class='value'>" + d.people.length + "</span></small>" + 
          "<br /><small><strong>Namen:</strong> <span class='value'>" + d.names.length + "</span></small>" +
          "<br /><small><strong>Ratio:</strong> <span class='value'>" + (d.names.length / d.people.length) + "</span></small>";
      });

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

    var y1Axis = d3.svg.axis()
      .scale(y1)
      .orient("right");

    var ratioLine = d3.svg.line()
      .x(function(d) { return x(new Date(d.year)); })
      .y(function(d) { return y1(d.names.length / d.people.length); });

    var zeroLine = d3.svg.line()
      .x(function(d) { return x(new Date(d.year)); })
      .y(function() { return y(0); });

    var svg = d3.select(this.el).append("svg")
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append("g")
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg.append('rect')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('fill', 'transparent');

    svg.call(tip);

    var clip = svg.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

    var chartBody = svg.append("g")
        .attr("clip-path", "url(#clip)");

    var zoom = d3.behavior.zoom()
        .x(x)
        .scaleExtent([1, 1000])
        .on("zoom", zoomed);

    svg.call(zoom);
    
    function zoomed() {
      svg.select(".x-axis").call(xAxis);
      svg.select(".y-axis").call(yAxis);

      svg.select('.linearea.names path').attr('d', nameLine);
      svg.selectAll('.linearea.names .circle')
        .attr("cx", function(d) { return x(new Date(d.year)); })
        .attr("cy", function(d) { return y(d.names.length); });

      svg.select('.linearea.people path').attr('d', peopleLine);
      svg.selectAll('.linearea.people .circle')
        .attr("cx", function(d) { return x(new Date(d.year)); })
        .attr("cy", function(d) { return y(d.people.length); });

      svg.select('.linearea.ratio path').attr('d', ratioLine);
      svg.selectAll('.linearea.ratio .circle')
        .attr("cx", function(d) { return x(new Date(d.year)); })
        .attr("cy", function(d) { return y1(d.names.length / d.people.length); });
    }

    svg.append("g")
      .attr('class', 'x-axis axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

    svg.append("g")
      .attr('class', 'y-axis axis')
      .call(yAxis);

    var showGraph = 0;
    var nameLine = null, peopleLine = null;

    var toggleChart = function(chart) {
      switch(chart) {
        case 'name':
          var names = chartBody.select('.names');

          if (names.empty()) {
            // show name graph
            nameLine = d3.svg.line()
              .x(function(d) { return x(new Date(d.year)); })
              .y(function(d) { return y(d.names.length); });

            names = chartBody.append("g")
              .attr('class', 'names linearea');

            names.append("path")
                .datum(data)
                .attr("class", "line color-1")
                .attr("d", zeroLine)
                .transition()
                .delay(300)
                .duration(1000)
                .attr("d", nameLine);

            names.selectAll("circle")
              .data(data)
                .enter().append("circle")
                .attr("class", "circle color-1")
                .attr("r", 0)
                .attr("cx", function(d) { return x(new Date(d.year)); })
                .attr("cy", function(d) { return y(d.names.length); })
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
                .transition()
                .duration(500)
                .attr('r', 2);
          }

          var nameLegend = svg.select('.namelegend');
          var isInactive = nameLegend.classed('inactive');

          names.transition().duration(300).attr('opacity', isInactive + 0);
          nameLegend.classed('inactive', !isInactive);

          break;

        case 'people':
          var people = chartBody.select('.people');
          if (people.empty()) {

            // show people graph and adjust axis
            y.domain(d3.extent(data, function(d) { return d.people.length * 1.1; }));

            svg.select(".y-axis")
              .transition()
              .duration(750)
              .call(yAxis);

            // update nameline/circle
            svg.selectAll('.names circle')
              .transition()
              .duration(750)
              .attr("cy", function(d) { return y(d.names.length); });
            svg.select('.names .line')
              .transition()
              .duration(750)
              .attr('d', nameLine);

            peopleLine = d3.svg.line()
              .x(function(d) { return x(new Date(d.year)); })
              .y(function(d) { return y(d.people.length); });

            people = chartBody.append("g")
              .attr('class', 'people linearea');

            people.append("path")
                .datum(data)
                .attr("class", "line color-2")
                .attr("d", zeroLine)
                .transition()
                .delay(300)
                .duration(1000)
                .attr("d", peopleLine);

            people.selectAll("circle")
              .data(data)
                .enter().append("circle")
                .attr("class", "circle color-2")
                .attr("r", 0)
                .attr("cx", function(d) { return x(new Date(d.year)); })
                .attr("cy", function(d) { return y(d.people.length); })
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
                .transition()
                .duration(500)
                .attr('r', 2);
          }

          var peopleLegend = svg.select('.peoplelegend');
          var isInactive = peopleLegend.classed('inactive');

          people.transition().duration(300).attr('opacity', isInactive + 0);
          peopleLegend.classed('inactive', !isInactive);

          break;

        case 'ratio':
          var ratio = chartBody.select('.ratio');

          if (ratio.empty()) {
            // show ratio graph and add second axis
            svg.append("g")
              .attr('class', 'y1-axis axis')
              .attr('fill', 'purple')
              .attr('transform', 'translate(' + width + ', 0)')
              .call(y1Axis);

            ratio = chartBody.append("g")
              .attr('class', 'ratio linearea');

            ratio.append("path")
                .datum(data)
                .attr("class", "line color-3")
                .attr("d", zeroLine)
                .transition()
                .delay(300)
                .duration(1000)
                .attr("d", ratioLine);

            ratio.selectAll("circle")
              .data(data)
                .enter().append("circle")
                .attr("class", "circle color-3")
                .attr("r", 0)
                .attr("cx", function(d) { return x(new Date(d.year)); })
                .attr("cy", function(d) { return y1(d.names.length / d.people.length); })
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
                .transition()
                .duration(500)
                .attr('r', 2);
          }

          var ratioLegend = svg.select('.ratiolegend');
          var isInactive = ratioLegend.classed('inactive');

          ratio.transition().duration(300).attr('opacity', isInactive + 0);
          ratioLegend.classed('inactive', !isInactive);

          break;
      }
    };

    var legends = svg.append('g')
      .attr('class', 'legends');
    var legendWidth = 0;

    var nameLegend = legends.append('g')
      .attr('class', 'legend namelegend inactive')
      .on('click', function() {
        toggleChart('name');
      });
      
    nameLegend.append('rect')
      .attr('class', 'color-1')
      .attr('y', 0)
      .attr('x', 0)
      .attr('width', 25)
      .attr('height', 15);

    nameLegend.append('text')
      .attr('text-anchor', 'left')
      .attr('x', 29)
      .attr('y', 8)
      .attr('dy', '.35em')
      .text('Namen');

    legendWidth = legends[0][0].getBBox().width;
    var peopleLegend = legends.append('g')
      .attr('class', 'legend peoplelegend inactive')
      .attr('transform', 'translate(' + (legendWidth + 10) + ', 0)')
      .on('click', function() {
        toggleChart('people');
      });
      
    peopleLegend.append('rect')
      .attr('class', 'color-2')
      .attr('y', 0)
      .attr('x', 0)
      .attr('width', 25)
      .attr('height', 15);

    peopleLegend.append('text')
      .attr('text-anchor', 'left')
      .attr('x', 29)
      .attr('y', 8)
      .attr('dy', '.35em')
      .text('Personen');

    legendWidth = legends[0][0].getBBox().width;
    var ratioLegend = legends.append('g')
      .attr('class', 'legend ratiolegend inactive')
      .attr('transform', 'translate(' + (legendWidth + 10) + ', 0)')
      .on('click', function() {
        toggleChart('ratio');
      });
      
    ratioLegend.append('rect')
      .attr('class', 'color-3')
      .attr('y', 0)
      .attr('x', 0)
      .attr('width', 25)
      .attr('height', 15);

    ratioLegend.append('text')
      .attr('text-anchor', 'left')
      .attr('x', 29)
      .attr('y', 8)
      .attr('dy', '.35em')
      .text('P-N Ratio');

    legendWidth = legends[0][0].getBBox().width;
    legends.attr('transform', 'translate(' + (width / 2 - legendWidth /2) + ', 0)');

    toggleChart('name');
  }
});