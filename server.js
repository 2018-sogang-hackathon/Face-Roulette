var express = require('express');
var fs = require('fs');
var request = require('request');
var img_proc = require('./image_process.js');

var app = express();
app.use(express.json());
var host_url = 'http://ec2-52-79-228-242.ap-northeast-2.compute.amazonaws.com:8080';
var img_url = {};
var bias = 0;

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
//				"text": "당첨자는 바로..!",
                "message": {
                    "text": "오늘밤 주인공은 너야 너!!",
                    "photo": {
                        "url": host_url + "/output/" + img_id + '_' + ret.pick_number.toString() + ".jpg",
                        "width": ret.width,
                        "height": ret.height
                    }
                },
//				"message_button": {
//			      "label": "공유하기",
//			      "url": "https://coupon/url"
//			    }
            };
            console.log('num of people:' + ret.num_of_people);
            console.log('pick num:' + ret.pick_number);
        }
        res.send(JSON.stringify(resSetting));
    });
}

app.get('/keyboard', function(req, res) {
    var keySetting = {
        'type': 'text'
    }
    res.send(JSON.stringify(keySetting));
});

app.post('/message', function(req, res) {
    // request가 photo일 때
    if (req.body.type == "photo") {
        img_url[req.body.user_key] = req.body.content;
        var resSetting = {
            "message": {
                "text": "페이스룰렛! 테마를 선택하세요."
            },
            "keyboard": {
                "type": "buttons",
                "buttons": [
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
    } else { // request가 button이거나 text일 때
        bias = (bias + 1) % 100000000;

        if (req.body.content == "랜덤으로!") {
            sendImage(bias, req, res, 'random');
        } else if(req.body.content == "가장 나이들어 보이는 사람"){
            sendImage(bias, req, res, 'age');
        } else if(req.body.content == "가장 행복해보이는 사람"){
            sendImage(bias, req, res, 'happiness');
        } else if(req.body.content == "가장 슬퍼보이는 사람"){
            sendImage(bias, req, res, 'sadness');
        } else if(req.body.content == "가장 화나 보이는 사람"){
            sendImage(bias, req, res, 'anger');
        } else if(req.body.content == "가장 무표정인 사람"){
            sendImage(bias, req, res, 'neutral');
        } else if(req.body.content == "경멸하는 표정을 짓는 사람"){
            sendImage(bias, req, res, 'contempt');
        } else if(req.body.content == "역겨운 표정을 짓는 사람"){
            sendImage(bias, req, res, 'disgust');
        } else if(req.body.content == "공포를 느끼고 있는 사람"){
            sendImage(bias, req, res, 'fear');
        } else if(req.body.content == "가장 놀라보이는 사람"){
            sendImage(bias, req, res, 'surprise');
        } else {
            var resSetting = {
                "message": {
                    "text": "문자가 아닌 이미지를 보내주세요!"
                }
            };
            res.send(JSON.stringify(resSetting));
        }
    }
});

app.get('*', function(req, res) {
    var url = req.url;
    res.sendFile(__dirname + url);
    console.log('return image!')
});

app.listen(8080, function() {
    console.log('server is running...');
});
