"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
var server = http.createServer(function (req, res) {
    console.log("Connessione ricevuta");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.write(JSON.stringify("Hello World"), "utf-8");
    res.end();
});
server.listen(8080, function () {
    console.log("HTTP server started");
});
//# sourceMappingURL=index.js.map