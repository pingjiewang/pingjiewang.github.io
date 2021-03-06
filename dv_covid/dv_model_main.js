function DvModel() {
    
    //US level charts
    this.modelUsChart = new UsChartModel();
    //state level charts
    this.modelStateChart = new StateChartModel();
}

// DvModel.prototype.init = function() {
// };

//------------- StateChartModel
function StateChartModel() {
    var initialSelectedStates=["Texas", "New York","Maryland"];
    this.state_names_selected_set = new Set(initialSelectedStates);
    this.init()
}

StateChartModel.prototype.init = function() {
    this.SELECTOR_SVG = '#container3 .graph svg';
    this.SELECTOR_TOOLTIP = '#tooltip3';
    this.SELECTOR_SVG2 = '#container4 .graph svg';
    this.SELECTOR_TOOLTIP2 = '#tooltip4';
    this.startWithLoadingData()
};

StateChartModel.prototype.notifyStateSelectionChanged = function (state_name, value) {

    this.processDataForDrawingChart();
    
    this.renderStateCheckboxes();
    // this.updateChart_newCases();
    // $('.graph svg').empty();
    $(this.SELECTOR_SVG).empty();
    this.drawChart_newCases();

    $(this.SELECTOR_SVG2).empty();
    this.drawChart_allDeaths();


}    

StateChartModel.prototype.isStateSelected = function (state_name) {
    return this.state_names_selected_set.has(state_name);
}

StateChartModel.prototype.setSelectedState = function (state_name, value) {

    // let stateNameSet = this.state_names_selected_set;
    let isCurrentlySelected = this.isStateSelected(state_name);
    //case 1: to add
    if (value){
        if (isCurrentlySelected) return;
        this.state_names_selected_set.add(state_name)
        this.notifyStateSelectionChanged();
        return;
    }
    //case 2: to remove
    if (!isCurrentlySelected) return;
    this.state_names_selected_set.delete(state_name);
    // this.state_names_selected = Array.from(stateNameSet)
    this.notifyStateSelectionChanged();
}

StateChartModel.prototype.startWithLoadingData = function() {
    var parseTime1 = d3.timeParse("%Y-%m-%d");

    var type = function (d, _, columns) {
        d.date = parseTime1(d.date);
        //iterate through each column
        for (var i = 1, n = columns.length, c; i < n; ++i) {
            if (columns[i]==="date"){
              d[c = columns[i]] = d[c];
            }else {
              d[c = columns[i]] = +d[c];
            }
        }
        return d;
    }
    var thisModel=this;


    d3.csv("data_processing_r/us-states_processed.csv", type, function(error, data) {
        if (error) throw error;
        //save the data as a model state
        thisModel.raw_data = data;

        //processed the data for creating chart
        thisModel.processDataForDrawingChart();

        //trigger Drawing function
        thisModel.renderStateCheckboxes()
        thisModel.drawChart_newCases();
        thisModel.drawChart_allDeaths();

    });

};

StateChartModel.prototype.processDataForDrawingChart= function (){
    //processing raw data
    this.state_data  = groupBy(this.raw_data, (c) => c.state);
    this.state_names_all = Object.keys(this.state_data);
    
    var state_dictionary = this.state_data;

    //states will only contains data from selected states
    this.states = Array.from(this.state_names_selected_set).map(function (state_name){
        return {
            id : state_name,
            values : state_dictionary[state_name]
        }
    });

}

StateChartModel.prototype.renderStateCheckboxes= function (){
    //render checkboxes for all state in raw_data
    $('#menu').empty();
    for (let i = 0; i < this.state_names_all.length; i++) {
        var state_name = this.state_names_all[i];
        var checkbox = $("<input></input>");
        checkbox.attr('type','checkbox');
        checkbox.attr('id','cb_state_name');
        checkbox.attr('name',state_name);
        checkbox.attr('value',state_name);

        if (this.isStateSelected(state_name)) {
            checkbox.prop('checked', true);
        }

        var label = $("<label></label>");
        label.attr('for',state_name);
        label.append(state_name);
        var divcheck = $("<div></div>");
        divcheck.addClass("nation");

        divcheck.append(checkbox);
        divcheck.append(label);

        $('#menu').append(divcheck);
        // $('#menu').replaceWith(divcheck);

        let thisModel = this;
        checkbox.change(function(event) {
            console.log ("input changed")
            let state_name = $(this).val();
            var status = $(this).is(':checked');
            thisModel.setSelectedState(state_name, status);
        });

    }//for    
}

StateChartModel.prototype.drawChart_newCases = function() {

        let states = this.states;

        //define chart margins
        // let svg = d3.select("svg"),
        let svg = d3.select(this.SELECTOR_SVG),
            margin = {
                top: 30,
                right: 80,
                bottom: 40,
                left: 50
            },
            width = svg.attr("width") - margin.left - margin.right,
            height = svg.attr("height") - margin.top - margin.bottom,
            chart = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    
        //define scales
        let x = d3.scaleTime().range([0, width]);
        let y = d3.scaleLinear().range([height, 0]);
        //color scale
        let z = d3.scaleOrdinal(d3.schemeCategory20);
    
        //define line generator
        let line = d3.line()
            .curve(d3.curveBasis)
            .x(function(d) {
                return x(d.date);
            })
            .y(function(d) {
                    return y(d.cases_new);
            });  
    
        //define x axis
        x.domain(d3.extent(this.raw_data, function(d) {
            return d.date;
        }));

        //define y axis
        y.domain([
            d3.min(states, function(c) {
                return d3.min(c.values, function(d) {
                    return d.cases_new;
                });
            }),
            d3.max(states, function(c) {
                return d3.max(c.values, function(d) {
                    return d.cases_new;
                });
            })
        ]);


        //define color scale
        z.domain(states.map(function(c) {
            return c.id;
        }));


        //append x axis
        chart.append("g")
            .attr("class", "axis axis-x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m")))
            .append("text")
            // .attr("transform", "rotate(-90)")
            .attr("y", 20)
            .attr("x", 310)
            .attr("dy", "0.9em")
            .attr("fill", "#000")
            .text("Date")
            .append("text")
            // .attr("transform", "rotate(-90)")
            .attr("y", 20)
            .attr("x", 310)
            .attr("dy", "0.9em")
            .attr("fill", "#000")
            .text("Source:Sipri");

        //append y axis
        chart.append("g")
            .attr("class", "axis axis-y")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -125)
            .attr("dy", "0.9em")
            .attr("fill", "#000")
            .text("Covid-19 daily new cases");


        //append state data to svg

        let state = chart.selectAll(".state")
        .data(states)
        .enter()
        .append("g")
        .attr("class", "state")
        // 	d3.selectAll(".myCheckbox").on("change",update);
        // update();

        // append state path to svg
        state.append("path")
            .attr("class", "line")
            .attr('id', function(d){ return 'line-' + d.id })
            .attr("d", function(d) {return line(d.values); })
            .style("stroke", function(d) {return z(d.id);})
            .attr("opacity", 1);


        var longY = function (d) {return d.value.date.length};
        var longE = function (d) {return d.value.date.length};

        // append state labels to svg
        state.append("text")
            .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
            .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.cases_new) + ")"; })
            .attr("x", 3)
            .attr('id', function(d){ return 'text-' + d.id })
            .attr("dy", "0.35em")
            .style("font", "11px sans-serif")
            .attr("opacity", 1)
                .text(function(d) { return d.id; });


        //tooltip
        // const tooltip = d3.select('#tooltip3');
        const tooltip = d3.select(this.SELECTOR_TOOLTIP);
        const tooltipLine = chart.append('line');
            
        let removeTooltip = function () {
            if (tooltip) tooltip.style('display', 'none');
            if (tooltipLine) tooltipLine.attr('stroke', 'none');
        }

        let drawTooltip= function () {
            // const date = Math.floor((x.invert(d3.mouse(tipBox.node())[0]) + 5) / 10) * 10;
            const date = x.invert(d3.mouse(tipBox.node())[0]);
            
            // states.sort((a, b) => {
            //   return b.history.find(h => h.year == year).population - a.history.find(h => h.year == year).population;
            // })  
              
            tooltipLine.attr('stroke', 'black')
              .attr('x1', x(date))
              .attr('x2', x(date))
              .attr('y1', 0)
              .attr('y2', height);
            
            let date_format = d3.timeFormat("%Y-%m-%d");
            var format_cases = d3.format(",d");


            tooltip.html(date_format(date))
              .style('display', 'block')
              .style('left', d3.event.pageX + 20+"px")
              .style('top', d3.event.pageY - 20+"px")
              .selectAll()
              .data(states).enter()
              .append('div')
            //   .style('color', d => d.color)
            //   .html(d => d.id + ': ' + d.values[0].cases_new);
            .html(d => d.id + ': ' + 
                format_cases(d.values.find( h => date_format(h.date)==date_format(date) 
                ).cases_new )
            );
              // .html(d => d.name + ': ' + d.history.find(h => h.year == year).population);
            //   (h => date_format(h.date)==date_format(date) )
        }

        let tipBox = chart.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('opacity', 0)
            .on('mousemove', drawTooltip)
            .on('mouseout', removeTooltip)   


}   

StateChartModel.prototype.drawChart_allDeaths = function() {

    let states = this.states;

    //define chart margins
    // let svg = d3.select("svg"),
    let svg = d3.select(this.SELECTOR_SVG2),
        margin = {
            top: 30,
            right: 80,
            bottom: 40,
            left: 50
        },
        width = svg.attr("width") - margin.left - margin.right,
        height = svg.attr("height") - margin.top - margin.bottom,
        chart = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    //define scales
    let x = d3.scaleTime().range([0, width]);
    let y = d3.scaleLinear().range([height, 0]);
    //color scale
    let z = d3.scaleOrdinal(d3.schemeCategory20);

    //define line generator
    let line = d3.line()
        .curve(d3.curveBasis)
        .x(function(d) {
            return x(d.date);
        })
        .y(function(d) {
                return y(d.deaths);
        });  

    //define x axis
    x.domain(d3.extent(this.raw_data, function(d) {
        return d.date;
    }));

    //define y axis
    y.domain([
        d3.min(states, function(c) {
            return d3.min(c.values, function(d) {
                return d.deaths;
            });
        }),
        d3.max(states, function(c) {
            return d3.max(c.values, function(d) {
                return d.deaths;
            });
        })
    ]);


    //define color scale
    z.domain(states.map(function(c) {
        return c.id;
    }));


    //append x axis
    chart.append("g")
        .attr("class", "axis axis-x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m")))
        .append("text")
        // .attr("transform", "rotate(-90)")
        .attr("y", 20)
        .attr("x", 310)
        .attr("dy", "0.9em")
        .attr("fill", "#000")
        .text("Date")
        .append("text")
        // .attr("transform", "rotate(-90)")
        .attr("y", 20)
        .attr("x", 310)
        .attr("dy", "0.9em")
        .attr("fill", "#000")
        .text("Source:Sipri");

    //append y axis
    chart.append("g")
        .attr("class", "axis axis-y")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -125)
        .attr("dy", "0.9em")
        .attr("fill", "#000")
        .text("Covid-19 daily new cases");


    //append state data to svg

    let state = chart.selectAll(".state")
    .data(states)
    .enter()
    .append("g")
    .attr("class", "state")
    // 	d3.selectAll(".myCheckbox").on("change",update);
    // update();

    // append state path to svg
    state.append("path")
        .attr("class", "line")
        .attr('id', function(d){ return 'line-' + d.id })
        .attr("d", function(d) {return line(d.values); })
        .style("stroke", function(d) {return z(d.id);})
        .attr("opacity", 1);


    var longY = function (d) {return d.value.date.length};
    var longE = function (d) {return d.value.date.length};

    // append state labels to svg
    state.append("text")
        .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
        .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.deaths) + ")"; })
        .attr("x", 3)
        .attr('id', function(d){ return 'text-' + d.id })
        .attr("dy", "0.35em")
        .style("font", "11px sans-serif")
        .attr("opacity", 1)
            .text(function(d) { return d.id; });


    //tooltip
    // const tooltip = d3.select('#tooltip3');
    const tooltip = d3.select(this.SELECTOR_TOOLTIP2);
    const tooltipLine = chart.append('line');
        
    let removeTooltip = function () {
        if (tooltip) tooltip.style('display', 'none');
        if (tooltipLine) tooltipLine.attr('stroke', 'none');
    }

    let drawTooltip= function () {
        // const date = Math.floor((x.invert(d3.mouse(tipBox.node())[0]) + 5) / 10) * 10;
        const date = x.invert(d3.mouse(tipBox.node())[0]);
        
        // states.sort((a, b) => {
        //   return b.history.find(h => h.year == year).population - a.history.find(h => h.year == year).population;
        // })  
          
        tooltipLine.attr('stroke', 'black')
          .attr('x1', x(date))
          .attr('x2', x(date))
          .attr('y1', 0)
          .attr('y2', height);
        
        let date_format = d3.timeFormat("%Y-%m-%d");
        var format_cases = d3.format(",d");

        tooltip.html(date_format(date))
          .style('display', 'block')
          .style('left', d3.event.pageX + 20+"px")
          .style('top', d3.event.pageY - 20+"px")
          .selectAll()
          .data(states).enter()
          .append('div')
        //   .style('color', d => d.color)
        //   .html(d => d.id + ': ' + d.values[0].deaths);
        .html(d => d.id + ': ' + 
            format_cases(d.values.find( h => date_format(h.date)==date_format(date) 
            ).deaths )
        );
          // .html(d => d.name + ': ' + d.history.find(h => h.year == year).population);
        //   (h => date_format(h.date)==date_format(date) )
    }

    let tipBox = chart.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('opacity', 0)
        .on('mousemove', drawTooltip)
        .on('mouseout', removeTooltip)   


}   


//UsChartModel
function UsChartModel() {
    console.log("UsChartModel()")
    this.init()
}

UsChartModel.prototype.init = function() {
    console.log("init()")
    this.SELECTOR_SVG = '#container1 .graph svg';
    this.SELECTOR_TOOLTIP = '#tooltip1';
    this.SELECTOR_SVG2 = '#container2 .graph svg';
    this.SELECTOR_TOOLTIP2 = '#tooltip2';
    this.startWithLoadingData()
};

UsChartModel.prototype.startWithLoadingData = function() {
    var parseTime1 = d3.timeParse("%Y-%m-%d");

    var type = function (d, _, columns) {
        d.date = parseTime1(d.date);
        //iterate through each column
        for (var i = 1, n = columns.length, c; i < n; ++i) {
            if (columns[i]==="date"){
              d[c = columns[i]] = d[c];
            }else {
              d[c = columns[i]] = +d[c];
            }
        }
        return d;
    }
    var thisModel=this;

    //todo: change the file name
    d3.csv("data_processing_r/us_processed.csv", type, function(error, data) {
        if (error) throw error;
        //save the data as a model state
        thisModel.raw_data = data;

        console.log(data)
        console.log(thisModel.raw_data)

        //processed the data for creating chart
        // console.log("No need to call ??processDataForDrawingChart() here! ");
        // thisModel.processDataForDrawingChart();

        //trigger Drawing function
        // console.log("Will call UsChartModel.drawChart_newCases() here! ")
        thisModel.drawChart_newCases();
        thisModel.drawChart_allDeaths();

    });

};

UsChartModel.prototype.drawChart_newCases = function() {

    let data = this.raw_data;

    //define chart margins
    // let svg = d3.select("svg"),
    let svg = d3.select(this.SELECTOR_SVG),
        margin = {
            top: 30,
            right: 80,
            bottom: 40,
            left: 50
        },
        width = svg.attr("width") - margin.left - margin.right,
        height = svg.attr("height") - margin.top - margin.bottom,
        chart = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    //define scales
    let x = d3.scaleTime().range([0, width]);
    let y = d3.scaleLinear().range([height, 0]);
    //color scale
    let z = d3.scaleOrdinal(d3.schemeCategory20);

    // //define line generator
    // let line = d3.line()
    //     .curve(d3.curveBasis)
    //     .x(function(d) {
    //         return x(d.date);
    //     })
    //     .y(function(d) {
    //             return y(d.cases_new);
    //     });  

    //define x axis
    x.domain(d3.extent(data, function(d) {
        return d.date;
    }));

    //define y axis
    y.domain([
        d3.min(data, function(c) {
            return c.cases_new;
        }),
        d3.max(data, function(c) {
            return c.cases_new;
        })
    ]);

  


    // //define color scale
    // z.domain(states.map(function(c) {
    //     return c.id;
    // }));


    //append x axis
    chart.append("g")
        .attr("class", "axis axis-x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m")))
        .append("text")
        // .attr("transform", "rotate(-90)")
        .attr("y", 20)
        .attr("x", 310)
        .attr("dy", "0.9em")
        .attr("fill", "#000")
        .text("Date")
        .append("text")
        // .attr("transform", "rotate(-90)")
        .attr("y", 20)
        .attr("x", 310)
        .attr("dy", "0.9em")
        .attr("fill", "#000")
        .text("Source:Sipri");

    //append y axis
    chart.append("g")
        .attr("class", "axis axis-y")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -125)
        .attr("dy", "0.9em")
        .attr("fill", "#000")
        .text("US Covid-19 daily new cases");


    //append state data to svg

    let us = chart
    .attr("class", "us")


    // append state path to svg
    us.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", d3.line()
            .x(function(d) { return x(d.date) })
            .y(function(d) { return y(d.cases_new) })
        )
        .style("stroke", function(d) {return z(d.id);})
        .attr("opacity", 1);

    //annonations
    const annotations = [
        {
          note: {
            label: "1st peak",
            title: "",
            wrap: 100,  // try something smaller to see text split in several lines
            padding: 5   // More = text lower
          },
          connector: {
            end: "arrow" // 'dot' also available
          },
          x: 120,
          y: 470,
          dy: -150,
          dx: -50,
          color: ["red"],
        },
        {
            note: {
              label: "2nd peak",
              title: "",
              wrap: 100,  // try something smaller to see text split in several lines
              padding: 5   // More = text lower
            },
            connector: {
              end: "arrow" // 'dot' also available
            },
            x: 280,
            y: 410,
            dy: -150,
            dx: -50,
            color: ["red"],
          },        
          {
            note: {
              label: "3rd peak",
              title: "",
              wrap: 100,  // try something smaller to see text split in several lines
              padding: 5   // More = text lower
            },
            connector: {
              end: "arrow" // 'dot' also available
            },
            x: 550,
            y: 110,
            dy: -30,
            dx: -50,
            color: ["red"],
          },
          {
            note: {
              label: "4th wave",
              title: "",
              wrap: 100,  // try something smaller to see text split in several lines
              padding: 5   // More = text lower
            },
            connector: {
              end: "arrow" // 'dot' also available
            },
            x: 850,
            y: 440,
            dy: -70,
            dx: -50,
            color: ["red"],
          }
          
      ]

    // Add annotation to the chart
    const makeAnnotations = d3.annotation()
    .annotations(annotations)

    chart.append("g").call(makeAnnotations)


    //tooltip
    // const tooltip = d3.select('#tooltip3');
    const tooltip = d3.select(this.SELECTOR_TOOLTIP);
    const tooltipLine = chart.append('line');
        
    let removeTooltip = function () {
        if (tooltip) tooltip.style('display', 'none');
        if (tooltipLine) tooltipLine.attr('stroke', 'none');
    }

    let drawTooltip= function () {
        // const date = Math.floor((x.invert(d3.mouse(tipBox.node())[0]) + 5) / 10) * 10;
        const date = x.invert(d3.mouse(tipBox.node())[0]);
        
        // states.sort((a, b) => {
        //   return b.history.find(h => h.year == year).population - a.history.find(h => h.year == year).population;
        // })  
          
        tooltipLine.attr('stroke', 'black')
          .attr('x1', x(date))
          .attr('x2', x(date))
          .attr('y1', 0)
          .attr('y2', height);
        
        let date_format = d3.timeFormat("%Y-%m-%d");
        var format_cases = d3.format(",d");

        tooltip.html(date_format(date))
          .style('display', 'block')
          .style('left', d3.event.pageX + 20+"px")
          .style('top', d3.event.pageY - 20+"px")
          .selectAll()
        //   .data(data).enter()
          .append('div')
        //   .style('color', d => d.color)
        //   .html(d => d.id + ': ' + d.values[0].cases_new);
        .html('New cases: ' 
            // + 
            // d.find( h => date_format(h.date)==date_format(date) 
            // ).cases_new 
        );
          
    }

    let tipBox = chart.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('opacity', 0)
        .on('mousemove', drawTooltip)
        .on('mouseout', removeTooltip)   
}   




//Misc helper functions
function groupBy (xs, f) {
    return xs.reduce((r, v, i, a, k = f(v)) => ((r[k] || (r[k] = [])).push(v), r), {});
}



UsChartModel.prototype.drawChart_allDeaths = function() {

    let data = this.raw_data;

    //define chart margins
    // let svg = d3.select("svg"),
    let svg = d3.select(this.SELECTOR_SVG2),
        margin = {
            top: 30,
            right: 80,
            bottom: 40,
            left: 50
        },
        width = svg.attr("width") - margin.left - margin.right,
        height = svg.attr("height") - margin.top - margin.bottom,
        chart = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    //define scales
    let x = d3.scaleTime().range([0, width]);
    let y = d3.scaleLinear().range([height, 0]);
    //color scale
    let z = d3.scaleOrdinal(d3.schemeCategory20);

    // //define line generator
    // let line = d3.line()
    //     .curve(d3.curveBasis)
    //     .x(function(d) {
    //         return x(d.date);
    //     })
    //     .y(function(d) {
    //             return y(d.deaths);
    //     });  

    //define x axis
    x.domain(d3.extent(data, function(d) {
        return d.date;
    }));

    //define y axis
    y.domain([
        d3.min(data, function(c) {
            return c.deaths;
        }),
        d3.max(data, function(c) {
            return c.deaths;
        })
    ]);

  


    // //define color scale
    // z.domain(states.map(function(c) {
    //     return c.id;
    // }));


    //append x axis
    chart.append("g")
        .attr("class", "axis axis-x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m")))
        .append("text")
        // .attr("transform", "rotate(-90)")
        .attr("y", 20)
        .attr("x", 310)
        .attr("dy", "0.9em")
        .attr("fill", "#000")
        .text("Date")
        .append("text")
        // .attr("transform", "rotate(-90)")
        .attr("y", 20)
        .attr("x", 310)
        .attr("dy", "0.9em")
        .attr("fill", "#000")
        .text("Source:Sipri");

    //append y axis
    chart.append("g")
        .attr("class", "axis axis-y")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -125)
        .attr("dy", "0.9em")
        .attr("fill", "#000")
        .text("US Covid-19 daily new cases");


    //append state data to svg

    let us = chart
    // .selectAll(".state")
    // .enter()
    // .append("g")
    .attr("class", "us")
    // 	d3.selectAll(".myCheckbox").on("change",update);
    // update();

    // append state path to svg
    us.append("path")
        .datum(data)
        .attr("class", "line")
        // .attr('id', function(d){ return 'line-' + d.id })
        // .attr("d", function(d) {return line(d.values); })
        .attr("d", d3.line()
            .x(function(d) { return x(d.date) })
            .y(function(d) { return y(d.deaths) })
        )
        .style("stroke", function(d) {return z(d.id);})
        .attr("opacity", 1);


    //annonations
    const annotations = [
        {
        note: {
            label: "1st jump",
            title: "",
            wrap: 100,  // try something smaller to see text split in several lines
            padding: 5   // More = text lower
        },
        connector: {
            end: "arrow" // 'dot' also available
        },
        x: 120,
        y: 510,
        dy: -150,
        dx: -50,
        color: ["red"],
        },      
        {
            note: {
            label: "2nd jump",
            title: "",
            wrap: 100,  // try something smaller to see text split in several lines
            padding: 5   // More = text lower
            },
            connector: {
            end: "arrow" // 'dot' also available
            },
            x: 500,
            y: 280,
            dy: -30,
            dx: -50,
            color: ["red"],
        }
        
    ]

    // Add annotation to this chart
    const makeAnnotations = d3.annotation()
    .annotations(annotations)
    chart.append("g").call(makeAnnotations)


    //tooltip
    // const tooltip = d3.select('#tooltip3');
    const tooltip = d3.select(this.SELECTOR_TOOLTIP2);
    const tooltipLine = chart.append('line');
        
    let removeTooltip = function () {
        if (tooltip) tooltip.style('display', 'none');
        if (tooltipLine) tooltipLine.attr('stroke', 'none');
    }

    let drawTooltip= function () {
        // const date = Math.floor((x.invert(d3.mouse(tipBox.node())[0]) + 5) / 10) * 10;
        const date = x.invert(d3.mouse(tipBox.node())[0]);
        
        // states.sort((a, b) => {
        //   return b.history.find(h => h.year == year).population - a.history.find(h => h.year == year).population;
        // })  
          
        tooltipLine.attr('stroke', 'black')
          .attr('x1', x(date))
          .attr('x2', x(date))
          .attr('y1', 0)
          .attr('y2', height);
        
        let date_format = d3.timeFormat("%Y-%m-%d");
        var format_cases = d3.format(",d");

        tooltip.html(date_format(date))
          .style('display', 'block')
          .style('left', d3.event.pageX + 20+"px")
          .style('top', d3.event.pageY - 20+"px")
          .selectAll()
        //   .data(data).enter()
          .append('div')
        //   .style('color', d => d.color)
        //   .html(d => d.id + ': ' + d.values[0].deaths);
        .html('New cases: ' 
            // + 
            // d.find( h => date_format(h.date)==date_format(date) 
            // ).deaths 
        );
          
    }

    let tipBox = chart.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('opacity', 0)
        .on('mousemove', drawTooltip)
        .on('mouseout', removeTooltip)   
}   
