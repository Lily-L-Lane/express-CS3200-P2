const { MongoClient } = require("mongodb");

async function getQueries() {
    const url = process.env.MONGO_URL || "mongodb://localhost:27017";
    const client = new MongoClient(url);

    try {
        await client.connect();
        console.log("mongo connected");

        const db = client.db("CS3200_P2_IrrigationSolutions");
        const col = db.collection("IrrigationSolutions");

        // Query 1: Retrieve farms based on filter
        const filter = {
            '$and': [
                { 'region_id.soilType_id.type': 'silt' },
                { 'factors_id.humidity_id.humidity': { '$lt': 0.2 } },
                { 'factors_id.moisture_id.waterSaturation': { '$lt': 0.3 } }
            ]
        };
        const farms = await col.find(filter).toArray();

        // Query 2: Perform aggregation to get top yielding crops and associated farms
        const aggTopYielding = [
            {
                '$group': {
                    '_id': '$crop_id.Name', 
                    'farms': {
                        '$push': '$$ROOT'
                    }
                }
            }, {
                '$sort': {
                    'crop_id.yield_id.yield': -1
                }
            }, {
                '$limit': 3
            }
        ];
        const aggregationResult = await col.aggregate(aggTopYielding).toArray();

        // Query 3: Count farms with Precision Agriculture analysts
        const aggCountPrecisionAg = [
            {
                '$match': {
                    'solution_id.visualization_id.analyst_id.concentration': 'Precision Agriculture'
                }
            }, {
                '$count': 'Farms with Precision Agriculture analysts'
            }
        ];
        const countPrecisionAgResult = await col.aggregate(aggCountPrecisionAg).toArray();

        // Query 4: Calculate averages of location, humidity, and waterSaturation for each disease
        const aggAverages = [
            {
                '$group': {
                    '_id': '$crop_id.health_id.diseases', 
                    'farms': {
                        '$push': '$farm_id'
                    }, 
                    'avgLocation': {
                        '$avg': '$crop_id.location'
                    }, 
                    'avgHumidity': {
                        '$avg': '$factors_id.humidity_id.humidity'
                    }, 
                    'avgWaterSaturation': {
                        '$avg': '$factors_id.moisture_id.waterSaturation'
                    }
                }
            }, {
                '$group': {
                    '_id': '$_id', 
                    'farms': {
                        '$first': '$farms'
                    }, 
                    'avgLocation': {
                        '$first': '$avgLocation'
                    }, 
                    'avgHumidity': {
                        '$first': '$avgHumidity'
                    }, 
                    'avgWaterSaturation': {
                        '$first': '$avgWaterSaturation'
                    }
                }
            }
        ];
        const averagesResult = await col.aggregate(aggAverages).toArray();

        // Query 5: Update documents based on a query parameter
        const updateQuery = [
            {
                '$match': {
                    'crop_id.location': {
                        '$gte': 34, 
                        '$lte': 35
                    }
                }
            }, {
                '$set': {
                    'factors_id.humidity_id.humidity': 0.867, 
                    'factors_id.coverage_id.inchesOfRain': 5.7, 
                    'factors_id.moisture_id.waterSaturation': 0.795, 
                    'factors_id.time': '10:08 AM'
                }
            }
        ];
        const updateResult = await col.aggregate(updateQuery).toArray();

        return { farms, aggregationResult, countPrecisionAgResult, averagesResult, updateResult };

    } catch (err) {
        console.log("error found with mongo", err);
    } finally {
        client.close();
    }
}

async function main() {
    const { farms, aggregationResult, countPrecisionAgResult, averagesResult, updateResult } = await getQueries();
    
    console.log("Farm queries:", farms.length);
    console.log("Top yielding crops:", aggregationResult);
    console.log("Count of farms with Precision Agriculture analysts:", countPrecisionAgResult);
    console.log("Averages for each disease:", averagesResult);
    console.log("Update result:", updateResult);
}
main();