import http = require('http');
import url = require('url');

var server = http.createServer((req, res) => {
  console.log("Connessione ricevuta");

  res.writeHead(200, { "Content-Type": "application/json" })
  res.write(JSON.stringify("Hello World"), "utf-8");
  res.end();
});

server.listen(8080, function () {
  console.log("HTTP server started");
});