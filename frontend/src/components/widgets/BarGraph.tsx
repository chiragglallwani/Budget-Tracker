import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

type BarGraphProps = {
  title: string;
  data: {
    label: string;
    totalBudget: number;
    totalExpense: number;
  }[];
  xAxis?: string;
  yAxis?: string;
};

export default function BarGraph({
  title,
  data,
  xAxis = "Date",
  yAxis = "Amount",
}: BarGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

  // Draw the bar graph
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

    // Parse data
    const parsedData = data.map((d) => ({
      label: d.label,
      totalBudget: Number(d.totalBudget) || 0,
      totalExpense: Number(d.totalExpense) || 0,
    }));

    // Create scales
    const xScale = d3
      .scaleBand()
      .domain(parsedData.map((d) => d.label))
      .range([0, width])
      .padding(0.2);

    const maxDataValue = Math.max(
      ...parsedData.map((d) => Math.max(d.totalBudget, d.totalExpense)),
      0
    );

    const tempScale = d3.scaleLinear().domain([0, maxDataValue]).nice();
    const niceMax = tempScale.domain()[1];

    const tickStep = (niceMax - tempScale.domain()[0]) / 5;
    const finalMax = niceMax > maxDataValue ? niceMax : niceMax + tickStep;

    const yScale = d3
      .scaleLinear()
      .domain([0, finalMax])
      .nice()
      .range([height, 0]);

    // Create sub-groups for grouped bars
    const subgroups = ["totalBudget", "totalExpense"];
    const xSubgroup = d3
      .scaleBand()
      .domain(subgroups)
      .range([0, xScale.bandwidth()])
      .padding(0.05);

    // Colors
    const colors: { [key: string]: string } = {
      totalBudget: "#f97316", // orange
      totalExpense: "#6366f1", // indigo
    };

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

    // Create grouped bars
    const barGroups = svg
      .selectAll(".bar-group")
      .data(parsedData)
      .enter()
      .append("g")
      .attr("class", "bar-group")
      .attr("transform", (d) => `translate(${xScale(d.label) || 0}, 0)`);

    // Add bars for each subgroup
    barGroups
      .selectAll("rect")
      .data((d) =>
        subgroups.map((key) => ({
          key,
          value: d[key as keyof typeof d] as number,
        }))
      )
      .enter()
      .append("rect")
      .attr("x", (d) => xSubgroup(d.key) || 0)
      .attr("y", (d) => yScale(d.value))
      .attr("width", xSubgroup.bandwidth())
      .attr("height", (d) => height - yScale(d.value))
      .attr("fill", (d) => colors[d.key])
      .attr("rx", 2);

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

    // Add legend
    // const legend = svg
    //   .append("g")
    //   .attr("transform", `translate(${width - 120}, 5)`);
  }, [data, dimensions, xAxis, yAxis]);

  if (data.length === 0) {
    return (
      <div className="w-full h-[400px] bg-gray-200 flex items-center justify-center rounded-md">
        <p className="text-gray-500 text-lg">
          No data available, Add budget and expenses to see the comparison
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full max-h-[400px]">
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <div className="flex items-center flex-col gap-2">
        <p className="text-gray-500 text-sm flex items-center gap-2">
          <span className="bg-[#f97316] w-5 h-5 rounded-sm"> . </span> Budget
          <span className="bg-[#6366f1] w-5 h-5 rounded-sm"> . </span> Expense
        </p>
        <svg ref={svgRef} className="w-full max-h-[400px]" />
      </div>
    </div>
  );
}
