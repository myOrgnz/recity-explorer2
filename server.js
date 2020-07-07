'use strict ';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent')
const PORT = process.env.PORT || 3030
let app = express();
app.use(cors());




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
    //    let url = `https://eu1.locationiq.com/v1/search.php?key=9e9a0fc1a97514&q=amman&format=json`
    //     let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=633a7b9f768b4256afb163f7086f2be6`;

//////////////////////Location///////////////

function locationHandler(req, res) {
    getLocation(req.query.city).then(locationData => res.status(200).json(locationData))
}

function getLocation(city) {
    let url = `https://eu1.locationiq.com/v1/search.php?key=${locationKey}&q=${city}&format=json`;
    return superagent.get(url).then(item => {
        return new Location(city, item)
    })


}

let locationArr = []

function Location(city, data) {
    this.search_query = city;
    this.formatted_query = data.body[0].display_name;
    this.latitude = data.body[0].lat;
    this.longitude = data.body[0].lon;
    locationArr.push(this)
        // console.log(locationArr);
}

//////////////////////////////////Weather/////////////////////////

function weatherHandler(req, res) {
    getWeather().then(weatherData => {
        // console.log('ooooooooooo', getWeather(req.query.city));
        return res.status(200).json(weatherData)
    })
}

function getWeather() {
    let url = `https://api.weatherbit.io/v2.0/forecast/daily?&lat=${locationArr[0].latitude}&lon=${locationArr[0].longitude}&key=${weatherKey}`;

    return superagent.get(url).then(item => {
        return item.body.data.map(newItem => {
            // console.log('url: ', newItem);
            return new Weather(newItem)
        })
    })

}

function Weather(data) {
    // console.log('uuuuuuuuuuuuuuuu', data.weather);
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
    let url = `https://www.hikingproject.com/data/get-trails?lat=${locationArr[0].latitude}&lon=${locationArr[0].longitude}&key=${trailsKey}`;
    return superagent.get(url).then(item => {
        // console.log('iiiiiiiiiii', item.body.trails);
        return item.body.trails.map(newItem => {
            return new Trials(newItem)
        })

    })
}

function Trials(data) {
    console.log('uuuuuuuuuuuuu', data);

    this.name = data.trails.name;
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


app.listen(PORT, () => {
    console.log(`I'm listening to u port ${PORT}`);

})