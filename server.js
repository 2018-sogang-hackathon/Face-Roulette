var express = require('express');
var app = express();
var fs = require('fs');
var request = require('request');
var img_proc = require('./image_process.js');

app.use(express.json());
var host_url = 'http://2a771f84.ngrok.io';
var bias = 0;

app.get('/keyboard', function(req, res){
    var keySetting = {
        'type': 'text'
    }
    res.send(JSON.stringify(keySetting));
});

app.post('/message', function(req, res){
    // request가 text일 때
    if(req.body.type == "text"){
        var resSetting = {
            "message": {
                "text": "문자가 아닌 이미지를 보내주세요!"
            }
        };
        res.send(JSON.stringify(resSetting));
    }
    else{ // request가 photo일 때
        bias = (bias + 1) % 100000000;
        var img_id = bias.toString() + req.body.user_key;
        var prom = img_proc.imageProcess(req.body.content, img_id);
        prom.then(function(ret){
            var resSetting;
            if(ret == 0){ // 이미지에 얼굴이 하나도 없을 때
                resSetting = {
                    "message": {
                        "text": "이미지에 얼굴이 없습니다. 다시 시도하세요!"
                    }
                };
            }
            else{ // 정상적인 경우
                resSetting = {
                    "message": {
                        "photo": {
                            "url": host_url + "/output/" + img_id + '_' + ret.pick_number.toString() + ".jpg",
                            "width":ret.width,
                            "height": ret.height
                        }
                    }
                };
                console.log('num of people:' + ret.num_of_people);
                console.log('pick num:' + ret.pick_number);
            }
            res.send(JSON.stringify(resSetting));
        });
    }
});

app.get('*', function(req, res){
    var url = req.url;
    res.sendFile(__dirname + url);
    console.log('return image!')
});

app.listen(8080, function(){
    console.log('server is running...');
});