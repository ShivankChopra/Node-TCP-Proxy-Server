# Node-TCP-Proxy-Server
A simple TCP proxy server written in NodeJS that connects to a pool of free TOR Socksv5 proxies list, switches between proxies for each consecutive request in round-robin fashion.

Obtains Socksv5 proxies from : <a>https://github.com/TheSpeedX/PROXY-List</a>

The application first tests and determines working proxies, then starts a TCP server on 8080. Each connection is forwarded to one of the working proxies in a round robin way.

To start server, simply clone the repo, then `node index.js`. 
