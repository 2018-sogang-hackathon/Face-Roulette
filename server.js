var express = require('express');
var app = express();
var fs = require('fs');
var request = require('request');
var img_proc = require('./image_process.js');

app.use(express.json());
var host_url = 'http://2a771f84.ngrok.io';

var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

app.get('/keyboard', function(req, res){
    var keySetting = {
        'type': 'text'
    }
    res.send(JSON.stringify(keySetting));
});

app.post('/message', function(req, res){
    console.log('image downloading complete!')
    var prom = img_proc.imageProcess(req.body.content);
    prom.then(function(num_of_people){
        var pick_num = Math.floor(Math.random() * (0, num_of_people) + 0);
        var resSetting = {
            "message": {
                "photo": {
                    "url": host_url + "/output/" + pick_num.toString() + ".jpg",
                    "width": 640,
                    "height": 480
                }
            }
        };
        console.log(pick_num);
        console.log(num_of_people);
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