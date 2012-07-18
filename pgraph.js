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

PG.graph.Timeline = function(target, width, height, options) {
    return new Timeline(target, width, height, options);
};


function Timeline(target, width, height, options) {
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

    render: function (data, options) {
        var that = this,
            events = data.filter(function (d) { return d[0] === PG.EVENT; }),
            intervals = data.filter(function (d) { return d[0] === PG.INTERVAL; }),
            xScale = d3.scale.linear().nice()
                        .domain([d3.min(data, function (d) { return d[1]; }) - PG.YEAR,
                                 d3.max(data, function (d) { return d[2]; }) + PG.YEAR])
                        .rangeRound([that.PADDING, this.width - that.PADDING]),
            yScale = d3.scale.linear().nice()
                        .domain([0, this.height])
                        .rangeRound([that.PADDING, this.height - that.PADDING]);

        // Intervals
        this.svg.selectAll('rect')
            .data(intervals)
            .enter()
            .append('rect')
            .classed('interval', true)
            .attr('x', function (d) {
                return xScale(d[1]) - 0.5;
            })
            .attr('y', function (d) {
                return yScale(that.height / 2) + 0.5;
            })
            .attr('width', function (d) {
                return xScale(d[2]) - xScale(d[1]);
            })
            .attr('height', that.BAR_HEIGHT);

        // Events
        this.svg.selectAll('line')
            .data(events)
            .enter()
            .append('line')
            .classed('event', true)
            .attr('x1', function (d) {
                return xScale(d[1]) - 0.5;
            })
            .attr('y1', function (d) {
                return yScale(that.BAR_HEIGHT / 2);
            })
            .attr('x2', function (d) {
                return xScale(d[1]) - 0.5;
            })
            .attr('y2', function (d) {
                return yScale(that.height);
            });

        // Events
        this.svg.selectAll('circle')
            .data(events)
            .enter()
            .append('circle')
            .classed('event', true)
            .attr('cx', function (d) {
                return xScale(d[1]) - 0.5;
            })
            .attr('cy', function (d) {
                return yScale(that.height) - 0.5;
            })
            .attr('r', that.EVENT_R)
            .attr('stroke-width', 1);

        // Labels
        this.svg.selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .classed('event-label', true)
            .text(function (d) {
                return d[3];
            })
            .attr("x", function (d) {
                return (xScale(d[2]) + xScale(d[1])) / 2;
            })
            .attr("y", function (d) {
                if (d[0] == PG.EVENT) {
                    return yScale(0);
                } else if (d[0] == PG.INTERVAL) {
                    return yScale(that.height - that.BAR_HEIGHT / 2);
                }
            })
            .style('text-anchor', 'middle');

        this.svg.append("g")
            .classed('axis', true)
            .attr('transform', 'translate(0, ' + (that.height - that.PADDING) + ')')
            .call(d3.svg.axis()
                        .scale(xScale)
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
