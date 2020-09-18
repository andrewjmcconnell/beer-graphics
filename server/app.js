const express = require("express");
const fetch = require("node-fetch");

const app = express();
const port = 4000;

const breweryDBKey = "83e24a32db9e38953e1606025dbd9bae";
// const beerspotAPIKey = "fd226e9cf2f72932e18c399f96261d6a";
// const globalWineKey = "cd8359c5e29fd83e3d3c806732d90d8f3b05487";
// const omdbKey = "dae76358";

app.use((_, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/", (req, res) => {
  let data = [];
  fetch(
    `https://sandbox-api.brewerydb.com/v2/beers/?key=${breweryDBKey}&p=${req.query.page}`
  )
    .then(response => response.json())
    .then(beers => {
      beers.data.map(beer =>
        data.push({
          name: beer.name,
          abv: beer.abv,
          ibu: beer.ibu,
          category: beer.style ? beer.style.categoryId : null,
          available: beer.availableId
            ? beer.availableId
            : beer.available
            ? beer.available.id
            : 1
        })
      );
      res.json({
        data,
        currentPage: beers.currentPage,
        numberOfPages: beers.numberOfPages
      });
    })
    .catch(error => console.log(error));
});

app.listen(port, () => {});
