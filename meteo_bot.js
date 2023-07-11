#!/usr/bin/node

config = require('config');
cheerio = require('cheerio');

if (config.sector == 0) {
	console.log("Error: sector code not configured. Please read the instructions.");
	process.exit(1);
}

alert_icons = {
	'Avalanches': ':snow_capped_mountain: Avalanches',
	'Forestfire': ':fire: Incendies de forêt',
	'Snow': ':snow_cloud: Chutes de neige',
	'Wind': ':tornado: Vent',
	'Heat-Wave': ':thermometer: Canicule',
	'Slippery-Road': ':car: Chaussées glissantes',
	'Flood': ':ocean: Crues',
	'Frost': ':snowflake: Gel',
	'Thunderstorms': ':lightning: Orages',
	'Rain': ':rain_cloud: Pluie',
	'Earthquake': ':dart: Séisme',
};

alert_levels = [
	"Aucun danger",
	"Danger faible",
	"Danger limité",
	"Danger marqué",
	"Danger fort",
	"Danger très fort",
]

alert_colors = [
	'#999999',
	'#ccff66',
	'#ffff00',
	'#ff9900',
	'#ff0000',
	'#800000',
];

async function send_mattermost(payload) {
        //console.log(`-> ${payload}`);
        return await fetch(config.mattermost.url + "/api/v4/posts",
                { 'method': 'POST',
                  'body': JSON.stringify({
                        "channel_id": config.mattermost.channel,
                        "props": { "attachments": [payload] },
                  }),
                  'headers': {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.mattermost.token}`
                  }})
               .catch((error) => { console.log(error) })
}

previous_level = {};
current_level = {};

function should_notify(a) {
	notify = false;
	if (previous_level[a.type] === undefined || a.severity > previous_level[a.type]) {
		notify = true;
	}
	previous_level[a.type] = a.severity;
	current_level[a.type] = a.severity;
	return notify;
}

async function fetch_alerts() {

	const resp = await fetch("https://www.dangers-naturels.ch/home.html?tab=actualdanger");
	const text = await resp.text();
	const $ = cheerio.load(text);

	let entries = [];

	$('#listWarnings .warnText').each((i,e) => {

		const data = $('.warnData', e).text();

		if (!data) return;

		const description = $('.warnDescription', e).text();

		const [idx, type, severity, code, region_string] = data.split(':');
		const regions = (region_string ? region_string.split(',') : []).map(r => +r);

		const entry = { description, type, 'severity': +severity, code, regions };

		entries.push(entry);

	});

	return entries;

}

function render_alert(a) {
	const title = alert_icons[a.type] + " - " + alert_levels[a.severity];
	return {
		'fallback': title,
		'color': alert_colors[a.severity],
		'title': title,
		'text': a.description.split(/\s+/).join(' ')
	}
}


function run() {
	fetch_alerts().then(as => {
		relevant_alerts = as.filter(a => a.regions.includes(config.sector));
		current_level = {};
		for (const a of relevant_alerts) {
			if (should_notify(a)) {
				console.log("Dispatching alert: " + JSON.stringify(a));
				send_mattermost(render_alert(a));
			}
		}
		for (const t in alert_icons) {
			if (!(t in current_level)) {
				previous_level[t] = 0;
			}
		}
	})
	.catch(e => console.log(e));
}

setInterval(run, config.interval);
run()
