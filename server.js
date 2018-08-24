var http = require('http');
var fs = require('fs');
var spawn = require('child_process').spawn;
// var py = spawn('python3', ['model/test_model.py']);

var app = http.createServer(function(request,response){
    var url = request.url;
    //var substr = url.split('/');

/*    if(substr[1] == 'query'){
      var query = decodeURIComponent(substr[2]);
      py.stdin.write(query + '\n');
      py.stdout.on('data', function(data){
        var output_text = data.toString('utf8');
        response.writeHead(200);
        response.end(output_text);
        console.log(output_text);
      });
    }
    else{ */
    var keySetting = {
            "type" : "buttons",
            "buttons" : ["선택 1", "선택 2", "선택 3"]
        };
    if(request.url == '/keyboard'){
        response.writeHead(200);
        response.end(JSON.stringify(keySetting));
    }
    else if(request. url == '/message'){

    }
    else{
        url = request.url;
        response.writeHead(200);
        response.end('Hello'); 
    }
});
app.listen(8080);