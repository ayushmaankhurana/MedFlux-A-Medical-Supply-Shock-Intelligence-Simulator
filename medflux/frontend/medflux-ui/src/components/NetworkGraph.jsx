import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

function NetworkGraph({ network }) {

  const svgRef = useRef();

  useEffect(() => {

    const width = 600;
    const height = 400;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    const simulation = d3
      .forceSimulation(network.nodes)
      .force("link",
        d3.forceLink(network.edges)
          .id(d => d.id)
          .distance(120)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const links = svg
      .append("g")
      .selectAll("line")
      .data(network.edges)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-width", 2);

    const nodes = svg
      .append("g")
      .selectAll("circle")
      .data(network.nodes)
      .enter()
      .append("circle")
      .attr("r", 20)
      .attr("fill", d => {

        if (d.type === "manufacturer") return "#8b5cf6";
        if (d.type === "hospital") return "#22c55e";
        if (d.type === "supplier") return "#3b82f6";
        if (d.type === "distributor") return "#f97316";

        return "#888";

      })
      .call(

        d3.drag()

          .on("start", dragStarted)
          .on("drag", dragged)
          .on("end", dragEnded)

      );

    const labels = svg
      .append("g")
      .selectAll("text")
      .data(network.nodes)
      .enter()
      .append("text")
      .text(d => d.id)
      .attr("font-size", 12)
      .attr("text-anchor", "middle")
      .attr("dy", 4);

    simulation.on("tick", () => {

      links
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      nodes
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      labels
        .attr("x", d => d.x)
        .attr("y", d => d.y);

    });

    function dragStarted(event, d) {

      if (!event.active) simulation.alphaTarget(0.3).restart();

      d.fx = d.x;
      d.fy = d.y;

    }

    function dragged(event, d) {

      d.fx = event.x;
      d.fy = event.y;

    }

    function dragEnded(event, d) {

      if (!event.active) simulation.alphaTarget(0);

      d.fx = null;
      d.fy = null;

    }

  }, [network]);

  return (

    <div>

      <h2 className="text-lg font-bold mb-4">

        Supply Chain Network

      </h2>

      <svg ref={svgRef}></svg>

    </div>

  );

}

export default NetworkGraph;