var express = require('express');
var app = express();

app.get('/keyboard', function(req, res){
    var keySetting = {
        'type': 'text'
    }
    res.send(JSON.stringify(keySetting));
});
app.listen(8080, function(){
    console.log('server is running...');
});