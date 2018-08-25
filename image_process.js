'use strict';

const request = require('request');
var Jimp = require('jimp');

const subscriptionKey = '7bd0f6be939f422bb7259e7173ae05f1';
const uriBase = 'https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect';
const output_path = 'output/';

exports.imageProcess = imgProcess;

function imgProcess(imageUrl, userID) {
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
                console.log('length is zero');
                resolve(0);
            }
            Jimp.read(imageUrl).then(image =>{
                // Get width, height of original image.
                var w = image.bitmap.width;
                var h = image.bitmap.height;
                return {width: w, height: h};
            }).then(obj => {
                var origin_width = obj.width;
                var origin_height = obj.height;
                var alpha = 0.5;
                //console.log(origin_width, origin_height);
                for (var i = 0; i < jsonResponse.length; i++) {
                    var top = jsonResponse[i].faceRectangle.top;
                    var left = jsonResponse[i].faceRectangle.left;
                    var width = jsonResponse[i].faceRectangle.width;
                    var height = jsonResponse[i].faceRectangle.height;

                    var gap = left - Math.max(left - width*alpha, 0);
                    var gap2 = Math.min(width*(1+2*alpha), origin_width) - (left + width);
                    left -= Math.min(gap, gap2);
                    width += Math.min(gap, gap2) * 2;
                    var gap = top - Math.max(top - height*alpha, 0);
                    var gap2 = Math.min(height*(1+2*alpha), origin_height) - (top + height);
                    top -= Math.min(gap, gap2);
                    height += Math.min(gap, gap2) * 2;

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
            })

        });
    });
};
// // Test Code
// var testURL = 'http://dn-m.talk.kakao.com/talkm/bl2TiOCu5js/xh4Oqs5ClcWqjHfLMfJdl1/i_soqvnbua000h1.jpg'; //현석얼굴
// //var testURL = 'https://img.huffingtonpost.com/asset/5ab1b7562000007d06eb27f0.jpeg?ops=scalefit_630_noupscale'; // 레드벨벳5인
// var testID = '05width+height3';
// imgProcess(testURL, testID);
