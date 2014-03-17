/*
 ©2014 Jim Heising. All Rights Reserved.
 */

$(function () {

    $("#response").hide();

    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    var topClearance = 200;
    var selectedActionElement = $("ul#noun-list li:first");
    var currentAction;
    var _showingAllNouns = true;
    var isDragging = false;
    var scrollTimer;
    var userLat = $.cookie('user_lat') ? Number($.cookie('user_lat')) : undefined;
    var userLon = $.cookie('user_lon') ? Number($.cookie('user_lon')) : undefined;
    var userPlaceName = $.cookie('place_name');
    var customAction;
    var customDate;
    var customDateHasTime = false;

    var locationFound = (userLat && userLon) ? true : false;

    if (!/Chrome/i.test(navigator.userAgent) && !isMobile) {
        $("head").append("<style>.big-text{-webkit-text-stroke: 0.5px #fff;}</style>");
    }

    function isValidDate(d) {
        if (Object.prototype.toString.call(d) !== "[object Date]")
            return false;
        return !isNaN(d.getTime());
    }

    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    function updateOverscroll() {
        var newSize = $(window).height() - topClearance - 64;
        $("#noun-list").css({"margin-bottom": newSize});
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function setPlacename(placeName) {
        $.cookie('place_name', placeName, { expires: 365, path: '/' });
        userPlaceName = placeName;
    }

    function setUserLocation(lat, lon, placeName) {
        $.cookie('user_lat', lat.toString(), { expires: 365, path: '/' });
        $.cookie('user_lon', lon.toString(), { expires: 365, path: '/' });

        if (placeName) {
            setPlacename(placeName);
        }

        userLat = lat;
        userLon = lon;
        locationFound = true;
    }

    // Does this browser support geolocation?
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            setUserLocation(position.coords.latitude, position.coords.longitude);
        }, function (error) {

        });
    }

    $("#loader").hide();
    $(".top-clearance").css({marginTop: topClearance});

    function displayMessage(bigText, tinyText) {
        $("#countdown").hide();
        $("#answer-source-container").hide();
        $("#answer-time").text(bigText);
        $("#answer-full-time").html(tinyText);

        $("#response").fadeIn();
    }


    function displayAnswer(action, source, what, whenStart, whenEnd) {
        var now = new Date();
        var whenMoment = moment(whenStart);

        // If this date is within 5 minutes, go ahead an call it now
        if ((whenEnd && now >= whenStart && now <= whenEnd) || Math.abs(now - whenStart) * 1000 <= 300000) {
            $("#answer-time").text("NOW");
        }
        else {

            if (whenStart > now) {
                if (!isMobile) {
                    $("#event-tools-wrapper").show();

                    var startTime = moment(whenMoment).utc();
                    var endTime = moment(whenMoment).add("hours", 1).utc();

                    var eventDateFormat = "YYYYMMDDThhmmss[Z]";
                    var eventTitle = action.wwib + "!";
                    var eventDescription = "By http://whenwillit.be\r\n\r\nSee " + location.href + " for more details.";
                    var eventDateStringStart = startTime.format(eventDateFormat);
                    var eventDateStringStop = endTime.format(eventDateFormat);

                    // Setup our calendar buttons
                    var googleURL = "https://www.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(eventTitle) + "&dates=" + encodeURIComponent(eventDateStringStart) + "/" + eventDateStringStop + "&details=" + encodeURIComponent(eventDescription) + "&pli=1&uid=&sf=true&output=xml";
                    $("#add-to-google").attr("href", googleURL);

                    var yahooURL = "https://calendar.yahoo.com/?v=60&view=d&type=20&url=&title=" + encodeURIComponent(eventTitle) + "&st=" + encodeURIComponent(eventDateStringStart) + "s&dur=-1700&desc=" + encodeURIComponent(eventDescription) + "&in_loc=&uid=";
                    $("#add-to-yahoo").attr("href", yahooURL);

                    $("#add-to-ics").unbind().on("click", function () {

                        download_ics(action.wwib, eventTitle, eventDescription, "", eventDateStringStart, eventDateStringStop);

                    });
                }

                startCountdownTimer(whenStart);
            }

            if (action.hide_time) {
                moment.lang('en', {
                    calendar: {
                        lastDay: '[Yesterday]',
                        sameDay: '[Today]',
                        nextDay: '[Tomorrow]',
                        lastWeek: '[last] dddd',
                        nextWeek: 'dddd',
                        sameElse: 'L'
                    }
                });
            }
            else {
                moment.lang('en', {
                    calendar: {
                        lastDay: '[Yesterday at] LT',
                        sameDay: '[Today at] LT',
                        nextDay: '[Tomorrow at] LT',
                        lastWeek: '[last] dddd [at] LT',
                        nextWeek: 'dddd [at] LT',
                        sameElse: 'L'
                    }
                });
            }

            $("#answer-time").text(whenMoment.calendar());
        }

        if (action.hide_time) {
            $("#answer-full-time").text(whenMoment.format("dddd, MMMM Do YYYY")).show();
        }
        else {
            $("#answer-full-time").text(whenMoment.format("dddd, MMMM Do YYYY @ h:mm:ss a")).show();
        }

        if (source) {
            $("#answer-source").text(source.name).attr("href", source.url);
            $("#answer-source-container").show();
        }
        else {
            $("#answer-source-container").hide();
        }

        $("#response").fadeIn();
    }

    function processGeoLocationClick(event) {
        var geolocation = $(event.target).data("location");
        setUserLocation(geolocation.geometry.location.lat(), geolocation.geometry.location.lng());

        if (selectedActionElement) {
            processSelectedAction(selectedActionElement);
        }
    }

    function createCustomLink(what, whenDate, whenTime, bgPicture) {
        var eventDate = new Date(Date.parse(whenDate + " " + whenTime));

        what = encodeURIComponent(what);
        what = what.replace(/%20/g, "-");

        var customURL = "http://whenwillit.be?what=" + what;

        if (isValidDate(eventDate)) {
            if (whenTime) {
                customURL += "&datetime=";
            }
            else {
                customURL += "&date=";
            }

            customURL += eventDate.getTime() / 1000 / 60;
        }

        if(bgPicture)
        {
            customURL += "&bg=" + encodeURIComponent(bgPicture);
        }

        $("#custom-link").attr("href", customURL).text(customURL);
    }

    function displayCreateCustom() {

        function doCustomLink() {
            createCustomLink(
                $('#what-input').val(),
                $('#when-date-input').val(),
                $('#when-time-input').val(),
                $('#custom-bg-input').val()
            );
        }

        $("#response").fadeOut(function () {
            $("#event-tools-wrapper").hide();
            var message = '<div class="row space"><div class="col-xs-2 text-right input-label">what?</div><div class="col-xs-10"><input id="what-input" class="custom"></div></div>';
            message += '<div class="row space"><div class="col-xs-2 text-right input-label">when?</div><div class="col-xs-5"><input id="when-date-input" class="custom" placeholder="date"></div><div class="col-xs-5"><input id="when-time-input" class="custom" placeholder="time"></div></div>';
            message += '<div class="row space"><div class="col-xs-2 text-right input-label">picture</div><div class="col-xs-10"><input id="custom-bg-input" class="custom" placeholder="a url to a custom background, or leave blank"></div></div>';
            message += '<div class="row"><div class="col-xs-2 text-right input-label">link</div><div class="col-xs-10 input-label"><a id="custom-link"></a></div></div>';
            //message += '<div class="row"><div class="col-xs-offset-2 col-xs-10 input-label"><ul class="list-inline"><li><a id="custom-twitter-share"><i class="fa fa-twitter-square"></i> Tweet</a></li></ul></div></div>';
            displayMessage("CREATE YOUR OWN.", message);

            $('#what-input').val(customAction).on("keyup change", doCustomLink);


            if(customDate)
            {
                var customDateMoment = moment(customDate);

                $('#when-date-input').attr("data-value", customDateMoment.format("MMMM D, YYYY"));

                if(customDateHasTime)
                {
                    $('#when-time-input').attr("data-value", customDateMoment.format("h:mm A"));
                }
            }

            $('#when-date-input').pickadate({
                format: 'mmmm d, yyyy',
                editable: true,
                selectYears: true,
                selectMonths: true
            }).on("keyup change", doCustomLink);

            $('#when-time-input').pickatime({
                editable: true
            }).on("keyup change", doCustomLink);

            $('#custom-bg-input').on("keyup change", doCustomLink);

            doCustomLink();
        });
    }

    function displayAddressFinder() {
        var locationMessage = "<p>We need to know your location before we can give you an answer. Try refreshing your browser after a few seconds or type your address or place here:</p>";
        locationMessage += '<div id="address-input-container"><input id="address-input" class="custom"><button id="address-find-button">FIND</button></div><div id="address-results"></div>';
        locationMessage += '<p id="address-lookup-error"></p>';

        $("#loader").hide();
        displayMessage("WHERE ARE YOU?", locationMessage);

        $('#address-input').keypress(function (e) {
            if (e.which == 13) {
                $("#address-find-button").trigger("click");
            }
        });

        $("#address-find-button").on("touchend click", function () {
            $("#address-lookup-error").hide();
            $("#address-find-button").prop('disabled', true);

            var counter = 1;
            var loadingTimer = setInterval(function () {

                $("#address-find-button").text(Array(counter + 1).join("."));

                counter++;

                if (counter >= 7) {
                    counter = 1;
                }
            }, 1000);

            var geocoder = new google.maps.Geocoder();

            geocoder.geocode({ 'address': $("#address-input").val() }, function (results, status) {

                clearInterval(loadingTimer);
                $("#address-find-button").prop('disabled', false).text("FIND");

                if (status == google.maps.GeocoderStatus.OK) {
                    var resultsList = $('<ul class="list-unstyled"></ul>');

                    $("#address-results").empty().append(resultsList).show();

                    resultsList.append($("<li>Select one:</li>"));

                    _.each(results, function (result) {
                        var resultElement = $("<a></a>").text(result.formatted_address).data("location", result).on("touchend click", processGeoLocationClick);
                        resultsList.append($("<li></li>").append(resultElement));
                    });
                }
                else if (status == google.maps.GeocoderStatus.ZERO_RESULTS) {
                    $("#address-lookup-error").text("Oops. We couldn't find this place. Try something else?").show();
                }
                else {
                    $("#address-lookup-error").text("Oops, something went wrong. Try again.").show();
                }
            });

        });
    }

    function startCountdownTimer(date) {
        $('#countdown').css({opacity: 1.0}).countdown(date, function (event) {
            $this = $(this);
            switch (event.type) {
                case "seconds":
                case "minutes":
                case "hours":
                case "days":
                case "weeks":
                case "daysLeft":
                    $this.find('div#' + event.type).html(event.value);
                    break;
                case "finished":
                    $this.fadeTo('slow', .5);
                    break;
            }
        });

        $("#countdown").show();
    }

    function stopCountdownTimer() {
        $("#countdown").hide();
    }

    function processSelectedAction(element) {

        $("#background-attribution-container").hide();
        $("#search-field").blur();
        isDragging = false;
        selectedActionElement = element;
        var action = element.data("action");

        if (!customAction && action && (action.wwib || action.anchor)) {
            location.hash = "#" + (action.anchor || action.wwib);

            // Update Google analytics
            ga('send', 'event', 'action', 'completed', action.wwib);
        }
        else {
            location.hash = "";
        }

        stopCountdownTimer();
        $("#loader").hide();
        $("#event-tools-wrapper").hide();

        $("#response").fadeOut(function () {

            if (action && action.function && wwib[action.function]) {

                $("#loader").show();

                currentAction = action.function;

                // Does this action require location data?
                if (action.requires_position && !locationFound) {
                    return displayAddressFinder();
                }

                wwib[action.function](function (err, response) {

                    // Ignore this response if it's old
                    if (currentAction != action.function) {
                        return;
                    }

                    $("#loader").hide();

                    if (err) {
                        if (err == "not found") {
                            $("#answer-time").text("UNCERTAIN.");
                            $("#answer-full-time").hide();
                        }
                        else {
                            $("#answer-time").text("OOPS.");
                            $("#answer-full-time").text(err.toString());
                        }

                        $("#answer-source-container").hide();
                        $("#response").fadeIn();
                        return;
                    }

                    displayAnswer(action, action.source, response.what, response.whenStart, response.whenEnd);

                }, userLat, userLon);
            }
            else {
                currentAction = null;
            }
        });

        var oldBackground = $("#background-container > .full-background");

        function fadeOldBackground() {
            oldBackground.fadeOut(500, function () {
                oldBackground.remove();
            });
        }

        if (action && action.backgrounds && action.backgrounds.length) {

            var imageSource = action.backgrounds[getRandomInt(0, action.backgrounds.length - 1)];

            if (_.isObject(imageSource)) {
                $("#background-attribution").text(imageSource.attr_name).attr("href", imageSource.attr_link);
                $("#background-attribution-container").show();

                imageSource = imageSource.src;
            }
            else {
                $("#background-attribution-container").hide();
            }

            var newBackground = $('<div class="full-background"></div>').css({"background-image": "url(" + imageSource + ")", "opacity": 0});

            $("#background-container").append(newBackground);

            $('<img>').attr('src', imageSource).load(function () {
                fadeOldBackground();
                newBackground.animate({'opacity': 0.25}, 500);
            });
        }
        else {
            fadeOldBackground();
        }
    }

    function navigateToActionElement(element) {
        // Ignore clicks when the list is scrolling
        if (!element || element.length == 0 || isDragging) {
            return;
        }

        $("ul#noun-list li").show();

        var container = $("#noun-list-container");
        var scrollTo = $(element);

        $(scrollTo).data("snapping", true);
        container.animate({scrollTop: scrollTo.position().top - container.position().top + container.scrollTop() - topClearance}, 250, function () {
            isDragging = false;
            processSelectedAction(scrollTo);
        });
    }

    function nounClick(event) {
        navigateToActionElement(event.target);
    }

    // If the user starts typing, show search box
    /*$(document).keypress(function (e) {
     if (!$("#search-field").is(":focus")) {
     $("#search-field").focus();
     }
     });*/

    $("#search-field").focus(function () {
        $("ul#noun-list li").data("snapping", true);
        $("#noun-list-container").scrollTop(0);
        isDragging = false;
        $("ul#noun-list li:first").animate({'opacity': 0.0});
    }).on('input',function () {
            var searchValue = $(this).val().toLowerCase();

            if (searchValue.length == 0) {
                $("ul#noun-list li").show();
            }
            else {
                $("ul#noun-list li").hide();
                $("ul#noun-list li:first").show();
                $("li[data-action*='" + searchValue + "']").show();
                _showingAllNouns = false;
            }
        }).on('keypress', function (e) {

            // If we press enter and there is only one item visible, go to it
            if (e.which == 13 && $("ul#noun-list li:visible").length == 2) {
                $("#search-field").blur();
                navigateToActionElement($("ul#noun-list li:visible").last());
            }
        });

    $("#search-field").focusout(function (event) {
        $(this).val("");
        setTimeout(function () {
            $("ul#noun-list li").show();
        }, 100);
        $("ul#noun-list li:first").animate({'opacity': 1.0});
    });

    $("#create-your-own").on("touchend click", displayCreateCustom);

    // When we click on a noun
    $("ul#noun-list li").on("touchend click", nounClick);

    $("#noun-list-container").kinetic().css({"cursor": "pointer"});

    $("#noun-list-container").scrollsnap({
        snaps: 'ul#noun-list li',
        proximity: 50,
        offset: -topClearance,
        onSnap: processSelectedAction
    });

    function onDragStarted() {
        isDragging = true;
        $("#search-field").blur();
        $("#noun-list-container").css({"z-index": 100});
        $("#search-field-container").css({"z-index": 50});
        $("#search-field").prop('disabled', true);
    }

    function onDragStopped() {
        isDragging = false;
        $("#noun-list-container").css({"z-index": 50});
        $("#search-field-container").css({"z-index": 100});
        $("#search-field").prop('disabled', false);
    }

    var mouseDown = false;
    $("#noun-list-container").on('mousedown touchstart',function () {
        mouseDown = true;
    }).on('mouseup touchend', function () {
            mouseDown = false;
        });

    var movement = false;
    $("#noun-list-container").on('scroll touchmove', function () {

        if (!movement && mouseDown) {
            movement = true;
            onDragStarted();
        }

        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {

            if (mouseDown) {
                return;
            }

            movement = false;
            onDragStopped();

        }, 150);
    });

    // Has the user specified their own custom action?
    customAction = getParameterByName("what");
    if (customAction) {

        customAction = decodeURIComponent(customAction.replace(/[+-]/g, " "));

        customDateHasTime = true;
        var customDateString = getParameterByName("datetime");
        var customBackground = getParameterByName("bg");

        if (!customDateString) {
            customDateHasTime = false;
            customDateString = getParameterByName("date");
        }

        // Treat the date as a number first
        customDate = new Date(Number(customDateString) * 60 * 1000);

        // If the date is invalid, try parsing it as a last resort
        if (!isValidDate(customDate)) {
            customDate = new Date(Date.parse(customDateString));
        }

        // Add our custom wwib callback
        wwib.custom = function (callback) {
            if (!isValidDate(customDate)) {
                return callback("This doesn't appear to be a valid date.");
            }

            wwib.processResponse(customAction, customDate, null, callback);
        }

        var actionDef = {
            wwib: customAction,
            requires_position: false,
            anchor: "custom",
            hide_time: !customDateHasTime,
            function: "custom"
        };

        if(customBackground)
        {
            actionDef.backgrounds = [ customBackground ];
        }

        wwibActions.unshift(actionDef);
    }

    $.each(wwibActions, function (index, action) {

        $("ul#noun-list").append($("<li></li>").attr({"data-action": action.wwib, "data-hash": (action.anchor || action.wwib)}).data("action", action).text(action.wwib).on("touchend click", nounClick));

    });

    updateOverscroll();

    $(window).resize(function () {
        updateOverscroll();
    });

    // Prevent bounce in mobile Safari
    $(document).on('touchmove', function (e) {
        e.preventDefault();
    });

    $("#main-container").fadeIn(function () {
        if (customAction) {
            navigateToActionElement($("li[data-hash='custom']"));
        }
        else if (location.hash) {
            navigateToActionElement($("li[data-hash='" + location.hash.replace("#", "") + "']"));
        }
    });
});