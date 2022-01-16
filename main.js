const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const https = require('https');


const todayDate = new Date().toISOString().slice(0, 10);
// let yesterdayDate = (new Date() - 1).toISOString().slice(0,10);

// const path = 'reports/province/on?after=' + yesterdayDate;
const path = '/reports/province/on?date=' + todayDate;

const options = {
    hostname: 'api.covid19tracker.ca',
    port: 443,
    path: path,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
}

client.once('ready', () => {
    console.log('CovidBot is online!');
});

client.on('messageCreate', (message) => {
    if(message.content == "$covidStats") {
        sendCovidData(message);
    }
})

const sendCovidData = async function(message){
 
    https.get(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', async (content) => {
            let c = JSON.parse(content).data;
            if(c.length) {
                c = c[0];
                await sendMessageToChannel(message.channelId, 
                    'Covid info today brought to you by CovidBot:\n' + 
                    'Cases: ' + (c.change_cases).toString() + '\n' + 
                    'Hospitlization: ' + (c.total_hospitalizations).toString() + '\n' + 
                    'ICU: ' + (c.total_criticals).toString() + '\n' + 
                    'Deaths: ' + (c.change_fatalities).toString());
            }
            else {
                await sendMessageToChannel(message.channelId, 'Sorry, data not yet available for today... \nTry again later today!');
            }
            
        });
    });
    
  
};

const sendMessageToChannel = async function(channelId, message) {
    const channel = await client.channels.fetch(channelId);
    channel.send(message);

}

client.login('OTMxNzIzNzU4MDMxNDgyODkx.YeIlXg.19VDFDebJypznenbIdTDfsz0wdQ');