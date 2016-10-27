function drawChord(chordConfig) {
    var  WIDTH = chordConfig.width;
    var HEIGHT = chordConfig.height;
    var chordData = chordConfig.chordData;

    var container = d3.select(chordConfig.bindto);
    var outerRadius = Math.min(WIDTH, HEIGHT) * 0.5 - 100;
    var innerRadius = outerRadius - 30;

    var formatValue = d3.formatPrefix(",.0", 1e3);

    var divTooltip = container.append("div")
        .attr("class", "chart-tooltip hidden")
        ;

    var divLock = container.append("i")
        .attr("aria-hidden", "true")
        ;
    function toggleLock(show) {
        if(show) divLock.attr("class", "fa fa-lock chord-lock fa-2x");
        else     divLock.attr("class", "fa fa-lock chord-lock fa-2x hidden");
    }
    toggleLock(false);

    var chord = d3.chord()
        .padAngle(0.03)
        .sortSubgroups(d3.descending);

    var arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    var ribbon = d3.ribbon()
        .radius(innerRadius);

    var svg = container
        .append("svg")
        .attr("width", WIDTH)
        .attr("height", HEIGHT)
        ;

    var g = svg
        .append("g")
        .attr("transform", "translate(" + WIDTH / 2 + "," + HEIGHT / 2 + ")")
        .datum(chord(chordData.matrix));

    // ribbons
    g.append("g")
        .attr("class", "ribbons")
        .selectAll("path")
        .data(function(chords) { return chords; })
        .enter().append("path")
        .attr("class", "ribbon")
        .attr("d", ribbon)
        .style("fill", function(d) { return colorByIdx(d.source.index); })
        .style("stroke", function(d) { return d3.rgb(colorByIdx(d.source.index)).darker(); })
        .on("mouseover", mouseHoverHandler(true))
        .on("mouseout",  mouseHoverHandler(false))
        .on("click", toggleMouseSelection);
        ;

    // arcs
    var group = g.append("g")
        .attr("class", "groups")
        .selectAll("g")
        .data(function(chords) { return chords.groups; })
        .enter()
        .append("g")
        .attr("class", "group");

    group.append("path")
        .style("fill", function(d) { return colorByIdx(d.index); })
        .style("stroke", function(d) { return d3.rgb(colorByIdx(d.index)).darker(); })
        .attr("d", arc)
        .on("mouseover", mouseHoverHandler(true))
        .on("mouseout",  mouseHoverHandler(false))
        .on("click", toggleMouseSelection);
        ;

    // Returns an array of tick angles and values for a given group and step.
    var TICK_ANGLE = 2 * Math.PI / 120;
    function groupTicks(d) {
        var k = d.endAngle - d.startAngle;
        if(k < TICK_ANGLE * 2) return [];
        else return d3.range(0, k, TICK_ANGLE).map(function(tickDAngle, i) {
            return {idx: i, value: tickDAngle * d.value / k, angle: d.startAngle + tickDAngle};
        });
    }

    var groupTick = group.selectAll(".group-tick")
        .data(groupTicks)
        .enter().append("g")
        .attr("class", "group-tick")
        .attr("transform", function(d) { return "rotate(" + (d.angle * 180 / Math.PI - 90) + ") translate(" + outerRadius + ",0)"; });

    groupTick.append("line")
        .attr("x2", 6);

    groupTick
        .filter(function(d) { return d.idx % 5 === 0; })
        .append("text")
        .attr("x", 8)
        .attr("dy", ".35em")
        .attr("class", "group-tick-label")
        .attr("transform",    function(d) { return d.angle > Math.PI ? "rotate(180) translate(-16)" : null; })
        .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
        .text(function(d) { return formatValue(d.value); });

    group.append("svg:text")
        .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("dy", ".35em")
        .attr("class", "chord-label")
        .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
        .attr("transform",   function(d) {
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" +
                "translate(" + (outerRadius + 35) + ")" +
                (d.angle > Math.PI ? "rotate(180)" : "");
        })
        .style("cursor", "pointer")
        .text(function(d) { return chordData.idx[d.index].elem; })
        .on("mouseover",  mouseHoverHandler(true))
        .on("mouseout",   mouseHoverHandler(false))
        .on("click", toggleMouseSelection);

    var selectedPiece = undefined;
    function toggleMouseSelection(data, i) {
        d3.event.stopPropagation();
        var isSelecting = _.isUndefined(selectedPiece); // opposite to "is unselecting (current selection)"

        if(isSelecting) {
            toggleLock(true);
            selectedPiece = {data: data, i: i};
        } else { // unselectiong
            toggleLock(false);
            var pieceToUnselect = selectedPiece;
            selectedPiece = undefined;
            mouseHoverHandler(false)(pieceToUnselect.data, pieceToUnselect.i);
        }
    }

    $(window).click(toggleMouseUnSelection);
    function toggleMouseUnSelection() {
        if(!_.isUndefined(selectedPiece)) {
            toggleLock(false);
            var pieceToUnselect = selectedPiece;
            selectedPiece = undefined;
            mouseHoverHandler(false)(pieceToUnselect.data, pieceToUnselect.i);
        }
    }

    // Returns an event handler for fading a given chord group.
    function mouseHoverHandler(isFocus) {
        var opacityOfUnrelated = isFocus ? 0.1 : 1

        function mouseHoverHandlerGeneric(data, i) {
            if(!_.isUndefined(selectedPiece)) return; // current selection fixes focus

            var isRibbon = _.has(data, 'source') && _.has(data, 'target'); // opposite to "is arc"
            if(isRibbon) {
                        tooltip_forRibbon(data, i);
                           fade_forRibbon(data, i);
                toggleHistogram_forRibbon(data, i);
            } else {
                        tooltip_forArc(data, i);
                           fade_forArc(data, i);
                toggleHistogram_forArc(data, i);
            }
        }

        function tooltip_forRibbon(d, i) {
            var sourceElem = chordData.idx[d.source.index];
            var targetElem = chordData.idx[d.target.index];
            var sourceElemStr = sourceElem.dim + ': ' + sourceElem.elem;
            var targetElemStr = targetElem.dim + ': ' + targetElem.elem;
            var      totalStr =     scoreField + ': ' + chordData.matrix[d.source.index][d.target.index];
            var tooltipHtml = sourceElemStr + '<br/>' + targetElemStr + '<br/>' + totalStr;

            var clazz = 'chart-tooltip';
            if(!isFocus) clazz += ' hidden';

            divTooltip.transition()
                .duration(50)
                .attr('class', clazz);

            if(isFocus) {
                divTooltip	.html(tooltipHtml)
                    .style("left", (d3.event.pageX)      + "px")
                    .style("top",  (d3.event.pageY - 28) + "px");
            }
        }

        function tooltip_forArc(d, i) {
            var  elem    = chordData.idx[d.index];
            var  elemStr = elem.dim + ': ' + elem.elem;
            var totalStr =     scoreField + ': ' + elem.total;
            var tooltipHtml = elemStr + '<br/>' + totalStr;

            var clazz = 'chart-tooltip';
            if(!isFocus) clazz += ' hidden';

            divTooltip.transition()
                .duration(50)
                .attr('class', clazz);
            if(isFocus) {
                divTooltip	.html(tooltipHtml)
                    .style("left", (d3.event.pageX)      + "px")
                    .style("top",  (d3.event.pageY - 28) + "px");
            }
        }


        function fade_forRibbon(ribbon, i) {
            //debugger;

            // fade unrelated ribbons
            svg.selectAll(".ribbon")
                .filter(function(d) {
                    return d.source.index !== ribbon.source.index || d.target.index != ribbon.target.index;
                })
                .transition()
                .style("opacity", opacityOfUnrelated);

            // fade arcs, which are not among related
            svg.selectAll('.group')
                .filter(function(d) {
                    if(ribbon.source.index === d.index || ribbon.target.index === d.index) return false;
                    else return true;
                })
                .transition()
                .style("opacity", opacityOfUnrelated);
        }

        function fade_forArc(g, i) {
            //debugger;
            // fade unrelated ribbons
            svg.selectAll(".ribbon")
                .filter(function(d) {
                    return d.source.index != i && d.target.index != i;
                })
                .transition()
                .style("opacity", opacityOfUnrelated);

            var groups = [];

            // get related arcs
            svg.selectAll(".ribbon")
                .filter(function(d) {
                    if (d.source.index == i) {
                        groups.push(d.target.index);
                    }
                    if (d.target.index == i) {
                        groups.push(d.source.index);
                    }
                });

            groups.push(i);

            var length = groups.length;

            // fade arcs, which are not among related
            svg.selectAll('.group')
                .filter(function(d) {
                    for (var i = 0; i < length; i++) {
                        if(groups[i] == d.index ) return false;
                    }
                    return true;
                })
                .transition()
                .style("opacity", opacityOfUnrelated);
        };

        function toggleHistogram_forRibbon(data, i) {
            var sourceElem = chordData.idx[data.source.index];
            var targetElem = chordData.idx[data.target.index];
            var partitionDim = undefined;
            var lineColors = [colorByIdx(targetElem.index)];

            var subChartColumns = prepareSubChartColumns(businessData, sourceElem, targetElem, undefined, scoreField);
            var subChartCfg     = prepareSubChartConfig(chordConfig.bindto_subchart, sourceElem.elem + ' > ' + targetElem.elem, 'timestamp', scoreField, subChartColumns, 'timestamp', scoreField, partitionDim, lineColors);
            drawChart(subChartCfg);
        }
        function toggleHistogram_forArc(data, i) {
            var elem = chordData.idx[data.index];
            var partitionDim = otherThanDim(elem.dim);

            var subChartColumns = prepareSubChartColumns(businessData, elem, undefined, partitionDim, scoreField);

            var lineColors = _.map(subChartColumns.raw, function(lineRows) {
                var categoryIdx = findInIdx(chordData.idx, partitionDim, lineRows[0][partitionDim]);
                return colorByIdx(categoryIdx);
            });

            var subChartCfg = prepareSubChartConfig(
                chordConfig.bindto_subchart,
                elem.elem,
                'timestamp',
                scoreField,
                subChartColumns,
                'timestamp',
                scoreField,
                partitionDim,
                lineColors
            );
            drawChart(subChartCfg);
        }

        return mouseHoverHandlerGeneric;
    };
}
