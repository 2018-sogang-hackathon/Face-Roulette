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
            Jimp.read(imageUrl).then(image => {
                // Get width, height of original image.
                var w = image.bitmap.width;
                var h = image.bitmap.height;
                return {width: w, height: h};
            }).then(obj => {
                var origin_width = obj.width;
                var origin_height = obj.height;
                //console.log(origin_width, origin_height);
                for (var i = 0; i < jsonResponse.length; i++) {
                    var top = jsonResponse[i].faceRectangle.top;
                    var left = jsonResponse[i].faceRectangle.left;
                    var width = jsonResponse[i].faceRectangle.width;
                    var height = jsonResponse[i].faceRectangle.height;

                    ({left, top, width, height} = cropTight(origin_width, origin_height, left, top, width, height));

                    Jimp.read(imageUrl, ((i, top, left, width, height) => (err, lenna) => {
                        if (err) throw err;
                        lenna
                            .crop(left, top, width, height)
                            .writeAsync(output_path + userID + '_' + i.toString() + '.jpg').then(function(){
                                count++;
                                if(count == jsonResponse.length){
                                    var pick_number = pickProcess(jsonResponse, select);
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
        })
    })
};

function cropTight(origin_width, origin_height, left, top, width, height){
    var alpha = 0.5;
    var gap = left - Math.max(left - width*alpha, 0);
    var gap2 = Math.min(left + width*(1+alpha), origin_width) - (left + width);
    left -= Math.min(gap, gap2);
    width += Math.min(gap, gap2) * 2;
    var gap = top - Math.max(top - height*alpha, 0);
    var gap2 = Math.min(top + height*(1+alpha), origin_height) - (top + height);
    top -= Math.min(gap, gap2);
    height += Math.min(gap, gap2) * 2;

    return {left, top, width, height};
}
function pickProcess(jsonResponse, select) {
    var pick_number;
    var pick_number_score;

	if (select == 'random') {

        pick_number = Math.floor(Math.random() * (jsonResponse.length - 0) + 0);

    } else if (select == 'age') {

		pick_number = 0
        pick_number_score = jsonResponse[0].faceAttributes.age;

        for (var i = 0; i < jsonResponse.length; i++) {
            var score = jsonResponse[i].faceAttributes.age;
            if (pick_number_score < score) {
                pick_number = i;
                pick_number_score = jsonResponse[i].faceAttributes.age;
            }

			console.log(i + ", score : " + score + ", max score" + pick_number_score);
        }

	// when select == emotion attributes.
	// ex. "anger", "surprise", ...
	} else {

		pick_number = 0
        pick_number_score = jsonResponse[0].faceAttributes.emotion[select];

        for (var i = 0; i < jsonResponse.length; i++) {
            var score = jsonResponse[i].faceAttributes.emotion[select];
            if (pick_number_score < score) {
                pick_number = i;
                pick_number_score = jsonResponse[i].faceAttributes.emotion[select];
            }

			console.log(i + ", score : " + score + ", max score" + pick_number_score);
        }
	}

	console.log("pick_number : " + pick_number);
    return pick_number;
}

// test code.
// var imageUrl = 'http://dn-m.talk.kakao.com/talkm/bl2TiOCu5js/xh4Oqs5ClcWqjHfLMfJdl1/i_soqvnbua000h1.jpg';
// var imageUrl = 'http://image.xportsnews.com/contents/images/upload/article/2017/0909/1504915366388943.jpg';
// var imageUrl = 'http://dn-m.talk.kakao.com/talkm/bl2TiOCu5js/xh4Oqs5ClcWqjHfLMfJdl1/i_soqvnbua000h1.jpg';
// var userId = 0;
// var select = 'neutral';
// imageProcess(imageUrl, userId, select);
