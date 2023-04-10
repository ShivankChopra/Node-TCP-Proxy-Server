const net = require('net');
const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');

const PROXY_LIST_URL = 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt';
const PROXY_TEST_BATCH_SIZE = 50;

// Get a list of proxies from the provided URL
const getProxies = async () => {
    const response = await axios.get(PROXY_LIST_URL);
    const proxyList = response.data.trim().split('\n').map(i => `socks5://${i}`);
    return proxyList;
};

// Test all proxies in batches for connectivity
const testProxyList = async (proxyList) => {
    const validProxies = [];
    const retryProxies = [];
    let i = 0;

    while (i < proxyList.length) {
        const batch = proxyList.slice(i, i + PROXY_TEST_BATCH_SIZE);
        const testPromises = batch.map(testProxy);
        const results = await Promise.all(testPromises);
        const batchValidProxies = results.filter((proxy) => proxy !== null);

        // Add valid proxies to the list
        validProxies.push(...batchValidProxies);

        // Add not valid proxies to the retry list
        const batchRetryProxies = batch.filter((proxy) => !batchValidProxies.includes(proxy));
        retryProxies.push(...batchRetryProxies);

        i += PROXY_TEST_BATCH_SIZE;

        console.log('Processed Proxies : ' + i);

        break; // manually stopping at 1st batch for testing sake
    }

    return { validProxies, retryProxies };
};


// Test a single proxy for connectivity
const testProxy = async (proxyUrl) => {
    try {
        console.log('Checking proxy :| -> ' + proxyUrl);
        const agent = new SocksProxyAgent(proxyUrl);
        const response = await axios.get('http://ip-api.com/json', {
            httpAgent: agent,
            httpsAgent: agent,
            timeout: 5000
        });
        if (response.status === 200) {
            console.log(response.data);
            return proxyUrl;
        }
    } catch (error) {
        // Proxy is not valid, return null
        console.log('Not working :( -> ' + proxyUrl);
    }
    return null;
};

// Round-robin proxy server
const createServer = ({ validProxies, retryProxies }) => {
    let proxyIndex = 0;
    const server = net.createServer((clientSocket) => {
        const proxyUrl = validProxies[proxyIndex];
        console.log('Using proxy : ' + proxyUrl);
        const proxySocket = net.connect({
            host: proxyUrl.replace('socks5://', '').split(':')[0],
            port: parseInt(proxyUrl.replace('socks5://', '').split(':')[1]),
            timeout: 5000
        });

        clientSocket.on('close', () => console.log('client closed'));
        proxySocket.on('close', () => console.log('proxy closed'));
        proxySocket.on('error', () => {
            retryProxies.push(proxyUrl);
        });

        clientSocket.pipe(proxySocket).pipe(clientSocket);
        proxyIndex = (proxyIndex + 1) % validProxies.length;
    });
    server.listen(8080);
    console.log('TCP proxy server listening on port 8080');
};

(async () => {
    const proxyList = await getProxies();
    const { validProxies, retryProxies } = await testProxyList(proxyList);
    console.log(`Found ${validProxies.length} valid proxies`);
    console.log(`Found ${retryProxies.length} retry proxies`);
    createServer({ validProxies, retryProxies });
})();
