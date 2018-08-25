'use strict';

const request = require('request');
var Jimp = require('jimp');

const subscriptionKey = '7bd0f6be939f422bb7259e7173ae05f1';
const uriBase = 'https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect';
const output_path = 'output/';

exports.imageProcess = imageProcess;

function imageProcess(imageUrl, userID, select) {

    return new Promise(function(resolve, reject) {
        const params = {
            'returnFaceId': 'true',
            'returnFaceLandmarks': 'false',
            'returnFaceAttributes': 'age,gender,headPose,smile,facialHair,glasses,' +
                'emotion,hair,makeup,occlusion,accessories,blur,exposure,noise'
        };

        const options = {
            uri: uriBase,
            qs: params,
            body: '{"url": ' + '"' + imageUrl + '"}',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': subscriptionKey
            }
        };

		// console.log("bbbbb");

        request.post(options, (error, response, body) => {

            if (error) {
                console.log('Error: ', error);
                return;
            }

            var jsonResponse = JSON.parse(body);
            var count = 0;

            if (jsonResponse.length == 0) {
                resolve(0);
            }

            for (var i = 0; i < jsonResponse.length; i++) {
                var top = jsonResponse[i].faceRectangle.top - 30;
                var left = jsonResponse[i].faceRectangle.left - 30;
                var width = jsonResponse[i].faceRectangle.width + 60;
                var height = jsonResponse[i].faceRectangle.height + 60;

                Jimp.read(imageUrl, ((i, top, left, width, height) => (err, lenna) => {
                    if (err) throw err;
                    lenna
                        .crop(left, top, width, height)
                        .writeAsync(output_path + userID + '_' + i.toString() + '.jpg').then(function() {
                            count++;

                            // when last person in jsonResponse.
                            if (count == jsonResponse.length) {
                                var pick_number = pickProcess(jsonResponse, select);

                                // console.log(pick_number);

                                var ret = {
                                    "pick_number": pick_number,
                                    "width": jsonResponse[pick_number].faceRectangle.width + 60,
                                    "height": jsonResponse[pick_number].faceRectangle.height + 60,
                                    "num_of_people": count
                                };
                                resolve(ret);
                            }
                        });
                })(i, top, left, width, height));
            }
        });
    });
};

function pickProcess(jsonResponse, select) {
    var pick_number;
    var pick_number_score;

    if (select == 'emotion_surprise') {

        pick_number = 0
        pick_number_score = jsonResponse[0].faceAttributes.emotion.surprise

        for (var i = 0; i < jsonResponse.length; i++) {
            var score = jsonResponse[i].faceAttributes.emotion.surprise
            if (pick_number_score < score) {
                pick_number = i;
                pick_number_score = jsonResponse[i].faceAttributes.emotion.surprise;
            }
        }

    } else if (select == 'random') {
        pick_number = Math.floor(Math.random() * (jsonResponse.length - 0) + 0);
    }

    return pick_number;
}

// test code.
// var imageUrl = 'http://image.xportsnews.com/contents/images/upload/article/2017/0909/1504915366388943.jpg';
// var userId = 0;
// var select = 'emotion_surprise';
// imageProcess(imageUrl, userId, select);
