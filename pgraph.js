(function () {
var pass = function () {};

window.PG = {
    data: {},
    graph: {}
};

PG.SEC = 1000;
PG.MIN = 60 * PG.SEC;
PG.HOUR = 60 * PG.MIN;
PG.DAY = 24 * PG.HOUR;
PG.YEAR = 365 * PG.DAY;

PG.graph.Timeline = function(target, width, height) {
    return new Timeline(target, width, height);
};


function Timeline(target, width, height) {
    this.width = width;
    this.height = height;
    this.svg = d3.select(target).append('svg')
                .attr('width', width)
                .attr('height', height);
    return this;
};

Timeline.prototype = {
    PADDING: 20,
    BAR_HEIGHT: 30,
    LINE_HEIGHT: 12,
    EVENT_R: 4,

    isEvent: function (e) {
        return e[0] === e[1];
    },

    isInterval: function (e) {
        return e[0] !== e[1];
    },

    render: function (data) {
        data = d3.values(data).map(function (d) {
            return [new Date(d[0]).getTime(), new Date(d[1]).getTime(), d[2]];
        });
        var minX = d3.min(data, function (d) { return d[0]; }),
            maxX = d3.max(data, function (d) { return d[1]; }),
            events = data.filter(this.isEvent),
            intervals = data.filter(this.isInterval);

        this.xScale = d3.scale.linear().nice()
                        .domain([minX - PG.YEAR, maxX + PG.YEAR])
                        .rangeRound([this.PADDING, this.width - this.PADDING]),
        this.yScale = d3.scale.linear().nice()
                        .domain([0, this.height])
                        .rangeRound([this.PADDING, this.height - this.PADDING]);

        this.renderIntervals(intervals);
        this.renderEvents(events);
        this.renderLabels(data);
        this.renderAxis();
    },

    renderEvents: function (data) {
        var that = this;
        this.svg.selectAll('line')
            .data(data)
            .enter()
            .append('line')
            .classed('event', true)
            .attr('x1', function (d) {
                return that.xScale(d[0]) - 0.5;
            })
            .attr('y1', function (d) {
                return that.yScale(that.BAR_HEIGHT / 2);
            })
            .attr('x2', function (d) {
                return that.xScale(d[0]) - 0.5;
            })
            .attr('y2', function (d) {
                return that.yScale(that.height);
            });

        // Events
        this.svg.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .classed('event', true)
            .attr('cx', function (d) {
                return that.xScale(d[0]) - 0.5;
            })
            .attr('cy', function (d) {
                return that.yScale(that.height) - 0.5;
            })
            .attr('r', that.EVENT_R)
            .attr('stroke-width', 1);
    },

    renderIntervals: function (data) {
        var that = this;
        this.svg.selectAll('rect')
            .data(data)
            .enter()
            .append('rect')
            .classed('interval', true)
            .attr('x', function (d) {
                return that.xScale(d[0]) - 0.5;
            })
            .attr('y', function (d) {
                return that.yScale(that.height / 2) + 0.5;
            })
            .attr('width', function (d) {
                return that.xScale(d[1]) - that.xScale(d[0]);
            })
            .attr('height', that.BAR_HEIGHT);
    },

    renderLabels: function (data) {
        var that = this;

        var splitted = [];
        $.each(data, function (i, d) {
            var tokens = d[2].split('\n');
            $.each(tokens, function (i, token) {
                splitted.push([d[0], d[1], token, i * that.LINE_HEIGHT]);
            });
        });

        this.svg.selectAll("text")
            .data(splitted)
            .enter()
            .append("text")
            .classed('event-label', true)
            .text(function (d) {
                return d[2];
            })
            .attr("x", function (d) {
                return (that.xScale(d[1]) + that.xScale(d[0])) / 2;
            })
            .attr("y", function (d) {
                var base = 0;
                if (that.isEvent(d)) {
                    base = that.yScale(0);
                } else if (that.isInterval(d)) {
                    base = that.yScale(that.height - that.BAR_HEIGHT);
                }
                return base + d[3];
            })
            .style('text-anchor', 'middle');
    },

    renderAxis: function () {
        var that = this;
        this.svg.append("g")
            .classed('axis', true)
            .attr('transform', 'translate(0, ' + (that.height - that.PADDING) + ')')
            .call(d3.svg.axis()
                        .scale(that.xScale)
                        .orient("bottom")
                        .tickFormat(function (d) {
                            return d3.time.format('%Y-%m')(new Date(d));
                        })
                        .ticks(7))
            .call(function (sel) {;
                sel.selectAll('path, line')
                   .style('fill', 'none')
                   .style('stroke', 'black')
                   .style('shape-rendering', 'crispEdges');
            });
    }
};
}());
