const express = require("express");
const app = express();
const port = process.env.PORT || 3001;

app.use(express.static('public'));

const { farms, aggregationResult, countPrecisionAgResult, averagesResult, updateResult } = require('./index');

app.get("/data", async (req, res) => {
  // Prepare the data to be sent as JSON
  const data = {
    farmQueries: farms,
    topYieldingCrops: aggregationResult,
    precisionAgCount: countPrecisionAgResult,
    diseaseAverages: averagesResult,
    updateResult: updateResult
  };

  res.json(data);
});


const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;