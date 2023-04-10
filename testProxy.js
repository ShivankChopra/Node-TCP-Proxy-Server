const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');

const proxyUrl = 'socks5://localhost:8080';
const agent = new SocksProxyAgent(proxyUrl);

axios.get('http://ip-api.com/json', {
    httpAgent: agent,
    httpsAgent: agent,
    timeout: 5000
})
    .then((response) => {
        console.log(response.data);
    })
    .catch((error) => {
        console.error(error);
    });
