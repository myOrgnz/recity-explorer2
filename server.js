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
const trailsKey = process.env.TRAIL_KEY;
const moviesKey = process.env.MOVIES_KEY

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
        // console.log('qqqqqqqqqq', results);
        if (results.rowCount) {
            locationArr.push(results.rows[0])
                // console.log('qqqqqqq', locationArr);

            return results.rows[0];
        } else {
            let url = `https://eu1.locationiq.com/v1/search.php?key=${locationKey}&q=${city}&format=json`;
            return superagent.get(url).then(item => {
                return whatLocation(city, item)
            })

        }
    })

}



function whatLocation(city, data) {

    const location = new Location(city, data);
    let SQL = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *'
    let values = [city, location.formatted_query, location.latitude, location.longitude];
    return client.query(SQL, values).then(results => {
        console.log('wwwwwwwwwwww', results);
        const savedLocation = results.rows[0];
        console.log('ddddddddd', results.rows[0]);
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



//////////////////////////////////movies/////////////////////////


function moviesHandler(req, res) {
    getMovies().then(moviesData => {
        return res.status(200).json(moviesData)
    })
}

function getMovies() {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${moviesKey}&query=${locationArr[0].search_query}`
    return superagent.get(url).then(item => {
        return item.body.results.map(newItem => {
            // console.log('qqqqqqqq', newItem);
            return new Movies(newItem)
        })
    })

}

function Movies(data) {
    this.title = data.title;
    this.overview = data.overview;
    this.average_votes = data.vote_average;
    this.total_votes = data.vote_count;
    this.image_url = data.poster_path;
    this.popularity = data.popularity;
    this.released_on = data.release_date;
}

//////////////////////////////////yelp/////////////////////////


function yelpHandler(req, res) {
    getYelp().then(moviesData => {
        return res.status(200).json(moviesData)
    })
}

function getYelp() {
    // const url = `https://api.yelp.com/v3/businesses/search&search_query=${locationArr[0].search_query}`
    // console.log(url);

    return superagent.get(url).then(item => {
        console.log('qqqqqqqq', newItem);
        return item.body.results.map(newItem => {
            return new Yelp(newItem)
        })
    })

}

function Yelp(data) {
    // this.title = data.title;
    // this.overview = data.overview;
    // this.average_votes = data.vote_average;
    // this.total_votes = data.vote_count;
    // this.image_url = data.poster_path;
    // this.popularity = data.popularity;
    // this.released_on = data.release_date;
}


app.get('/location', locationHandler)
app.get('/weather', weatherHandler)
app.get('/movies', moviesHandler)
app.get('/trails', trialsHandler)
app.get('/yelp', yelpHandler)
app.get('/', proofOfLife)
app.get('*', notFound)
app.use(errorHandler)

client.connect().then(() =>
        app.listen(PORT, () => {
            console.log(`I'm listening to u port ${PORT}`);
        })
    )
    .catch(() => {
        console.log('error');

    })