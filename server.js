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
app.set('views', './view_files');
app.set('view engine', 'jade');
app.use(express.static(__dirname));

var host_url = 'http://ec2-52-79-228-242.ap-northeast-2.compute.amazonaws.com:8080';
var img_url = {};
var bias = Math.round(+new Date() / 1000) % 100000000;
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

    prom.then(function(ret) {

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
                        "url": "http://ec2-52-79-228-242.ap-northeast-2.compute.amazonaws.com:8080/share/" + img_id + '/' + ret.pick_number.toString()
                    }
                }
            };
        }
        console.log('num of people:' + ret.num_of_people);
        console.log('pick num:' + ret.pick_number);
        res.send(JSON.stringify(resSetting));
    });
}

app.get('/share/:img_id/:img_picked', function(req, res) {
    console.log(req.params.img_id, req.params.img_picked);
    var img_id = req.params.img_id;
    var img_picked = req.params.img_picked;
    // Facebook API Code
    var tmp = `<!DOCTYPE html>
		<html>
		<head>
   			<title> Facebook Login JavaScript Example </title>
    		<meta charset='utf-8'>
		</head>
		<body>
    	<script>
        window.fbAsyncInit = function() {
        	FB.init({
        		appId: '2136979469960699',
        		cookie: true,
        		xfbml: true,
        		version: 'v3.1'
        	});
        	FB.ui({
        		method: 'share',
				href: "http://ec2-52-79-228-242.ap-northeast-2.compute.amazonaws.com:8080/shareTemplate.html?abc=111"
        		//href: "http://ec2-52-79-228-242.ap-northeast-2.compute.amazonaws.com:8080/view/" + img_id + '/' + img_picked,
				//href: "http://naver.com"
        	}, function(response) {
        		console.log('success');
       		});
        };
        (function(d, s, id) {
        	var js, fjs = d.getElementsByTagName(s)[0];
        	if (d.getElementById(id)) return;
        	js = d.createElement(s);
        	js.id = id;
        	js.src = 'https://connect.facebook.net/en_US/sdk.js';
        	fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
		</script>
	</body>
</html>`;

    res.send(tmp);
    //res.render('share', {img_id : req.params.img_id, img_picked : req.params.img_picked});
});

app.get('/view/:img_id/:img_picked', function(req, res) {
    console.log("view inside");
    var img_id = req.params.img_id;
    var img_picked = req.params.img_picked;
    // Template HTML Code
    var ttemplate = `
	<!doctype html>
<html>
	<head>
		<meta charset='utf-8'>
		<meta property="og:url", 	content="https://ec2-52-79-228-242.ap-northeast-2.compute.amazonaws.com/share/" + ${img_id} + "/" + ${img_picked}>
		<meta property="og:type",	content="article">
		<meta property="og:title",  content="Test test">
		<meta property="og:description",	content="test test etst tst test">
		<meta property="og:image",	content="http://static01.nyt.com/images/2015/02/19/arts/international/19iht-btnumbers19A/19iht-btnumbers19A-facebookJumbo-v2.jpg">
		<title></title>
	</head>
	<body>
		<img src = 'https://ec2-52-79-228-242.ap-northeast-2.compute.amazonaws.com/output/' + ${img_id} + '_' + ${img_picked} + '.jpg'>
	</body>
</html>
		`;
    res.send(ttemplate);
    //res.render('shareTemplate', {img_id : req.params.img_id, img_picked : req.params.img_picked});
});

app.get('/keyboard', function(req, res) {
    var keySetting = {
        'type': 'text'
    }
    res.send(JSON.stringify(keySetting));
});

app.post('/message', function(req, res) {
    // request가 photo일 때
    if (req.body.type == "photo") {
        let user_key = req.body.user_key;

        img_url[user_key] = req.body.content;
        if (user_key in USER_STORE && USER_STORE[user_key].state === 1) {
            let prm = faceApi.detectFaces(img_url[user_key])
                .then(faceList => {
                    if (faceList.length !== 1) {
                        USER_STORE[user_key] = {
                            state: 0
                        };
                        return null;
                    }
                    return faceList[0].faceId;
                });

            let user = USER_STORE[user_key];
            Promise.all([prm, user.faceListPrm, user.imageSizePrm]).then(([queryFaceId, faceList, imageSize]) => {
                if (!queryFaceId || !faceList) {
                    sendMsg(res, '사진에 한 명만 있어야 합니다.');
                    return;
                }

                let faceIds = faceList.map(face => face.faceId);
                let user = USER_STORE[user_key];

                return faceUtils.findSimilar(queryFaceId, faceIds).then(({
                    mostSimilarId
                }) => {

                    USER_STORE[user_key] = {
                        state: 0
                    };
                    let pickedFace = faceList.find(face => {
                        return mostSimilarId === face.faceId;
                    });

                    img_proc2
                        .saveCropped(user.sourceUrl, imageSize, pickedFace.faceRectangle, bias.toString() + user_key)
                        .then(({
                            width,
                            height,
                            imgRelPath
                        }) => {
                            sendPhoto(res, imgRelPath, width, height);
                        }, error => {
                            console.log(error);
                        });
                    USER_STORE[user_key] = {
                        state: 0
                    };
                });
            });
        } else {
            var resSetting = {
                "message": {
                    "text": "페이스룰렛! 테마를 선택하세요."
                },
                "keyboard": {
                    "type": "buttons",
                    "buttons": [
                        "랜덤으로!",
                        "이 중 ~와 가장 닮은 사람은?",
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
        if (req.body.content == "이 중 ~와 가장 닮은 사람은?") {
            // sendImage(bias, req, res, 'random');
            let user_key = req.body.user_key;
            if (!(user_key in USER_STORE)) {
                // new user!!
                USER_STORE[user_key] = {
                    state: 0
                };
            }

            let curState = USER_STORE[user_key].state;
            if (curState === 0) {
                let prm = faceApi.detectFaces(img_url[user_key])
                    .then(faceList => {
                        if (faceList.length < 1) {
                            console.log('error: 아무도 없는 사진');
                            USER_STORE[user_key] = {
                                state: 0
                            };
                            return null;
                        }
                        return faceList;
                    });

                USER_STORE[user_key].faceListPrm = prm;
                USER_STORE[user_key].imageSizePrm = img_proc2.getImageSize(img_url[user_key]);
                USER_STORE[user_key].sourceUrl = img_url[user_key];
                USER_STORE[user_key].state = 1;
                sendMsg(res, '비교 할 1명의 사진을 보내주세요.');
            }
        } else if (req.body.content == "랜덤으로!") {
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

app.get('*', function(req, res) {
    var url = req.url;
    fs.exists(__dirname + url, function(exists) {
        if (exists) {
            res.sendFile(__dirname + url);
            console.log('return image:' + __dirname + url);
        } else {
            console.log('invalid request!');
        }
    });

});

app.listen(8080, function() {
    console.log('server is running...');
});
