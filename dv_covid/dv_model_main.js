function DvModel() {
    console.log ("in DvModel...")
    var initialSelectedStates=["South Dakota", "Tennessee", "Texas", "Utah", "Vermont","Maryland"];
    this.state_names_selected_set = new Set(initialSelectedStates);
    this.init()
}

DvModel.prototype.init = function() {
    console.log ("in DvModel.init()...")
    // this.drawExampleChart()
    this.startWithLoadingData()
};

DvModel.prototype.notifyStateSelectionChanged = function (state_name, value) {
    console.log("notifyStateSelectionChanged() ...")
    //todo: temporary
    // this.startWithLoadingData();
    this.processDataForDrawingChart();
    
    this.renderStateCheckboxes();
    // this.updateChart_newCases();
    $('.graph svg').empty();
    this.drawChart_newCases();


}    

DvModel.prototype.isStateSelected = function (state_name) {
    return this.state_names_selected_set.has(state_name);
}

DvModel.prototype.setSelectedState = function (state_name, value) {
    console.log("going to set "+state_name +" , to "+ value);
    // let stateNameSet = this.state_names_selected_set;
    let isCurrentlySelected = this.isStateSelected(state_name);
    //case 1: to add
    if (value){
        if (isCurrentlySelected) return;
        this.state_names_selected_set.add(state_name)
        console.log("to add: will update chart...");
        this.notifyStateSelectionChanged();
        return;
    }
    //case 2: to remove
    if (!isCurrentlySelected) return;
    this.state_names_selected_set.delete(state_name);
    // this.state_names_selected = Array.from(stateNameSet)
    this.notifyStateSelectionChanged();
    console.log("to remove: will update chart...")
}

DvModel.prototype.startWithLoadingData = function() {
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

    // var groupBy = function (xs, f) {
    //     return xs.reduce((r, v, i, a, k = f(v)) => ((r[k] || (r[k] = [])).push(v), r), {});
    // }

    d3.csv("data_processing_r/us-states_processed.csv", type, function(error, data) {
        if (error) throw error;
        //save the data as a model state
        thisModel.raw_data = data;

        //processed the data for creating chart
        thisModel.processDataForDrawingChart();

        //trigger Drawing function
        thisModel.renderStateCheckboxes()
        thisModel.drawChart_newCases();


    });

};

DvModel.prototype.processDataForDrawingChart= function (){
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

DvModel.prototype.renderStateCheckboxes= function (){
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

DvModel.prototype.drawChart_newCases = function() {

        let states = this.states;

        //define chart margins
        let svg = d3.select("svg"),
            margin = {
                top: 30,
                right: 80,
                bottom: 40,
                left: 50
            },
            width = svg.attr("width") - margin.left - margin.right,
            height = svg.attr("height") - margin.top - margin.bottom,
            g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    
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
        g.append("g")
            .attr("class", "axis axis-x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
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
        g.append("g")
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

        let state = g.selectAll(".state")
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

}   

DvModel.prototype.updateChart_newCases = function() {

    let states = this.states;

    //define chart margins
    let svg = d3.select("svg");

    let margin = {
            top: 30,
            right: 80,
            bottom: 40,
            left: 50
        },
        width = svg.attr("width") - margin.left - margin.right,
        height = svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


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

    //update x-axis and y-axis with animations
    svg.selectAll(".axis-x").transition()
    .duration(1000)
    .call(d3.axisBottom(x))

    svg.selectAll(".axis-y").transition()
    .duration(3000)
    .call(d3.axisLeft(y));


    //update line chart based on the new state data within svg
    let state = g.selectAll(".state")
    .data(states);

    state.enter()
    .append("g")
    .attr("class", "state")
    .transition()
    .duration(3000);


    // // append state path to svg
    // state.append("path")
    //     .attr("class", "line")
    //     .attr('id', function(d){ return 'line-' + d.id })
    //     .attr("d", function(d) {return line(d.values); })
    //     .style("stroke", function(d) {return z(d.id);})
    //     .attr("opacity", 1);


    // var longY = function (d) {return d.value.date.length};
    // var longE = function (d) {return d.value.date.length};

    // // append state labels to svg
    // state.append("text")
    //     .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
    //     .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.cases_new) + ")"; })
    //     .attr("x", 3)
    //     .attr('id', function(d){ return 'text-' + d.id })
    //     .attr("dy", "0.35em")
    //     .style("font", "11px sans-serif")
    //     .attr("opacity", 1)
    //         .text(function(d) { return d.id; });

}  



DvModel.prototype.drawExampleChart = function() {
    //define chart margins
    let svg = d3.select("svg"),
        margin = {
            top: 30,
            right: 80,
            bottom: 40,
            left: 50
        },
        width = svg.attr("width") - margin.left - margin.right,
        height = svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // //define time format
    // var parseTime = d3.timeParse("%Y");

    //define scales
    let x = d3.scaleTime().range([0, width]);
    let y = d3.scaleLinear().range([height, 0]);
    //color scale
    let z = d3.scaleOrdinal(d3.schemeCategory20);

    //define line generator
    let line = d3.line()
        .curve(d3.curveBasis)
        .x(function(d) {
            return x(d.Year);
        })
        .y(function(d) {
                return y(d.expenditure);
        });  

		//load data
    data = d3.csv("test/1_newdataone.csv", type, function(error, data) {
			if (error) throw error;

        //parse data
        var countries = data.columns.slice(1).map(function(id) {
            return {
                id: id,
                values: data.map(function(d) {
                    return {
                        Year: d.Year,
                        expenditure: d[id]

                    };


                })
            };
        });
        //

        //define x axis
        x.domain(d3.extent(data, function(d) {
            return d.Year;
        }));
        //define y axis
        y.domain([
            d3.min(countries, function(c) {
                return d3.min(c.values, function(d) {
                    return d.expenditure;
                });
            }),
            d3.max(countries, function(c) {
                return d3.max(c.values, function(d) {
                    return d.expenditure;
                });
            })
        ]);


        //define color scale
        z.domain(countries.map(function(c) {
            return c.id;
        }));


        //append x axis
        g.append("g")
            .attr("class", "axis axis-x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .append("text")
            // .attr("transform", "rotate(-90)")
            .attr("y", 20)
            .attr("x", 310)
            .attr("dy", "0.9em")
            .attr("fill", "#000")
            .text("Year")
            .append("text")
            // .attr("transform", "rotate(-90)")
            .attr("y", 20)
            .attr("x", 310)
            .attr("dy", "0.9em")
            .attr("fill", "#000")
            .text("Source:Sipri");

        //append y axis
        g.append("g")
            .attr("class", "axis axis-y")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -125)
            .attr("dy", "0.9em")
            .attr("fill", "#000")
            .text("Military expenditure (million $)");


        //append country data to svg
        let country = g.selectAll(".country")
        .data(countries)
        .enter()
        .append("g")
        .attr("class", "country")
        // 	d3.selectAll(".myCheckbox").on("change",update);
        // update();

        // append country path to svg
        country.append("path")
            .attr("class", "line")
            .attr('id', function(d){ return 'line-' + d.id })
            .attr("d", function(d) {return line(d.values); })
            .style("stroke", function(d) {return z(d.id);})
            .attr("opacity", 0);


        var longY = function (d) {return d.value.Year.length};
        var longE = function (d) {return d.value.Year.length};

        // append country labels to svg
        country.append("text")
            .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
            .attr("transform", function(d) { return "translate(" + x(d.value.Year) + "," + y(d.value.expenditure) + ")"; })
            .attr("x", 3)
            .attr('id', function(d){ return 'text-' + d.id })
            .attr("dy", "0.35em")
            .style("font", "11px sans-serif")
            .attr("opacity", 0)
                .text(function(d) { return d.id; });


        for (let i = 0; i < countries.length; i++) {
            var tick = document.createElement('input');
            tick.type = 'checkbox';
            tick.id = 'myCheckbox';
            tick.name = countries[i].id;
            tick.value = countries[i].id;

            var label = document.createElement('label');
            label.for = countries[i].id
            label.appendChild(document.createTextNode(countries[i].id));
            var divcheck = document.createElement('div');
            divcheck.id="nation";
            // tick.appendChild(document.createTextNode(countries[i].id));
            divcheck.appendChild(tick);
            divcheck.appendChild(label);
            document.getElementById("menu").appendChild(divcheck);

            tick.addEventListener("click", function() {

                var lineSelected = this.value;
                var svgline = d3.select('#line-' + lineSelected);
                var textline = d3.select('#text-' + lineSelected);
                console.log(svgline);
                console.log(textline);

                if(svgline.attr('opacity') === '0') {
                    // console.log('making it visible');
                    svgline.attr('opacity', 1);
                } else {
                    svgline.attr('opacity', 0);
                }

                // console.log("lineSelected:", lineSelected );
                console.log("temp:", textline.attr('opacity'));
                
                if(textline.attr('opacity') === '0') {
                    console.log('making it visible');
                    textline.attr('opacity', 1);
                } else {
                    textline.attr('opacity', 0);
                }
                this.style.background = '#555';
                this.style.color = 'white';

            });
        }//for              

    });//data

}

var parseTime = d3.timeParse("%Y");
//other misc functions
function type(d, _, columns) {
    d.Year = parseTime(d.Year);
    //iterate through each column
    for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];

    //bind column data to year
    return d;
}


function groupBy (xs, f) {
    return xs.reduce((r, v, i, a, k = f(v)) => ((r[k] || (r[k] = [])).push(v), r), {});
}