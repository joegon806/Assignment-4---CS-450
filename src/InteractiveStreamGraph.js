import React, { Component } from "react";
import * as d3 from "d3";

class InteractiveStreamGraph extends Component {
  componentDidUpdate() {
    const chartData = this.props.csvData;
    console.log("Rendering chart with data:", chartData);
    // Don't render if data is empty
    if (!chartData || chartData.length === 0) {
      return;
    }

    // Define the LLM model names to visualize
    const llmModels = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"];

    // Write the D3.js code to create the interactive streamgraph visualization here
    var data = chartData;
    const maxSum = d3.sum([
      d3.max(data, d => d[llmModels[0]]),
      d3.max(data, d => d[llmModels[1]]),
      d3.max(data, d => d[llmModels[2]]),
      d3.max(data, d => d[llmModels[3]]),
      d3.max(data, d => d[llmModels[4]]),
    ]);
    var xScale = d3.scaleTime().domain(d3.extent(data, d => d["Date"])).range([10, 300]);
    var yScale = d3.scaleLinear().domain([0, maxSum]).range([400, 0]);

    const colors = { "GPT-4": "#e41a1c", "Gemini": "#377eb8", "PaLM-2": "#4daf4a", "Claude": "#984ea3", "LLaMA-3.1": "#ff7f00" };

    var stack = d3.stack().keys(llmModels).offset(d3.stackOffsetWiggle);
    var stackedSeries = stack(data);

    var areaGenerator = d3.area().x(d => xScale(d.data["Date"])).y0(d => yScale(d[0])).y1(d => yScale(d[1])).curve(d3.curveCardinal);

    d3.select('.container').selectAll('path').data(stackedSeries).join('path').style('fill', d => colors[d.key]).attr('d', d => areaGenerator(d));
    d3.select(".x-axis").attr("transform", "translate(0, 460)").call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b")));

    // Legend
    const mysvg = d3.select('.container').selectAll("svg").data([null]).join("svg")
    mysvg.selectAll("rect").data(llmModels).join("rect")
      .attr("x", 350)
      .attr("y", (d, i) => 350 - i * 27)
      .attr("width", 22)
      .attr("height", 22)
      .attr("fill", d => colors[d])

    mysvg.selectAll("text").data(llmModels).join("text")
      .attr("x", 360 + 16)
      .attr("y", (d, i) => 350 - i * 27 + 14)
      .text(d => d)
      .attr("text-anchor", "left")
      .attr("font-size", 12)

    //Tooltip
    const tooltip = d3.select("body").append("svg").attr("class", "tooltip").style("position", "absolute")
      .attr("width", 270).attr("height", 150).style("background", "rgba(213, 213, 213, 1)")
      .style("border-radius", "4px").style("padding", "4px").style("display", "none");

    const tooltipXScale = d3.scaleBand().domain(data.map(d => d["Date"])).range([20, 220]).padding(0.2);
    const tooltipXAxis = d3.axisBottom(tooltipXScale).tickFormat(d3.timeFormat("%b"));

    tooltip.append("g").attr("class", "tooltip-x-axis")
      .attr("transform", "translate(30,120)")
      .call(tooltipXAxis);
    tooltip.selectAll(".tick text").attr("font-size", "8px")
    tooltip.append("g").attr("class", "tooltip-y-axis")

    d3.selectAll("path")
      .on("mouseover mousemove", (event, d) => {
        tooltip.style("display", "block")
          .style("left", (event.pageX - 270/2) + "px")
          .style("top", (event.pageY + 10) + "px")

        var modelName = d.key
        var tooltipYScale = d3.scaleLinear().domain([0, d3.max(data, d => d[modelName])]).range([130, 20]);
        var tooltipYAxis = d3.axisLeft(tooltipYScale)
        tooltip.select(".tooltip-y-axis")
          .attr("transform", "translate(50,-10)")
          .call(tooltipYAxis)
        
        tooltip.selectAll("rect").data(data).join("rect")
        .attr("x", d => tooltipXScale(d["Date"])).attr("width", tooltipXScale.bandwidth())
        .attr("transform", "translate(30,0)")
        .attr("y", d => tooltipYScale(d[modelName])).attr("height", d => 120-tooltipYScale(d[modelName]))
        .transition()
        .attr("fill", colors[modelName]);

      })

      .on("mouseout", () => { // Handle mouse leave event 
        tooltip.style("display", "none"); // Hide the tooltip when mouse leaves the paths 
      });

  }

  render() {
    return (
      <svg style={{ width: 600, height: 500 }} className="svg_parent">
        <g className="container"></g>
        <g className="x-axis"></g>
      </svg>
    );
  }
}

export default InteractiveStreamGraph;
