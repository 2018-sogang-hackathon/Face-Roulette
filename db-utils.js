module.exports = { addFaceData };

const MongoClient = require('mongodb').MongoClient;
const MONGO_URL = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'hackathon';
const COLLECTION_NAME = 'faceData';

function addFaceData(faceEntries) {
	MongoClient.connect(`${MONGO_URL}/${DB_NAME}`, function (err, client) {
    if (err) {
      throw err;
    }

    client.db(DB_NAME).collection(COLLECTION_NAME).insertMany(faceEntries);

    client.close();
  });
}
