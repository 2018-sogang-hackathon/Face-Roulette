const request = require('request');

const SUBSCRIPTION_KEY = '7bd0f6be939f422bb7259e7173ae05f1';
const URL_BASE = 'https://westcentralus.api.cognitive.microsoft.com/face/v1.0';

module.exports = { detectFaces, createFaceList, addFace, findSimilarFace };

/**
 * A number, or a string containing a number.
 * @typedef {{faceId: string, faceRectangle, faceLandmarks, faceAttributes}} FaceEntry
 */

/**
 * Face API 호출 결과인 FaceEntry의 배열을 넘긴다.
 * @param {string} imageUrl 
 * @returns {Promise<FaceEntry[]>}
 */
function detectFaces(imageUrl) {
  return new Promise(function (resolve, reject) {
    const params = {
      returnFaceId: 'true',
      returnFaceLandmarks: 'false',
      returnFaceAttributes: 'age,gender,headPose,smile,facialHair,glasses,' +
        'emotion,hair,makeup,occlusion,accessories,blur,exposure,noise'
    };

    const options = {
      uri: `${URL_BASE}/detect`,
      qs: params,
      body: {url: imageUrl},
      json: true,
      headers: {
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
      }
    };

    request.post(options, (error, response, body) => {
      if (error) {
        console.log('Error: ', error);
        reject(error);
      }
      resolve(body);
    });
  });
}

/**
 * 주어진 faceListId로 빈 FaceList 를 생성한다
 * @param {string} faceListId 
 * @return {Promise}
 */
function createFaceList(faceListId) {
  const options = {
    uri: `${URL_BASE}/facelists/${faceListId}`,
    body: { name: 'test_list_name' },
    json: true,
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
    }
  };

  return new Promise((resolve, reject) => {
    request.put(options, (error, response, body) => {
      if (error) {
        console.log('createFaceList error: ', error);
        reject(error);
      }

      resolve();
    });
  });
}

/**
 * faceListId가 가리키는 리스트에 imageInfo에 있는 얼굴을 추가
 * @param {string} faceListId 
 * @param {{url: string, width: number, height: number}} imageInfo 
 * @return {Promise<string>}
 */
function addFace(faceListId, imageInfo) {
  const options = {
    uri: `${URL_BASE}/facelists/${faceListId}/persistedFaces`,
    qs: {/* empty */},
    body: { url: imageInfo.url },
    json: true,
    headers: {
      'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
    }
  };

  return new Promise((resolve, reject) => {
    request.post(options, (error, response, body) => {
      if (error) {
        console.log('createFaceList error: ', error);
        reject(error);
      }

      resolve(body.persistedFaceId);
    });
  });

}

/**
 * 후보 face들 (faceIds)에서 쿼리 face(faceId)와 닮은 face들을 넘김
 * @param {string} faceId query faceId
 * @param {string[]} faceIds candidate face ids
 * @return {Promise<{persistedFaceId: string, faceId: string, confidence: number }[]>}
 */
function findSimilarFace(faceId, faceIds) {

  return new Promise(function (resolve, reject) {

    const options = {
      uri: `${URL_BASE}/findsimilars`,
      body: { faceId, faceIds, maxNumOfCandidatesReturned: 10, mode: "matchFace" },
      json: true,
      headers: {
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
      }
    };

    request.post(options, (error, response, body) => {
      if (error) {
        console.log('Error: ', error);
        reject(error);
      }

      resolve(body);
    });
  });
}