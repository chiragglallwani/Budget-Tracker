import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

type LinegraphProps = {
  data: {
    month: string;
    value: number;
  }[];
  xAxis: string;
  yAxis: string;
};

export default function Linegraph({ data, xAxis, yAxis }: LinegraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Determine line color based on initial vs final value
  const getLineColor = useCallback(() => {
    if (data.length === 0) return "#6b7280"; // gray if no data

    const initialValue = data[0].value;
    const finalValue = data[data.length - 1].value;

    if (finalValue > initialValue) {
      return "#10b981"; // green for increase
    } else if (finalValue < initialValue) {
      return "#ef4444"; // red for decrease
    } else {
      return "#6b7280"; // gray for no change
    }
  }, [data]);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const maxHeight = 400;
        const minWidth = 400;
        const minHeight = 300;

        const finalWidth = Math.max(minWidth, containerWidth);

        const aspectRatioHeight = finalWidth * 0.6;
        const finalHeight = Math.min(
          Math.max(minHeight, aspectRatioHeight),
          maxHeight
        );

        setDimensions({
          width: finalWidth,
          height: finalHeight,
        });
      }
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(containerRef.current);

    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Draw the line graph
  useEffect(() => {
    if (!svgRef.current || !data.length || dimensions.width === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;
    const svg = d3
      .select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse dates and values
    const parsedData = data.map((d) => ({
      month: d.month,
      value: d.value,
    }));

    // Create scales
    const xScale = d3
      .scaleBand()
      .domain(parsedData.map((d) => d.month))
      .range([0, width])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([
        d3.min(parsedData, (d) => d.value) || 0,
        d3.max(parsedData, (d) => d.value) || 0,
      ] as [number, number])
      .nice()
      .range([height, 0]);

    // Create line generator
    const line = d3
      .line<{ month: string; value: number }>()
      .x((d) => (xScale(d.month) || 0) + xScale.bandwidth() / 2)
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add grid lines
    const yAxisGrid = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickSize(-width)
      .tickFormat(() => "");

    svg
      .append("g")
      .attr("class", "grid")
      .call(yAxisGrid)
      .attr("stroke", "#e5e7eb")
      .attr("stroke-dasharray", "3,3")
      .attr("opacity", 0.5);

    // Add the line
    svg
      .append("path")
      .datum(parsedData)
      .attr("fill", "none")
      .attr("stroke", getLineColor())
      .attr("stroke-width", 2.5)
      .attr("d", line);

    // Add dots
    svg
      .selectAll(".dot")
      .data(parsedData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => (xScale(d.month) || 0) + xScale.bandwidth() / 2)
      .attr("cy", (d) => yScale(d.value))
      .attr("r", 4)
      .attr("fill", getLineColor())
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .style("font-size", "12px");

    // Add Y axis
    svg
      .append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .attr("fill", "#6b7280")
      .style("font-size", "12px");

    // Add axis labels
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .style("font-size", "14px")
      .text(yAxis);

    svg
      .append("text")
      .attr(
        "transform",
        `translate(${width / 2}, ${height + margin.bottom - 5})`
      )
      .style("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .style("font-size", "14px")
      .text(xAxis);
  }, [data, dimensions, xAxis, yAxis, getLineColor]);

  if (data.length === 0) {
    return (
      <div className="w-full h-[400px] bg-gray-200 flex items-center justify-center rounded-md">
        <p className="text-gray-500 text-lg">
          No data available, Add income and expenses daily to see the monthly{" "}
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full max-h-[400px]">
      <svg ref={svgRef} className="w-full max-h-[400px]" />
    </div>
  );
}
