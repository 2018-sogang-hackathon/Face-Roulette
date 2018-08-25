'use strict';

const request = require('request');
var Jimp = require('jimp');

const subscriptionKey = '7bd0f6be939f422bb7259e7173ae05f1';
const uriBase = 'https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect';
const output_path = 'output/';

exports.imageProcess = function imgProcess(imageUrl, userID) {
    return new Promise(function(resolve, reject){
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
        request.post(options, (error, response, body) => {
    
            if (error) {
                console.log('Error: ', error);
                return;
            }
    
            var jsonResponse = JSON.parse(body);
            var count = 0;

            if(jsonResponse.length == 0) {
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
                        .writeAsync(output_path + userID + '_' + i.toString() + '.jpg').then(function(){
                            count++;
                            if(count == jsonResponse.length){
                                var pick_number = Math.floor(Math.random() * (count - 0) + 0);
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
// Test Code
var testURL = 'https://img.huffingtonpost.com/asset/5ab1b7562000007d06eb27f0.jpeg?ops=scalefit_630_noupscale';
var testID = 'qwer';
imgProcess(testURL, testID);