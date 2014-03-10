(function () {
    var _wwib = function () {
        var self = this;

        function processResponse(what, when, callback) {

            var response = {
                what : what,
                when : when
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
            var url = "http://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon;

            callAPI(url, function (err, data) {
                if (err) {
                    return callback(err);
                }

                callback(null, data);
            });
        }

        function getWeatherForecast(lat, lon, daily, callback) {
            var url = "http://api.openweathermap.org/data/2.5/forecast";

            if (daily) {
                url += "/daily";
            }

            url += "?lat=" + lat + "&lon=" + lon;

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
                    return processResponse(what, new Date(), callback);
                }

                getWeatherForecast(lat, lon, false, function (err, weatherData) {

                    var condition;

                    if (weatherData && _.isArray(weatherData.list)) {
                        condition = _.find(weatherData.list, function (weatherCondition) {

                            return _.contains(conditions, weatherCondition.weather[0].main.toLowerCase());

                        });
                    }

                    if(condition)
                        return processResponse(what, convertWeatherDate(condition.dt), callback);
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

        function findSun(lat, lon, sunrise, what, callback)
        {
            var now = new Date();
            var suntimes = SunRiseSet(now.getFullYear(), now.getMonth() + 1, now.getDate(), lat, lon);

            var suntime = sunrise ? suntimes[0] : suntimes[1];

            now.setUTCHours(0, 0, suntime * 3600);

            processResponse(what, now, callback);
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
            findSun(lat, lon, true, "sunrise", callback);
        }

        self.night = function(callback, lat, lon){
            findSun(lat, lon, false, "sunset", callback);
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
            processResponse("full moon", eventDate, callback);
        }

        self.newMoon = function(callback, lat, lon){
            var now = new Date();
            var eventDate = jdtocd(MoonQuarters(now.getFullYear(), now.getMonth() + 1, now.getDate())[0]);
            processResponse("new moon", eventDate, callback);
        }

        self.moonRise = function(callback){
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
    };

    window.wwib = new _wwib();
})();