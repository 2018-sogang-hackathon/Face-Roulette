var express = require('express');
var app = express();
var fs = require('fs');
var request = require('request');

app.use(express.json());

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
    console.log(req.body);
    download(req.body.content, 'output/test.jpg', function(){
        console.log('image downloading complete!')
    });
});

app.listen(8080, function(){
    console.log('server is running...');
});