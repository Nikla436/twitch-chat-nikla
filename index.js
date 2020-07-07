const dotEnv = require('dotenv'); // Environment Variables
const tmi = require('tmi.js'); // Twitch Client
const fs = require('fs'); // Node FileSystem Access
dotEnv.config(); // Load .env contents to process.env

// Create Twitch Client
const Client = new tmi.client({
    identity: {
        username: process.env.USERNAME,
        password: process.env.TOKEN
    },
    channels: [process.env.CHANNEL],
});

// Namespaced Data file access
const Data = {
    dataFile: 'data.json',
    /**
     * Keeping data constants in a json file
     * This lets you update the json file with new values to be used, without
     * having to restart the node application
     * @param value
     * @returns {*}
     */
    get: (value) => {
        const data = JSON.parse(String(fs.readFileSync(Data.dataFile)));
        return value ? data[value] : data;
    },
    /**
     * Update & save data file with new value
     * @param key
     * @param newValue
     */
    set: (key, newValue) => {
        let data = Data.get();
        data[key] = newValue;
        fs.writeFile(Data.dataFile, JSON.stringify(data, null, 2), (error) => {
            if (error) console.log('Error Writing Data File');
        });
    },
};

/**
 * Handle doing a simple 'increment counter & say a message' chat command
 * @param dataKey -- key name for data value in Data
 * @param clientTarget -- Target to respond to
 * @param replyPrefix -- String prefix for reply in chat
 */
const countThing = function(dataKey, clientTarget, replyPrefix) {
    let things = Data.get(dataKey) || 0;
    Client.say(clientTarget, `${replyPrefix}: ${++things}`);
    Data.set(dataKey, things);
};

Client.on('connected', (addr, port) => console.log(`* Connected to ${addr}:${port}`));
Client.on('message', (target, context, msg, self) => {
    if (self) return;
    const message = msg.trim();
    if (!message.startsWith('!')) return;
    switch (message.toLowerCase()) {
        case ('!rank'): // VALORANT Rank
            Client.say(target, Data.get('rank'));
            break;
        case ('!uninstall'):
            countThing('uninstalls', target, 'Uninstalls');
            break;
        case ('!awp'):
        case ('!op'):
            countThing('awp', target, 'AWPs Wasted');
            break;
        default:
            Client.say(target, `unknown: ${message}`);
    }
});

// Connect us to Twitch
Client.connect();