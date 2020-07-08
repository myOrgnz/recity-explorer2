'use strict ';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const PORT = process.env.PORT || 3030
let app = express();
app.use(cors());

const client = new pg.Client(process.env.DATABASE_URL)
client.on('error', err => console.error(err))


function proofOfLife(req, res) {
    res.status(200).send('I CAN SEE U O.O')

}

function errorHandler(error, req, res) {
    res.status(500).send('OOPS, SMTH WRONG *.*')
}

function notFound(req, res) {
    res.status(500).send(' PAGE NOT FOUND  -_-')
}

const locationKey = process.env.LOCATION_KEY;
const weatherKey = process.env.WEATHER_KEY;
const trailsKey = process.env.TRAIL_KEY

//////////////////////Location///////////////

function locationHandler(req, res) {
    getLocation(req.query.city).then(locationData => {
        return res.status(200).json(locationData)
    })
}

function getLocation(city) {
    let SQL = 'select * FROM locations WHERE search_query = $1';
    let values = [city];

    return client.query(SQL, values).then(results => {
        if (results.rowCount) {
            return results.rows[0];
        } else {
            let url = `https://eu1.locationiq.com/v1/search.php?key=${locationKey}&q=${city}&format=json`;
            return superagent.get(url).then(item => {
                return whatLocation(city, item)
            })

        }
    })
}

let allLocations = {};


function whatLocation(city, data) {

    const location = new Location(city, data);
    let SQL = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *'
    let values = [city, location.formatted_query, location.latitude, location.longitude];
    return client.query(SQL, values).then(results => {
        const savedLocation = results.rows[0];
        allLocations[city] = savedLocation;
        return savedLocation
    })
}

let locationArr = []

function Location(city, data) {
    this.search_query = city;
    this.formatted_query = data.body[0].display_name;
    this.latitude = data.body[0].lat;
    this.longitude = data.body[0].lon;
    locationArr.push(this)
}

//////////////////////////////////Weather/////////////////////////

function weatherHandler(req, res) {
    getWeather().then(weatherData => {
        return res.status(200).json(weatherData)
    })
}

function getWeather() {
    let url = `https://api.weatherbit.io/v2.0/forecast/daily?&lat=${locationArr[0].latitude}&lon=${locationArr[0].longitude}&key=${weatherKey}`;

    return superagent.get(url).then(item => {
        return item.body.data.map(newItem => {
            return new Weather(newItem)
        })
    })

}

function Weather(data) {
    this.forecast = data.weather.description;
    this.time = new Date(data.ts * 1000).toDateString();
}
//////////////////////////////////trials/////////////////////////

function trialsHandler(req, res) {
    getTrials().then(trailsData => {
        return res.status(200).json(trailsData)
    })
}

function getTrials() {
    const url = `https://www.hikingproject.com/data/get-trails?lat=${locationArr[0].latitude}&lon=${locationArr[0].longitude}&maxDistance=200&maxResults=10&sort:distance&key=${trailsKey}`
    return superagent.get(url).then(item => {
        return item.body.trails.map(newItem => {
            return new Trials(newItem)
        })

    })
}



function Trials(data) {
    this.name = data.name;
    this.location = data.location;
    this.length = data.length;
    this.stars = data.stars;
    this.star_votes = data.starVotes;
    this.summary = data.summary;
    this.trail_url = data.url;
    this.conditions = data.difficulty;
    this.condition_date = data.conditionDate;

}

app.get('/location', locationHandler)
app.get('/weather', weatherHandler)
app.get('/trials', trialsHandler)

app.get('/', proofOfLife)
app.get('*', notFound)
app.use(errorHandler)

// console.log('wwwwwwwwwwww', client.connect());

client.connect().then(() =>
        app.listen(PORT, () => {
            console.log(`I'm listening to u port ${PORT}`);
        })
    )
    .catch(() => {
        console.log('error');

    })