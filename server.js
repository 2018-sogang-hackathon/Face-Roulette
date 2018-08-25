var express = require('express');
var fs = require('fs');
var request = require('request');
var img_proc = require('./image_process.js');
var path = require('path');

var faceApi = require('./face-api');
var faceUtils = require('./face-utils');
var img_proc2 = require('./image_process2');

var app = express();
app.use(express.json());
var host_url = 'http://ec2-52-79-228-242.ap-northeast-2.compute.amazonaws.com:8080';
var img_url = {};
var bias = 0;

var USER_STORE = {};

function sendMsg(response, msg) {
    var resSetting = {
        "message": {
            "text": msg
        }
    };
    response.send(JSON.stringify(resSetting));
}

function sendPhoto(response, relPath, width, height) {
    const resSetting = {
        message: {
            photo: {
                url: path.join(host_url, relPath),
                width,
                height
            }
        }
    };

    response.send(JSON.stringify(resSetting));
}

function sendImage(bias, req, res, select) {
    var img_id = bias.toString() + req.body.user_key;
    var prom = img_proc.imageProcess(img_url[req.body.user_key], img_id, select);
    prom.then(function (ret) {

        var resSetting;
        if (ret == 0) { // 이미지에 얼굴이 하나도 없을 때
            resSetting = {
                "message": {
                    "text": "이미지에 얼굴이 없습니다. 다시 시도하세요!"
                }
            };
        } else { // 정상적인 경우
            resSetting = {
                "message": {
                    "text": "오늘밤 주인공은 너야 너!!",
                    "photo": {
                        "url": host_url + "/output/" + img_id + '_' + ret.pick_number.toString() + ".jpg",
                        "width": ret.width,
                        "height": ret.height
                    },
				"message_button": {
						"label": "공유하기",
						"url": "https://coupon/url"
					}

                },
            };
            console.log('num of people:' + ret.num_of_people);
            console.log('pick num:' + ret.pick_number);
        }
        res.send(JSON.stringify(resSetting));
    });
}

app.get('/keyboard', function (req, res) {
    var keySetting = {
        'type': 'text'
    }
    res.send(JSON.stringify(keySetting));
});

app.post('/message', function (req, res) {
    // request가 photo일 때
    if (req.body.type == "photo") {
        let user_key = req.body.user_key;

        img_url[user_key] = req.body.content;
        if (user_key in USER_STORE && USER_STORE[user_key].state === 1) {
            let prm = faceApi.detectFaces(img_url[user_key])
                .then(faceList => {
                    if (faceList.length !== 1) {
                        console.log('에러 1명이 아닌 사진');
                        USER_STORE[user_key] = { state: 0 };
                        return null;
                    }
                    return faceList[0].faceId;
                });

            let user = USER_STORE[user_key];
            Promise.all([prm, user.faceListPrm, user.imageSizePrm]).then(([queryFaceId, faceList, imageSize]) => {
                if (!queryFaceId || !faceList) {
                    sendMsg(res, '뭔가 잘못됐음!!');
                    return;
                }

                let faceIds = faceList.map(face => face.faceId);
                let user = USER_STORE[user_key];

                return faceUtils.findSimilar(queryFaceId, faceIds).then(({ mostSimilarId }) => {

                    USER_STORE[user_key] = { state: 0 };
                    let pickedFace = faceList.find(face => {
                        return mostSimilarId === face.faceId;
                    });

                    img_proc2
                        .saveCropped(user.sourceUrl, imageSize, pickedFace.faceRectangle, user_key)
                        .then(({ width, height, imgRelPath }) => {
                            sendPhoto(res, imgRelPath, width, height);
                        }, error => {
                            console.log(error);
                        });
                    USER_STORE[user_key] = { state: 0 };
                });
            });
        }
        else {
            var resSetting = {
                "message": {
                    "text": "페이스룰렛! 테마를 선택하세요."
                },
                "keyboard": {
                    "type": "buttons",
                    "buttons": [
                        "유사도피커 TEST",
                        "랜덤으로!",
                        "가장 나이들어 보이는 사람",
                        "가장 행복해보이는 사람",
                        "가장 슬퍼보이는 사람",
                        "가장 화나 보이는 사람",
                        "가장 무표정인 사람",
                        "경멸하는 표정을 짓는 사람",
                        "역겨운 표정을 짓는 사람",
                        "공포를 느끼고 있는 사람",
                        "가장 놀라보이는 사람"
                    ]
                }
            };
            res.send(JSON.stringify(resSetting));
        }

    } else { // request가 button이거나 text일 때
        bias = (bias + 1) % 100000000;
        if (req.body.content == "유사도피커 TEST") {
            // sendImage(bias, req, res, 'random');
            let user_key = req.body.user_key;
            if (!(user_key in USER_STORE)) {
                // new user!!
                USER_STORE[user_key] = { state: 0 };
            }

            let curState = USER_STORE[user_key].state;
            if (curState === 0) {
                let prm = faceApi.detectFaces(img_url[user_key])
                    .then(faceList => {
                        if (faceList.length < 1) {
                            console.log('에러 아무도 없는 사진');
                            USER_STORE[user_key] = { state: 0 };
                            return null;
                        }
                        return faceList;
                    });

                USER_STORE[user_key].faceListPrm = prm;
                USER_STORE[user_key].imageSizePrm = img_proc2.getImageSize(img_url[user_key]);
                USER_STORE[user_key].sourceUrl = img_url[user_key];
                USER_STORE[user_key].state = 1;
                sendMsg(res, '비교할 1명의 사진을 첨부해주세요');
            }
        }
        else if (req.body.content == "랜덤으로!") {
            sendImage(bias, req, res, 'random');
        } else if (req.body.content == "가장 나이들어 보이는 사람") {
            sendImage(bias, req, res, 'age');
        } else if (req.body.content == "가장 행복해보이는 사람") {
            sendImage(bias, req, res, 'happiness');
        } else if (req.body.content == "가장 슬퍼보이는 사람") {
            sendImage(bias, req, res, 'sadness');
        } else if (req.body.content == "가장 화나 보이는 사람") {
            sendImage(bias, req, res, 'anger');
        } else if (req.body.content == "가장 무표정인 사람") {
            sendImage(bias, req, res, 'neutral');
        } else if (req.body.content == "경멸하는 표정을 짓는 사람") {
            sendImage(bias, req, res, 'contempt');
        } else if (req.body.content == "역겨운 표정을 짓는 사람") {
            sendImage(bias, req, res, 'disgust');
        } else if (req.body.content == "공포를 느끼고 있는 사람") {
            sendImage(bias, req, res, 'fear');
        } else if (req.body.content == "가장 놀라보이는 사람") {
            sendImage(bias, req, res, 'surprise');
        } else {
            var resSetting = {
                "message": {
                    "text": "이미지를 보내주세요!"
                }
            };
            res.send(JSON.stringify(resSetting));
        }
    }
});

app.get('*', function (req, res) {
    var url = req.url;
    fs.exists(__dirname + url, function (exists) {
        if (exists) {
            res.sendFile(__dirname + url);
            console.log('return image:' + __dirname + url);
        }
		else{
			console.log('invalid request!');
        }
    });

});

app.listen(8080, function () {
    console.log('server is running...');
});
