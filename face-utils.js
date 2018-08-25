const faceApi = require('./face-api');

module.exports = { findSimilar };

function findSimilar(faceId, faceIds) {
  let result = faceApi.findSimilarFace(faceId, faceIds).then(simFaceList => {
    let idx = 0;
    for(let i=1; i<simFaceList.length; ++i) {
      if(simFaceList[idx].confidence < simFaceList[i].confidence) {
        idx = i;
      }
    }

    return { mostSimilarId: simFaceList[idx].faceId, simFaceList };
  });

  return result;
}