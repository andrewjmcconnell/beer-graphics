import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import * as _ from "lodash";
import styled from "styled-components";

const Window = styled.div`
  display: flex;
  flex-direction: row;
`;

const Description = styled.div`
  vertical-align: top;
  padding: 16px;
`;

const width = 1000;
const petalColors = [
  "#ffc8f0",
  "#cbf2bd",
  "#afe9ff",
  "#ffb09e",
  "#fe4a49",
  "#2ab7ca",
  "#fed766",
  "#e6e6ea",
  "#f4f4f8",
  "#451e3e",
  "#fe8a71",
  "#009688"
];
const categories = [
  "British Origin Ales",
  "Irish Origin Ales",
  "North American Origin Ales",
  "German Origin Ales",
  "Belgian And French Origin Ales",
  "International Ale Styles",
  "European-germanic Lager",
  "North American Lager",
  "Other Lager",
  "International Styles",
  "Hybrid/mixed Beer",
  "Mead, Cider, & Perry",
  "Other Origin",
  "Malternative Beverages"
];
const getCategory = index => categories[index - 1];
const categoryIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const colorObj = _.zipObject(categoryIds, petalColors);
colorObj.Other = "#FFF2B4";
const petalPaths = [
  // "M0 0 C50 50 50 100 0 100 C-50 100 -50 50 0 0",
  "M-35 0 C-25 25 25 25 35 0 C50 25 25 75 0 100 C-25 75 -50 25 -35 0",
  "M0,0 C50,40 50,70 20,100 L0,85 L-20,100 C-50,70 -50,40 0,0",
  "M0 0 C50 25 50 75 0 100 C-50 75 -50 25 0 0"
];
const pathWidth = 120;
const perRow = Math.floor(width / pathWidth);
const svgHeight = (Math.ceil(50 / perRow) + 0.5) * pathWidth;
const calculateGridPos = i => {
  return [
    ((i % perRow) + 0.5) * pathWidth,
    (Math.floor(i / perRow) + 0.5) * pathWidth
  ];
};
const availabilityDescriptions = ["Year Round", "Limited", "Unavailable"];
const checkAvailability = index => availabilityDescriptions[index - 1];

const renderFlowers = beers => {
  const colorScale = d3
    .scaleOrdinal()
    .domain(categoryIds)
    .range(petalColors)
    .unknown("#fff2b4");

  const petalScale = d3.scaleOrdinal().range(petalPaths);

  const sizeScale = d3
    .scaleOrdinal()
    .domain(d3.extent(beers, beer => beer.abv))
    .range([0.1, 0.6])
    .unknown(0.35);

  const numPetalsScale = d3
    .scaleQuantize()
    .domain(d3.extent(beers, beer => beer.ibu))
    .range(_.range(5, 10))
    .unknown(5);

  return _.map(beers, (beer, i) => ({
    color: colorScale(beer.category),
    path: petalScale(beer.available), // corresponds to year round, limited, unavailable
    scale: sizeScale(beer.abv),
    numPetals: numPetalsScale(beer.ibu),
    translate: calculateGridPos(i),
    ...beer
  }));
};

const App = () => {
  const [isLoading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [beers, setBeers] = useState(null);
  const [selected, setSelecteed] = useState({
    name: null,
    category: null
  });
  let d3Container = useRef(null);

  useEffect(() => {
    setLoading(true)
    fetch(`http://localhost:4000/?page=${page}`)
      .then(res => res.json())
      .then(res => {
        setLoading(false);
        setNumPages(res.numberOfPages);
        setBeers(res.data);
      });
  }, [page]);

  useEffect(() => {
    if (beers !== null && d3Container.current) {
      const data = renderFlowers(beers);
      const g = d3
        .select(d3Container.current)
        .selectAll("g")
        .data(data, d => d)
        .join(
          enter => {
            const g = enter
              .append("g")
              .attr("opacity", 0)
              .attr("transform", (d, _) => `translate(${d.translate})`);

            g.selectAll("path")
              .data(d =>
                _.times(d.numPetals, i =>
                  Object.assign({}, d, { rotate: i * (360 / d.numPetals) })
                )
              )
              .join("path")
              .attr("fill-opacity", 0.5)
              .attr("d", d => d.path)
              .attr("fill", d => d.color)
              .attr("stroke", d => d.color)
              .transition()
              .duration(1000)
              .attr("transform", d => `rotate(${d.rotate})scale(${d.scale})`);

            g.append("text")
              .attr("text-anchor", "middle")
              .attr("dy", ".35em")
              .style("font-size", ".7em")
              .style("font-style", "italic")
              .text(d => _.truncate(d.title, { length: 20 }));
            return g;
          },
          update => update,
          exit => {
            exit
              .transition()
              .duration(1000)
              .attr("opacity", 0)
              .remove();
          }
        )
        .attr("transform", d => `translate(${d.translate})`)
        .attr("pointer-events", "all")
        .attr("cursor", "pointer");

      g.transition()
        .duration(1000)
        .attr("opacity", 1)
        .attr("transform", (d, i) => `translate(${d.translate})`);

      // e.path[1].__data__ = data of the selected group
      g.on("mouseover", e => setSelecteed(e.path[1].__data__));

      g.selectAll("path")
        .data(d =>
          _.times(d.numPetals, i =>
            Object.assign({}, d, { rotate: i * (360 / d.numPetals) })
          )
        )
        .enter()
        .append("path")
        .attr("transform", d => `rotate(${d.rotate})scale(${d.scale})`)
        .attr("d", d => d.path)
        .attr("fill", d => d.color)
        .attr("stroke", d => d.color)
        .attr("fill-opacity", 0.5)
        .attr("stroke-width", 2);

      g.append("text")
        .text(d => _.truncate(d.name, { length: 22 }))
        .style("font-size", ".7em")
        .style("font-style", "italic")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("pointer-events", "none");
    }
  }, [beers]);

  return (
    <div className="App">
      
      <Window>
        {isLoading && <img src={"/infinity-loader.svg"} alt="loading..." width={width} height={svgHeight} />}
        {!isLoading && <svg ref={d3Container} width={width} height={svgHeight} />}
        <Description>
          <strong>Beer Graphics</strong>
          <div><em>By Andrew McConnell</em></div>
          <div><em>Using d3.js and BreweryDB</em></div>
          <br />
          <div>Name: {selected.name}</div>
          <div>
            Category: {getCategory(selected.category || "not recorded")}
          </div>
          <div>ABV: {selected.abv || "not recorded"}</div>
          <div>IBU: {selected.ibu || "not recorded"}</div>
          <div>Availability: {checkAvailability(selected.available)}</div>
        </Description>
      </Window>
      <div>
        {page > 1 && (
          <button onClick={() => setPage(page - 1)}>{page - 1}</button>
        )}
        <button>{page}</button>
        {page < numPages && (
          <button onClick={() => setPage(page + 1)}>{page + 1}</button>
        )}
      </div>
      <div>
        <input value={page} onChange={e => setPage(Number(e.target.value))} />
        <span> / {numPages}</span>
      </div>
    </div>
  );
};

export default App;
