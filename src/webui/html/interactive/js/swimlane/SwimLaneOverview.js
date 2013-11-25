function SwimLaneOverview() {

	/* Default values for placement of the swimlane.  User should pass these */
	var x = 0;
	var y = 0;
	var width = 500;
	var height = 100;

	/* event callbacks */
	var callbacks = {
		"refresh": function(){}
	};

	// The time axis along the bottom of the viz
	var axis = d3.svg.axis().orient('bottom').ticks(10).tickSize(6, 0, 0);

	// The brush.  Ought to be overridden for useful behavior
	var brush = d3.svg.brush();

	// Determines vertical lane placements
	var lanegenerator = lane_per_thread_scale();

	/* Main rendering function */
	function overview(selection) {
		selection.each(function(data) {   
			// Add or remove the swimlane viz
			var mini = d3.select(this).selectAll(".mini").data([data]);
			var newmini = mini.enter().append("g").attr("class", "mini");
			newmini.append("g").attr("class", "lane-lines");
			newmini.append("g").attr("class", "lane-labels");
			newmini.append("g").attr("class", "spans");
			newmini.append("g").attr("class", "axis");
			newmini.append("rect").attr("class", "hitarea");
			newmini.append("g").attr("class", "brush").attr('clip-path', 'url(#clip)');
			mini.exit().remove();

			// Update the size of the swimlane
			mini.attr("transform", "translate(" + x + "," + y + ")");
			mini.attr("width", width);
			mini.attr("height", height);      

			// Get the thread data
			var threads = data.Threads();

			// Used to translate lane positions to co-ordinates
			var datalen = data.max - data.min;
			var rangemin = data.min - datalen / 10.0;
			var rangemax = data.max + datalen / 10.0;
			var norm = d3.scale.linear().domain([rangemin - data.min, rangemax - data.min]).range([0, width]);
			var sx = d3.scale.linear().domain([rangemin, rangemax]).range([0, width]);
			var sy = lanegenerator(data, height);

			// Add and remove new and old lanes
			var lanes = mini.select(".lane-lines").selectAll("line").data(threads);
			lanes.enter().append("line");
			lanes.attr('x1', 0).attr('x2', width)
			.attr('y1', function(d) { return d3.round(sy(d)) + 0.5; })
			.attr('y2', function(d) { return d3.round(sy(d)) + 0.5; });
			lanes.exit().remove();

			// Add and remove lane text
			var lanetext = mini.select(".lane-labels").selectAll("text").data(threads);
			lanetext.enter().append("text").text(function(d) { return d.ShortName(); }).attr('dy', '0.5ex').attr('text-anchor', 'end');
			lanetext.attr('x', -10).attr('y', function(d) { return sy(d) + sy.laneHeight() * 0.5; });
			lanetext.exit().remove();

			// Add and remove the spans
			var spans = mini.select(".spans").selectAll("path").data(threads);
			spans.enter().append('path');
			spans.attr('d', function(thread) { 
				var path = [], offset = .5 * sy.laneHeight() + 0.5;
				thread.Spans().forEach(function(span) { 
					path = path.concat(['M',sx(span.Start()),(sy(thread) + offset),'H',sx(span.End())]); 
				});
				return path.join(" ");
			});
			spans.exit().remove();

			// Add the the time axis
			mini.select(".axis").attr('transform','translate(0,'+height+')').call(axis.scale(norm));

			// Update the size of the brush
			mini.select(".brush").call(brush).selectAll('rect').attr('y', 1).attr('height', height - 1);
			mini.select(".brush rect.background").remove();

			// If there is no hitarea, now we create it
			mini.select(".hitarea").attr('width', width).attr('height', height)
			.attr('pointer-events', 'painted')
			.attr('visibility', 'hidden')
			.on('mouseup', function() {
				var point = sx.invert(d3.mouse(this)[0]);
				var halfExtent = (brush.extent()[1] - brush.extent()[0]) / 2;
				var start = point - halfExtent;
				var end = point + halfExtent;
				brush.extent([start,end]);
				callbacks["refresh"].call(this);
			});;
		});

	};

	overview.refresh = function(selection) {
		selection.each(function(data) {
			d3.select(this).selectAll(".mini").data([data]).select(".brush").call(brush);
		});
	};

	overview.on = function(evt, cb) {
		if (cb==null)
			return callbacks[evt];
		callbacks[evt] = cb;
		return overview;
	};

	overview.brush = function(_) { if (!arguments.length) return brush; brush = _; return overview; };
	overview.x = function(_) { if (!arguments.length) return x; x = _; return overview; };
	overview.y = function(_) { if (!arguments.length) return y; y = _; return overview; };
	overview.width = function(_) { if (!arguments.length) return width; width = _; return overview; };
	overview.height = function(_) { if (!arguments.length) return height; height = _; return overview; };
	overview.lanegenerator = function(_) { if (!arguments.length) return lanegenerator; lanegenerator = _; return overview; };


	return overview;    
}