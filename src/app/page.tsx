"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface Event {
  ChangeType: string;
  Date: string;
  ID: string;
  Path: string;
  ResourceType: string;
  Seq: number;
}

const MARGIN = 100;

export default function Timeline() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const loadData = async () => {
      try {
        const response = await fetch("/events.json");
        const data = await response.json();
        const events = data.Changes as Event[];

        const parseDate = d3.timeParse("%Y%m%dT%H%M%S");
        const formatDate = d3.timeFormat("%Y-%m-%d %H:%M:%S");

        const processedEvents = events
          .map((event) => ({
            ...event,
            parsedDate: parseDate(event.Date),
          }))
          .filter((event) => event.parsedDate);

        // Group events by ChangeType to place them on different rows
        const eventTypes = Array.from(
          new Set(processedEvents.map((event) => event.ChangeType)),
        );
        const eventTypeToRow = new Map<string, number>();
        eventTypes.forEach((type, index) => {
          eventTypeToRow.set(type, index);
        });

        const margin = { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN };
        const width = window.innerWidth - margin.left - margin.right;
        const rowHeight = 60; // Fixed row height for better readability
        const height = rowHeight * (eventTypes.length + 1); // Dynamic height based on number of event types

        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3
          .select(svgRef.current!)
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom + 100); // Extra space for controls and legend

        // Headers removed as requested

        const g = svg
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3
          .scaleTime()
          .domain(
            d3.extent(processedEvents, (d) => d.parsedDate) as [Date, Date],
          )
          .range([0, width]);

        const colorScale = d3
          .scaleOrdinal(d3.schemeCategory10)
          .domain([
            "NewSeries",
            "NewStudy",
            "NewPatient",
            "NewInstance",
            "StableSeries",
            "StableStudy",
            "StablePatient",
          ]);

        const timeFormat = d3.timeFormat("%H:%M:%S");
        const xAxis = d3.axisBottom(xScale).tickFormat(timeFormat as any);

        // Add grid lines
        g.append("g")
          .attr("class", "grid")
          .attr("transform", `translate(0, ${height})`)
          .call(
            d3
              .axisBottom(xScale)
              .tickSize(-height)
              .tickFormat(() => "") as any,
          )
          .selectAll("line")
          .attr("stroke", "#e0e0e0")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "5,5");

        // Add horizontal lines for each row
        for (let i = 0; i <= eventTypes.length; i++) {
          g.append("line")
            .attr("x1", 0)
            .attr("y1", i * rowHeight)
            .attr("x2", width)
            .attr("y2", i * rowHeight)
            .attr("stroke", "#e0e0e0")
            .attr("stroke-width", 1);
        }

        // Add row labels
        eventTypes.forEach((type, index) => {
          g.append("text")
            .attr("x", -10)
            .attr("y", (index + 0.5) * rowHeight)
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", "12px")
            .attr("font-family", "Arial, sans-serif")
            .text(type)
            .attr("fill", colorScale(type));
        });

        // Add main x-axis at the bottom
        g.append("g")
          .attr("class", "x-axis")
          .attr("transform", `translate(0, ${height})`)
          .call(xAxis);


        const zoom = d3
          .zoom()
          .scaleExtent([0.5, 10]) // Zoom range
          .on("zoom", zoomed);

        svg.call(zoom as any);

        function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
          const newXScale = event.transform.rescaleX(xScale);
          g.select(".x-axis").call(xAxis.scale(newXScale));
          g.select(".grid").call(
            d3
              .axisBottom(newXScale)
              .tickSize(-height)
              .tickFormat(() => "") as any,
          );

          g.selectAll(".event-dot").attr("cx", (d: any) =>
            newXScale(d.parsedDate!),
          );
          g.selectAll(".event-label").attr("x", (d: any) =>
            newXScale(d.parsedDate!),
          );
        }


        // Create event groups organized by rows
        const eventGroups = g
          .selectAll(".event-group")
          .data(processedEvents)
          .enter()
          .append("g")
          .attr("class", "event-group");

        eventGroups
          .append("circle")
          .attr("class", "event-dot")
          .attr("cx", (d) => xScale(d.parsedDate!))
          .attr("cy", (d) => {
            const row = eventTypeToRow.get(d.ChangeType) || 0;
            return (row + 0.5) * rowHeight;
          })
          .attr("r", 6)
          .attr("fill", (d) => colorScale(d.ChangeType))
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .attr("opacity", 0.9)
          .on("mouseover", function () {
            d3.select(this).attr("r", 8).attr("opacity", 1);
          })
          .on("mouseout", function () {
            d3.select(this).attr("r", 6).attr("opacity", 0.9);
          });

        eventGroups
          .append("text")
          .attr("class", "event-label")
          .attr("x", (d) => xScale(d.parsedDate!))
          .attr("y", (d) => {
            const row = eventTypeToRow.get(d.ChangeType) || 0;
            return (row + 0.5) * rowHeight - 15;
          })
          .attr("text-anchor", "middle")
          .attr("font-size", "11px")
          .attr("font-family", "Arial, sans-serif")
          .attr("fill", "#333")
          .text((d) => d.ResourceType);

        const tooltip = d3
          .select("body")
          .append("div")
          .attr("class", "timeline-tooltip")
          .style("opacity", 0)
          .style("position", "absolute")
          .style("background", "rgba(255, 255, 255, 0.95)")
          .style("color", "#333")
          .style("padding", "12px")
          .style("border-radius", "8px")
          .style("font-size", "13px")
          .style("pointer-events", "none")
          .style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.15)")
          .style("z-index", "1000")
          .style("border", "1px solid #ddd")
          .style("max-width", "300px");

        eventGroups
          .on("mouseover", function (event, d) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip
              .html(`
              <div style="font-weight: bold; margin-bottom: 8px; color: #2563eb;">${d.ChangeType}</div>
              <div style="margin-bottom: 4px;"><strong>Date:</strong> ${formatDate(d.parsedDate!)}</div>
              <div style="margin-bottom: 4px;"><strong>Resource:</strong> ${d.ResourceType}</div>
              <div style="margin-bottom: 4px;"><strong>ID:</strong> ${d.ID.substring(0, 16)}...</div>
              <div><strong>Seq:</strong> ${d.Seq}</div>
            `)
              .style("left", event.pageX + 15 + "px")
              .style("top", event.pageY - 35 + "px");
          })
          .on("mouseout", function () {
            tooltip.transition().duration(300).style("opacity", 0);
          });
        svg.on("dblclick.zoom", null); // Disable double-click zoom
        // Double-click to zoom in
        svg.on("dblclick", function (event) {
          const [mouseX] = d3.pointer(event);
          const currentZoom = d3.zoomTransform(svg.node() as Element);
          const newZoom = currentZoom.translate(-mouseX, 0).scale(2).translate(mouseX, 0);

          svg.transition().duration(500).call(zoom.transform as any, newZoom);
        });


        const controls = svg
          .append("g")
          .attr(
            "transform",
            `translate(${width + margin.left - 60}, ${height + margin.top + 40})`,
          );

        controls
          .append("circle")
          .attr("r", 12)
          .attr("fill", "#f0f0f0")
          .attr("stroke", "#ccc")
          .attr("cursor", "pointer")
          .on("click", () => {
            svg.transition().duration(500).call(zoom.scaleBy as any, 1.2);
          });

        controls
          .append("text")
          .attr("x", 0)
          .attr("y", 1)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "18px")
          .attr("font-weight", "bold")
          .text("+")
          .attr("pointer-events", "none");

        controls
          .append("circle")
          .attr("cx", 28)
          .attr("r", 12)
          .attr("fill", "#f0f0f0")
          .attr("stroke", "#ccc")
          .attr("cursor", "pointer")
          .on("click", () => {
            svg.transition().duration(500).call(zoom.scaleBy as any, 0.8);
          });

        controls
          .append("text")
          .attr("x", 28)
          .attr("y", 1)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "18px")
          .attr("font-weight", "bold")
          .text("-")
          .attr("pointer-events", "none");

        controls
          .append("rect")
          .attr("x", 52)
          .attr("y", -12)
          .attr("width", 24)
          .attr("height", 24)
          .attr("rx", 3)
          .attr("ry", 3)
          .attr("fill", "#f0f0f0")
          .attr("stroke", "#ccc")
          .attr("cursor", "pointer")
          .on("click", () => {
            svg.transition().duration(500).call(zoom.transform as any, d3.zoomIdentity);
          });

        controls
          .append("text")
          .attr("x", 64)
          .attr("y", 1)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "12px")
          .text("Reset")
          .attr("pointer-events", "none");



        // Zoom instructions
        svg
          .append("text")
          .attr("x", margin.left)
          .attr("y", height + margin.top + 60)
          .attr("font-size", "14px")
          .attr("font-family", "Arial, sans-serif")
          .attr("fill", "#666")
          .text("Use mouse wheel to zoom, click and drag to pan.");


        // Legend removed as requested
      } catch (error) {
        console.error("Error loading events:", error);
      }
    };

    loadData();

    const handleResize = () => {
      loadData();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      d3.selectAll(".timeline-tooltip").remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <svg ref={svgRef} className="w-full"></svg>
    </div>
  );
}
