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
    console.log('image downloading complete!')
    bias = (bias + 1) % 100000000;
    var img_id = bias.toString() + req.body.user_key;
    var prom = img_proc.imageProcess(req.body.content, img_id);
    prom.then(function(ret){
        var resSetting = {
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
        res.send(JSON.stringify(resSetting));
    })
});

app.get('*', function(req, res){
    var url = req.url;
    res.sendFile(__dirname + url);
    console.log('return image!')
});

app.listen(8080, function(){
    console.log('server is running...');
});