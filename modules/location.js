'use strict ';

const superagent = require('superagent');
const locationKey = process.env.LOCATION_KEY;
const client = require('./client.js')

function getLocation(city) {
    let SQL = 'select * FROM locations WHERE search_query = $1';
    let values = [city];

    return client.query(SQL, values).then(results => {
        if (results.rowCount) {
            locationArr.push(results.rows[0])
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

module.exports = { getLocation, locationArr }