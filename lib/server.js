const http = require("http");

const server = {};

server.httpServer = http.createServer(function(req, res) {
  server.unifiedServer(req, res);
});

server.unifiedServer = function(req, res){

}

server.init = function(){
  server.httpServer.listen(3000, function(){
    console.log('\x1b[35m%s\x1b[0m', "The http-sever is running on port 3000")
  })
}


module.exports = server;
