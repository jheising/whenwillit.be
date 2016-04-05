(function () {
    var _wwib = function () {
        var self = this;
        
        // Yes I know putting my APPID in here is wrong, but it's meant to be a client side only web app.
        // If you feel like stealing my free APPID, then shame on you. I guess.
        var APPID = "b0771701200131843c3bbf08e46d5a4f";

        function processResponse(what, whenStart, whenEnd, callback) {

            var response = {
                what : what,
                whenStart : whenStart,
                whenEnd : whenEnd
            };

            callback(null, response);
        }

        function convertWeatherDate(dateNumber)
        {
            var date = new Date(dateNumber * 1000);
            date.setTime(date.getTime() + (date.getTimezoneOffset() * 60 * 1000));
            return date;
        }

        function processNotFoundResponse(callback)
        {
            callback("not found");
        }

        function getCurrentWeather(lat, lon, callback) {
            var url = "http://api.openweathermap.org/data/2.5/weather?APPID=" + APPID + "&lat=" + lat + "&lon=" + lon;

            callAPI(url, function (err, data) {
                if (err) {
                    return callback(err);
                }

                callback(null, data);
            });
        }

        var _MS_PER_DAY = 1000 * 60 * 60 * 24;
        function dateDiffInDays(a, b) {
            // Discard the time and time-zone information.
            var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
            var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

            return Math.floor((utc2 - utc1) / _MS_PER_DAY);
        }

        function getWeatherForecast(lat, lon, daily, callback) {
            var url = "http://api.openweathermap.org/data/2.5/forecast";

            if (daily) {
                url += "/daily";
            }

            url += "?lat=" + lat + "&lon=" + lon + "&APPID=" + APPID;

            callAPI(url, function (err, data) {
                if (err) {
                    return callback(err);
                }

                callback(null, data);
            });
        }

        function findWeatherConditions(lat, lon, what, conditions, callback) {

            // Get the current weather first
            getCurrentWeather(lat, lon, function(err, weatherData){

                if(!err && weatherData && _.contains(conditions, weatherData.weather[0].main.toLowerCase()))
                {
                    var now = new Date();

                    if(what == "sunny") { // Only return sunny during daytime
                        getSunRiseSet(now, lat, lon, false, function (sunrise, sunset) {
                            if (now >= sunset) {
                                return processNotFoundResponse(callback);
                            }
                            else {
                                return processResponse(what, now, null, callback);
                            }
                        });

                        return;
                    }
                    else {
                        return processResponse(what, now, null, callback);
                    }
                }

                getWeatherForecast(lat, lon, false, function (err, weatherData) {

                    var condition;

                    if (weatherData && _.isArray(weatherData.list)) {
                        condition = _.find(weatherData.list, function (weatherCondition) {

                            return _.contains(conditions, weatherCondition.weather[0].main.toLowerCase());

                        });
                    }

                    if(condition)
                        return processResponse(what, convertWeatherDate(condition.dt), null, callback);
                    else
                        return processNotFoundResponse(callback);
                });
            });
        }

        function callAPI(url, callback) {
            $.ajax({
                url: url,
                cache: false
            })
                .done(function (data) {
                    callback(null, data);
                })
                .fail(function (err) {
                    callback(err, null);
                });
        }

        function getSunRiseSet(date, lat, lon, returnOnlyInFuture, callback)
        {
            var now = new Date();
            var suntimes = SunRiseSet(date.getFullYear(), date.getMonth() + 1, date.getDate(), lat, lon);

            var sunrise = suntimes[0];
            var sunset = suntimes[1];

            var sunriseDate = new Date();
            sunriseDate.setUTCHours(0, 0, sunrise * 3600);
            sunriseDate.setDate(date.getDate());
            sunriseDate.setMonth(date.getMonth());

            var sunsetDate = new Date();
            sunsetDate.setUTCHours(0, 0, sunset * 3600);
            sunsetDate.setDate(date.getDate());
            sunsetDate.setMonth(date.getMonth());

            // If the date has passed, try again for tomorrow
            if(returnOnlyInFuture && (sunriseDate < now || sunsetDate < now))
            {
                var tomorrow = new Date();
                tomorrow.setDate(now.getDate() + 1);
                getSunRiseSet(tomorrow, lat, lon, false, function(newSunriseDate, newSunsetDate){

                    if(sunriseDate < now)
                    {
                        sunriseDate = newSunriseDate;
                    }

                    if(sunsetDate < now)
                    {
                        sunsetDate = newSunsetDate;
                    }

                    callback(sunriseDate, sunsetDate);
                });
            }
            else
            {
                callback(sunriseDate, sunsetDate);
            }
        }

        /*function findMoon(lat, lon, moonrise, what, callback)
        {
            var now = new Date();

            var mrs=MoonRise(now.getFullYear(), now.getMonth() + 1, now.getDate(), lat, lon);
            if ((mrs[0]<0) && (mrs[1]<0)) {
                if (mrs[0]==-1) {
                    document.write("Moon is down all day<br>");
                } else {
                    document.write("Moon is up all day<br>");
                }
            } else {
                if (mrs[1]<=mrs[0]) {
                    if (mrs[1]>=0) {
                        document.write("Moon sets at&nbsp;&nbsp;"+hmstring(mrs[1])+" "+TZname+"<br>");
                    }
                    if (mrs[0]>=0) {
                        document.write("Moon rises at&nbsp;"+hmstring(mrs[0])+" "+TZname+"<br>");
                    }
                } else {
                    if (mrs[0]>=0) {
                        document.write(" Moon rises at&nbsp;"+hmstring(mrs[0])+" "+TZname+"<br>");
                    }
                    if (mrs[1]>=0) {
                        document.write(" Moon sets at&nbsp;&nbsp;"+hmstring(mrs[1])+" "+TZname+"<br>");
                    }
                }
            }

            var suntime = sunrise ? suntimes[0] : suntimes[1];

            now.setUTCHours(0, 0, suntime * 3600);

            processResponse(what, now, callback);
        }*/

        // --------------- WWIB FUNCTIONS ---------------
        self.processResponse = processResponse;

        self.drinkingTime = function (callback) {
            var startTime = moment({hour: 17}); // 5:00 today
            var endTime = moment({hour:9}).add({day:1}); // 9:00 tomorrow
            processResponse("drinking time", startTime.toDate(), endTime.toDate(), callback);
        }

        self.sunny = function (callback, lat, lon) {
            findWeatherConditions(lat, lon, "sunny", ["clear","sunny"], callback);
        }

        self.rainy = function (callback, lat, lon) {
            findWeatherConditions(lat, lon, "rainy", ["rain"], callback);
        }

        self.clear = function (callback, lat, lon) {
            findWeatherConditions(lat, lon, "clear", ["clear","sunny"], callback);
        }

        self.cloudy = function (callback, lat, lon) {
            findWeatherConditions(lat, lon, "cloudy", ["clouds"], callback);
        }

        self.day = function(callback, lat, lon){

            var now = new Date();

            getSunRiseSet(now, lat, lon, false, function(sunrise, sunset)
            {
                if(now >= sunset)
                {
                    // Get the sunrise tomorrow
                    getSunRiseSet(now, lat, lon, true, function(newSunrise, newSunset)
                    {
                        processResponse("day", newSunrise, null, callback);
                    });
                }
                else
                {
                    processResponse("day", sunrise, sunset, callback);
                }
            });
        };

        self.night = function(callback, lat, lon){

            var now = new Date();

            getSunRiseSet(now, lat, lon, false, function(sunrise, sunset)
            {
                if(now >= sunset)
                {
                    // Get the sunrise tomorrow
                    getSunRiseSet(now, lat, lon, true, function(newSunrise, newSunset)
                    {
                        processResponse("day", sunset, newSunrise, callback);
                    });
                }
                else
                {
                    processResponse("day", sunset, null, callback);
                }
            });
        }

        self.sunrise = function(callback, lat, lon){
            getSunRiseSet(new Date(), lat, lon, true, function(sunrise, sunset){
                processResponse("sunrise", sunrise, null, callback);
            });
        }

        self.sunset = function(callback, lat, lon){
            getSunRiseSet(new Date(), lat, lon, true, function(sunrise, sunset){
                processResponse("sunset", sunset, null, callback);
            });
        }

        self.windy = function (callback, lat, lon) {
        }

        self.calm = function (callback, lat, lon) {
        }

        self.warm = function(callback, lat, lon){
        }

        self.cold = function(callback, lat, lon){
        }

        self.fullMoon = function(callback){
            var now = new Date();
            var eventDate = jdtocd(MoonQuarters(now.getFullYear(), now.getMonth() + 1, now.getDate())[2]);

            // If the date is in the past, try next month
            if(dateDiffInDays(now,eventDate) < 0)
            {
                now.setMonth(now.getMonth() + 1);
                eventDate = jdtocd(MoonQuarters(now.getFullYear(), now.getMonth() + 1, now.getDate())[2]);
            }

            processResponse("full moon", eventDate, null, callback);
        }

        self.newMoon = function(callback, lat, lon){
            var now = new Date();
            var eventDate = jdtocd(MoonQuarters(now.getFullYear(), now.getMonth() + 1, now.getDate())[0]);

            // If the date is in the past, try next month
            if(dateDiffInDays(now,eventDate) < 0)
            {
                now.setMonth(now.getMonth() + 1);
                eventDate = jdtocd(MoonQuarters(now.getFullYear(), now.getMonth() + 1, now.getDate())[0]);
            }

            processResponse("new moon", eventDate, null, callback);
        }

        self.moonRise = function(callback, lat, lon){
        }

        self.moonSet = function(callback, lat, lon){
        }

        self.highTide = function(callback, lat, lon){
        }

        self.lowTide = function(callback, lat, lon){
        }

        // When will a place be open
        self.open = function(callback, lat, lon, placeName){
        }

        // When will a place be closed
        self.closed = function(callback, lat, lon, placeName){
        }

        // When will an airplane be arriving
        self.arriving = function(callback, flightInfo){
        }

        self.leapYear = function(callback)
        {
            var date = new Date();
            var year = date.getFullYear();

            // Move on if it's already passed
            if(date.getMonth() > 2 || (date.getMonth() == 2 && date.getDay() >= 29))
            {
                year++;
            }

            while(!(((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)))
            {
                year++;
            }

            date.setFullYear(year);
            date.setMonth(1);
            date.setDate(29);
            date.setHours(0,0,0);

            processResponse("leap year", date, null, callback);
        };

        self.newYear = function(callback)
        {
            var date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            date.setDate(1);
            date.setMonth(0);
            date.setHours(0,0,0);
            processResponse("new year", date, null, callback);
        }
    };

    window.wwib = new _wwib();
})();
