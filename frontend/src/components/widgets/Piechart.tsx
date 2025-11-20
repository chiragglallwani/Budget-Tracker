import * as d3 from "d3";
import React, { useRef, useEffect, useState, useMemo } from "react";

type PieData = {
  label: string;
  value: number;
};

type PieChartProps = {
  title: string;
  data: PieData[];
};

const PieChart: React.FC<PieChartProps> = ({ data, title }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const processedData = useMemo(() => {
    if (data.length <= 8) {
      return data;
    }

    const sortedData = [...data].sort((a, b) => b.value - a.value);

    const top9 = sortedData.slice(0, 7);

    const others = sortedData.slice(7);
    const othersSum = others.reduce((sum, item) => sum + item.value, 0);

    return [...top9, { label: "Others", value: othersSum }];
  }, [data]);

  const colorScale = useMemo(() => {
    return d3.scaleOrdinal(d3.schemeCategory10);
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height,
        });
      }
    });

    const currentWrapper = wrapperRef.current;
    if (currentWrapper) {
      observer.observe(currentWrapper);
    }

    return () => {
      if (currentWrapper) {
        observer.unobserve(currentWrapper);
      }
    };
  }, []);

  useEffect(() => {
    if (
      !svgRef.current ||
      !dimensions.width ||
      !dimensions.height ||
      processedData.length === 0
    )
      return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.5;
    const outerRadius = radius * 0.9;

    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3
      .pie<PieData>()
      .value((d) => d.value)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<PieData>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const total = processedData.reduce((sum, item) => sum + item.value, 0);

    const arcs = g
      .selectAll(".arc")
      .data(pie(processedData))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => colorScale(d.data.label));

    arcs
      .append("text")
      .attr("transform", (d) => {
        const centroid = arc.centroid(d);
        return `translate(${centroid[0]}, ${centroid[1]})`;
      })
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .text((d) => {
        if (total === 0) return "";
        const percentage = (d.data.value / total) * 100;
        return percentage > 0.5 ? `${percentage.toFixed(1)}%` : "";
      });
  }, [processedData, dimensions, colorScale]);

  if (processedData.length === 0) {
    return (
      <div className="w-full h-[400px] bg-gray-200 flex items-center justify-center rounded-md">
        <p className="text-gray-500 text-lg">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <div ref={wrapperRef} style={{ width: "100%", height: "400px" }}>
        <svg ref={svgRef} width="100%" height="100%"></svg>
      </div>
      {/* Legend below the chart */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        {processedData.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: colorScale(item.label) }}
            />
            <span className="text-sm text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieChart;
