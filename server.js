const apiKey = 'cc2d97cee33bba342aa3a2b90960ccf4';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express()
const router = express.Router();
app.use('/', router);
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')

/**
 * Function to calculate the 5 day forecast values by calling the OpenWeatherMap API
   and render the result on front end. Returns an error message in case the call fails
   or the user entered an invalid city name.
 */
function getForecast(city, resp, r)
{
  let url = `http://api.openweathermap.org/data/2.5/forecast?q=${city}&units=imperial&appid=${apiKey}`;
  request(url, function (err, response, body) {
    if(err){
      resp.render('index', {weather: null, current: null, city: undefined, error: 'Error'});
    }
    else {
      // Store the result in an object with key value as date
      var res = {};
      let weather = JSON.parse(body);
      var today = new Date();
      today = today.toLocaleString().split(" ")[0];
      // API returns a city not found message
      if(weather.message == 'city not found'){
        resp.render('index', {weather: null, current: null, city: undefined, error: 'Error: Enter a valid city name'});
      }
      else {
        if(weather.cod !== '200') {
          resp.render('index', {weather: null, current: null, city: undefined, error: 'Error'});
        }
        // Compute the min and max temperatures for each date from the 5day/3 hour interval forecast data
        var list = weather.list;
        for(var i=0; i<list.length; i++){
          var date = list[i].dt_txt.split(" ")[0];
          if(res[date]!=null){
            if(res[date].max < parseFloat(list[i].main.temp_max)){
              res[date].max = parseFloat(list[i].main.temp_max);
              res[date].icon =  list[i].weather[0].icon;
              res[date].humidity = list[i].main.humidity;
              res[date].description = list[i].weather[0].description;
            }
            if(res[date].min > parseFloat(list[i].main.temp_min)){
              res[date].min = parseFloat(list[i].main.temp_min);
            }
          }
          else{
            // Skip today and add the next 5 day weather data to the result
            if(parseInt(date.split("-")[2]) != parseInt(today.split("-")[2])){
              res[date] = {
                min: parseFloat(list[i].main.temp_min),
                max: parseFloat(list[i].main.temp_max),
                // Weather icon filename to display the appropriate icon
                icon: list[i].weather[0].icon,
                humidity: list[i].main.humidity,
                description: list[i].weather[0].description
              }
            }
          }
        }
        r[0].date = today;
        resp.render('index', {weather: res, current: r, city: city, error: null});
      }
    }
  });
}
app.get('/', function (req, res) {
  res.render('index', {weather: null, current: null, city: undefined, error: null});
})
app.post('/', function (req, resp) {
  let city = req.body.city;
  console.log("city : " + city);
  // Add Tempe as the default city incase the form is submitted without any value
  if(city == "" || city == undefined){
    city = "Tempe";
    //resp.render('index', {weather: null, current: null, city: undefined, error: null});
  }
  // Retrieve the current day's weather data from OpenWeatherMap API
  let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`;
  request(url, function (err, response, body) {
    var r = {};
    let currWeather = JSON.parse(body);
    if(err){
      console.log("Error in retrieving current weather");
    }
    else{
      if(currWeather.code !== 200 && currWeather.message == 'city not found'){
        resp.render('index', {weather: null, current: null, city: undefined, error: 'Error: Enter a valid city name'});
      }
      else{
      r[0] = {
        max: parseInt(currWeather.main.temp_max),
        description: currWeather.weather[0].description,
        humidity: currWeather.main.humidity,
        date: null
        }
        // Get the forecast weather data
        getForecast(city, resp, r);
      }
    }
  });

});

app.listen(8080, function () {
  console.log('Weather app listening on port 8080!');
});
