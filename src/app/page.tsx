'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface Event {
  ChangeType: string;
  Date: string;
  ID: string;
  Path: string;
  ResourceType: string;
  Seq: number;
}

export default function Timeline() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!svgRef.current) return;

    const loadData = async () => {
      try {
        const response = await fetch('/events.json');
        const data = await response.json();
        const events = data.Changes as Event[];

        const parseDate = d3.timeParse('%Y%m%dT%H%M%S');
        const formatDate = d3.timeFormat('%Y-%m-%d %H:%M:%S');

        const processedEvents = events.map(event => ({
          ...event,
          parsedDate: parseDate(event.Date)
        })).filter(event => event.parsedDate);

        // Group events by ChangeType to place them on different rows
        const eventTypes = Array.from(new Set(processedEvents.map(event => event.ChangeType)));
        const eventTypeToRow = new Map<string, number>();
        eventTypes.forEach((type, index) => {
          eventTypeToRow.set(type, index);
        });

        const margin = { top: 20, right: 30, bottom: 60, left: 60 };
        const width = window.innerWidth - margin.left - margin.right;
        const height = 550 - margin.top - margin.bottom; // Reduced height to account for title
        const rowHeight = height / (eventTypes.length + 1);

        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current!)
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom);

        // Add title and subtitle
        svg.append('text')
          .attr('x', width / 2 + margin.left)
          .attr('y', 20)
          .attr('text-anchor', 'middle')
          .attr('font-size', '18px')
          .attr('font-family', 'Arial, sans-serif')
          .attr('font-weight', 'bold')
          .text('Medical Events Timeline');

        svg.append('text')
          .attr('x', width / 2 + margin.left)
          .attr('y', 40)
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('font-family', 'Arial, sans-serif')
          .attr('fill', '#666')
          .text('Interactive visualization of medical events over time');

        const g = svg.append('g')
          .attr('transform', `translate(${margin.left},${margin.top + 50})`);

        const xScale = d3.scaleTime()
          .domain(d3.extent(processedEvents, d => d.parsedDate) as [Date, Date])
          .range([0, width]);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
          .domain(['NewSeries', 'NewStudy', 'NewPatient', 'NewInstance', 'StableSeries', 'StableStudy', 'StablePatient']);

        const timeFormat = d3.timeFormat('%H:%M:%S');
        const xAxis = d3.axisBottom(xScale)
          .tickFormat(timeFormat as any);

        // Add grid lines
        g.append('g')
          .attr('class', 'grid')
          .attr('transform', `translate(0, ${height})`)
          .call(d3.axisBottom(xScale)
            .tickSize(-height)
            .tickFormat(() => '') as any)
          .selectAll('line')
          .attr('stroke', '#e0e0e0')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '5,5');

        // Add horizontal lines for each row
        for (let i = 0; i <= eventTypes.length; i++) {
          g.append('line')
            .attr('x1', 0)
            .attr('y1', i * rowHeight)
            .attr('x2', width)
            .attr('y2', i * rowHeight)
            .attr('stroke', '#e0e0e0')
            .attr('stroke-width', 1);
        }

        // Add row labels
        eventTypes.forEach((type, index) => {
          g.append('text')
            .attr('x', -10)
            .attr('y', (index + 0.5) * rowHeight)
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '12px')
            .attr('font-family', 'Arial, sans-serif')
            .text(type)
            .attr('fill', colorScale(type));
        });

        // Add main x-axis at the bottom
        g.append('g')
          .attr('class', 'x-axis')
          .attr('transform', `translate(0, ${height})`)
          .call(xAxis);

        // Add axis label
        g.append('text')
          .attr('x', width / 2)
          .attr('y', height + 40)
          .attr('text-anchor', 'middle')
          .attr('font-size', '14px')
          .attr('font-family', 'Arial, sans-serif')
          .text('Time');

        const zoom = d3.zoom()
          .scaleExtent([0.5, 5])  // More reasonable zoom range
          .translateExtent([[0, 0], [width, height]])
          .on('zoom', (event: any) => {
            const newXScale = event.transform.rescaleX(xScale);
            
            // Update axis
            (g.select('.x-axis') as any)
              .call(d3.axisBottom(newXScale).tickFormat(timeFormat as any));

            // Update grid lines
            (g.select('.grid') as any)
              .call(d3.axisBottom(newXScale)
                .tickSize(-height)
                .tickFormat(() => '') as any);

            // Update all event dots
            g.selectAll('.event-dot')
              .attr('cx', (d: any) => newXScale(d.parsedDate!));

            // Update all event labels
            g.selectAll('.event-label')
              .attr('x', (d: any) => newXScale(d.parsedDate!));

            // Update zoom level display
            setZoomLevel(event.transform.k);
            updateZoomText();
          });

        // Apply zoom to the main group, not the SVG, for better pan behavior
        g.call(zoom as any);

        // Create event groups organized by rows
        const eventGroups = g.selectAll('.event-group')
          .data(processedEvents)
          .enter()
          .append('g')
          .attr('class', 'event-group');

        eventGroups.append('circle')
          .attr('class', 'event-dot')
          .attr('cx', d => xScale(d.parsedDate!))
          .attr('cy', d => {
            const row = eventTypeToRow.get(d.ChangeType) || 0;
            return (row + 0.5) * rowHeight;
          })
          .attr('r', 6)
          .attr('fill', d => colorScale(d.ChangeType))
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .attr('cursor', 'pointer')
          .attr('opacity', 0.9)
          .on('mouseover', function() {
            d3.select(this)
              .attr('r', 8)
              .attr('opacity', 1);
          })
          .on('mouseout', function() {
            d3.select(this)
              .attr('r', 6)
              .attr('opacity', 0.9);
          });

        eventGroups.append('text')
          .attr('class', 'event-label')
          .attr('x', d => xScale(d.parsedDate!))
          .attr('y', d => {
            const row = eventTypeToRow.get(d.ChangeType) || 0;
            return (row + 0.5) * rowHeight - 15;
          })
          .attr('text-anchor', 'middle')
          .attr('font-size', '11px')
          .attr('font-family', 'Arial, sans-serif')
          .attr('fill', '#333')
          .text(d => d.ResourceType);

        const tooltip = d3.select('body').append('div')
          .attr('class', 'timeline-tooltip')
          .style('opacity', 0)
          .style('position', 'absolute')
          .style('background', 'rgba(255, 255, 255, 0.95)')
          .style('color', '#333')
          .style('padding', '12px')
          .style('border-radius', '8px')
          .style('font-size', '13px')
          .style('pointer-events', 'none')
          .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.15)')
          .style('z-index', '1000')
          .style('border', '1px solid #ddd')
          .style('max-width', '300px');

        eventGroups
          .on('mouseover', function(event, d) {
            tooltip.transition()
              .duration(200)
              .style('opacity', .9);
            tooltip.html(`
              <div style="font-weight: bold; margin-bottom: 8px; color: #2563eb;">${d.ChangeType}</div>
              <div style="margin-bottom: 4px;"><strong>Date:</strong> ${formatDate(d.parsedDate!)}</div>
              <div style="margin-bottom: 4px;"><strong>Resource:</strong> ${d.ResourceType}</div>
              <div style="margin-bottom: 4px;"><strong>ID:</strong> ${d.ID.substring(0, 16)}...</div>
              <div><strong>Seq:</strong> ${d.Seq}</div>
            `)
              .style('left', (event.pageX + 15) + 'px')
              .style('top', (event.pageY - 35) + 'px');
          })
          .on('mouseout', function() {
            tooltip.transition()
              .duration(300)
              .style('opacity', 0);
          })
          .on('dblclick', function(event, d) {
            // Double-click to zoom to this event
            const xPosition = xScale(d.parsedDate!);
            const zoomFactor = 2;
            
            // Calculate the transform to center on this event
            const dx = width / 2 - xPosition;
            const dy = 0;
            
            // Apply the zoom transformation
            svg.transition()
              .duration(500)
              .call(zoom.transform as any, d3.zoomIdentity
                .translate(margin.left + dx * zoomFactor, margin.top + 50 + dy * zoomFactor)
                .scale(zoomFactor)
              );
          });

        // Add zoom controls
        const controls = svg.append('g')
          .attr('class', 'controls')
          .attr('transform', `translate(${width - 150}, 10)`);

        controls.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', 140)
          .attr('height', 30)
          .attr('rx', 5)
          .attr('ry', 5)
          .attr('fill', '#f5f5f5')
          .attr('stroke', '#ddd')
          .attr('stroke-width', 1);

        const zoomText = controls.append('text')
          .attr('x', 10)
          .attr('y', 20)
          .attr('font-size', '12px')
          .attr('font-family', 'Arial, sans-serif')
          .attr('fill', '#333')
          .text('Zoom: 1.00x');

        // Update zoom text when zoomLevel changes
        const updateZoomText = () => {
          zoomText.text('Zoom: ' + zoomLevel.toFixed(2) + 'x');
        };

        // Add zoom instructions
        controls.append('text')
          .attr('x', 10)
          .attr('y', 40)
          .attr('font-size', '11px')
          .attr('font-family', 'Arial, sans-serif')
          .attr('fill', '#666')
          .text('Scroll to zoom • Drag to pan • Double-click to focus');

        // Add legend
        const legend = svg.append('g')
          .attr('class', 'legend')
          .attr('transform', `translate(${width - 220}, 50)`);

        const legendItems = legend.selectAll('.legend-item')
          .data(colorScale.domain())
          .enter()
          .append('g')
          .attr('class', 'legend-item')
          .attr('transform', (d, i) => `translate(0, ${i * 25})`);

        legendItems.append('circle')
          .attr('cx', 10)
          .attr('cy', 12)
          .attr('r', 6)
          .attr('fill', d => colorScale(d))
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5);

        legendItems.append('text')
          .attr('x', 22)
          .attr('y', 12)
          .attr('dy', '0.35em')
          .attr('font-size', '13px')
          .attr('font-family', 'Arial, sans-serif')
          .text(d => d);

        legend.append('text')
          .attr('x', 0)
          .attr('y', -10)
          .attr('font-size', '14px')
          .attr('font-family', 'Arial, sans-serif')
          .attr('font-weight', 'bold')
          .text('Event Types');

      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    loadData();

    const handleResize = () => {
      loadData();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      d3.selectAll('.timeline-tooltip').remove();
    };

  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">Medical Events Timeline</h1>
        <div className="text-center mb-6">
          <p className="text-gray-600 italic">Drag to pan • Scroll to zoom • Double-click events to zoom • Hover for details</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              Interactive timeline visualization
            </div>
            <div className="text-sm text-gray-600">
              Current zoom: {zoomLevel.toFixed(2)}x
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <svg ref={svgRef} className="w-full"></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
