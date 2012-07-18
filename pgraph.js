(function () {
var pass = function () {};

window.PG = {
    EVENT: 1,
    INTERVAL: 2,
    data: {},
    graph: {}
};

PG.SEC = 1000;
PG.MIN = 60 * PG.SEC;
PG.HOUR = 60 * PG.MIN;
PG.DAY = 24 * PG.HOUR;
PG.YEAR = 365 * PG.DAY;

PG.data.People = function (data) {

    function convDateFunc(dates) {
        return function (assembly_no) {
            var date = dates[assembly_no];
            return (new Date(date)).getTime();
        }
    }

    // FIXME: 국회 기간 데이터 하드코딩 없애기
    var _startDates = {
            '18': '30 May 2008',
            '19': '30 May 2012'
        },
        _endDates = {
            '18': '29 May 2012',
            '19': '29 May 2016'
        },
        startDates = convDateFunc(_startDates),
        endDates = convDateFunc(_endDates),
        birthDate = (new Date(data.birthyear,
                             (data.birthmonth || 1) - 1,
                             data.birthday || 1)).getTime();

    // 국회 출마/당선
    // FIXME: event model 작성
    var events = d3.values(data.assembly).map(function (d) {
        var s = startDates(d.assembly_no),
            e = endDates(d.assembly_no);
        if (d.votenum) {
            return [
                PG.INTERVAL,
                s,
                e,
                d.assembly_no + '대 당선'
            ];
        } else {
            return [
                PG.EVENT,
                s,
                s,
                d.assembly_no + '대 낙선'
            ];
        }
    });

    // 출생일
    events.push([
        PG.EVENT,
        birthDate,
        birthDate,
        '출생'
    ]);

    return events;
};

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
    EVENT_R: 4,

    render: function (data) {
        var minX = d3.min(data, function (d) { return d[1]; }),
            maxX = d3.max(data, function (d) { return d[2]; }),
            events = data.filter(function (d) { return d[0] === PG.EVENT; }),
            intervals = data.filter(function (d) { return d[0] === PG.INTERVAL; });

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
                return that.xScale(d[1]) - 0.5;
            })
            .attr('y1', function (d) {
                return that.yScale(that.BAR_HEIGHT / 2);
            })
            .attr('x2', function (d) {
                return that.xScale(d[1]) - 0.5;
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
                return that.xScale(d[1]) - 0.5;
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
                return that.xScale(d[1]) - 0.5;
            })
            .attr('y', function (d) {
                return that.yScale(that.height / 2) + 0.5;
            })
            .attr('width', function (d) {
                return that.xScale(d[2]) - that.xScale(d[1]);
            })
            .attr('height', that.BAR_HEIGHT);
    },

    renderLabels: function (data) {
        var that = this;
        this.svg.selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .classed('event-label', true)
            .text(function (d) {
                return d[3];
            })
            .attr("x", function (d) {
                return (that.xScale(d[2]) + that.xScale(d[1])) / 2;
            })
            .attr("y", function (d) {
                if (d[0] == PG.EVENT) {
                    return that.yScale(0);
                } else if (d[0] == PG.INTERVAL) {
                    return that.yScale(that.height - that.BAR_HEIGHT / 2);
                }
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
