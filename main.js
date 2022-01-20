const { Client, Intents, MessageEmbed} = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const https = require('https');
const config = require('./config.json');

const todayDate = new Date()
const yesterdayDate = new Date(todayDate);
yesterdayDate.setDate(todayDate.getDate() - 1);

const path = '/reports/province/on?date=' + todayDate.toISOString().slice(0, 10);;
const path2 = '/reports/province/on?date=' + yesterdayDate.toISOString().slice(0, 10);;

const options = {
    hostname: 'api.covid19tracker.ca',
    port: 443,
    path: path,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
}

const options2 = {
    hostname: 'api.covid19tracker.ca',
    port: 443,
    path: path2,
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
        let promises = [];

        promises.push(getCovidData(options));
        promises.push(getCovidData(options2));

        Promise.all(promises)
            .then(function(result) {
                sendCovidData(message.channelId, result);
        });
    }
})

let getCovidData = function(options) {
    return new Promise(function(resolve, reject) {
        let req = https.request(options, (res) => {
            res.setEncoding('utf8')
            res.on('data', (d) => {
                try {
                    let result = JSON.parse(d);
                    resolve(result);
                } catch(e) {
                    reject(e);
                }            
        });
    });

        req.on('error', (e) => {
            reject(e);
        });
        req.end();
    });
}

const sendCovidData = async function(channelId, data){
    let tData = data[0].data[0];
    let yData = data[1].data[0];
    let diffCases = '';
    let diffHospital = '';
    let diffICU = '';
    let diffDeaths = '';

    if(tData.change_cases - yData.change_cases >= 0) {
        diffCases = '+' + (tData.change_cases - yData.change_cases).toString();
    }
    else{
        diffCases = (tData.change_cases - yData.change_cases).toString();
    }

    if(tData.total_hospitalizations - yData.total_hospitalizations >= 0) {
        diffHospital = '+' + (tData.total_hospitalizations - yData.total_hospitalizations).toString();
    }
    else {
        diffHospital = (tData.total_hospitalizations - yData.total_hospitalizations).toString();
    }

    if(tData.total_criticals - yData.total_criticals >= 0) {
        diffICU = '+' + (tData.total_criticals - yData.total_criticals).toString();
    }
    else {
        diffICU = (tData.total_criticals - yData.total_criticals).toString();
    }

    if(tData.change_fatalities - yData.change_fatalities >= 0) {
        diffDeaths = '+' + (tData.change_fatalities - yData.change_fatalities).toString();
    }
    else {
        diffDeaths = (tData.change_fatalities - yData.change_fatalities).toString();
    }

    let diff = {
        'cases': diffCases,
        'hospital': diffHospital,
        'icu': diffICU,
        'deaths': diffDeaths,

    }
    const embed = new MessageEmbed()
	.setColor('#0099ff')
	.setTitle('Covid Data')
	.setURL('https://github.com/bmirza101/CovidDiscordBot')
	.setAuthor({ name: 'CovidBot', iconURL: 'https://els-jbs-prod-cdn.jbs.elsevierhealth.com/cms/attachment/509c7bcc-8b8a-4070-a935-9437be306e19/fx1_lrg.jpg', url: 'https://github.com/bmirza101/CovidDiscordBot' })
	.setDescription('Covid data provided by CovidBot')
	.setThumbnail('https://els-jbs-prod-cdn.jbs.elsevierhealth.com/cms/attachment/509c7bcc-8b8a-4070-a935-9437be306e19/fx1_lrg.jpg')
	.addFields(
		{ name: 'Today Cases', value: (tData.change_cases).toString() + ' (' + diffCases+ ')'},
		{ name: 'Today Hospitlization', value: (tData.total_hospitalizations).toString() + ' (' + diffHospital + ')', inline:true},
		{ name: 'Today ICU', value: (tData.total_criticals).toString() + ' (' + diffICU + ')', inline:true},
		{ name: 'Today Deaths', value: (tData.change_fatalities).toString() + ' (' + diffDeaths + ')', inline:true},
        { name: 'Yesterday Cases', value: (yData.change_cases).toString() },
		{ name: 'Yesterday Hospitlization', value: (yData.total_hospitalizations).toString(), inline:true},
		{ name: 'Yesterday ICU', value: (yData.total_criticals).toString(), inline:true},
		{ name: 'Yesterday Deaths', value: (yData.change_fatalities).toString(), inline:true},
	)
	.setTimestamp()
    
    const channel = await client.channels.fetch(channelId);
    channel.send({ embeds: [embed] });
}

client.login(config.token);