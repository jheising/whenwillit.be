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

    var locationFound = (userLat && userLon) ? true : false;

    function updateOverscroll() {
        var newSize = $(window).height() - topClearance - 74;
        $("#noun-list-container").css({"padding-bottom": newSize});
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

                    $("#add-to-ics").unbind().bind("click", function () {

                        download_ics(action.wwib, eventTitle, eventDescription, "", eventDateStringStart, eventDateStringStop);

                    });
                }

                startCountdownTimer(whenStart);
            }

            $("#answer-time").text(whenMoment.calendar());
        }

        $("#answer-full-time").text(whenMoment.format("dddd, MMMM Do YYYY @ h:mm:ss a")).show();

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

    function displayAddressFinder() {
        var locationMessage = "<p>We need to know your location before we can give you an answer. Try refreshing your browser after a few seconds or type your address or place here:</p>";
        locationMessage += '<div id="address-input-container"><input id="address-input"><button id="address-find-button">FIND</button></div><div id="address-results"></div>';
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

        $("#search-field").blur();
        isDragging = false;
        selectedActionElement = element;
        var action = element.data("action");

        // Update Google analytics
        if (action && action.wwib) {
            location.hash = "#" + action.wwib;
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
                        }
                        else {
                            $("#answer-time").text("OOPS. TRY AGAIN.");
                        }

                        $("#answer-full-time").hide();
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
                newBackground.animate({'opacity': 0.3}, 500);
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
    }).on('input', function () {
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
    }).on('keypress', function(e){

            // If we press enter and there is only one item visible, go to it
            if (e.which == 13 && $("ul#noun-list li:visible").length == 2)
            {
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
    $("#noun-list-container").bind('mousedown touchstart',function () {
        mouseDown = true;
    }).bind('mouseup touchend', function () {
            mouseDown = false;
        });

    var movement = false;
    $("#noun-list-container").bind('scroll touchmove', function () {

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

    $.each(wwibActions, function (index, action) {

        $("ul#noun-list").append($("<li></li>").attr({"data-action": action.wwib}).data("action", action).text(action.wwib).on("touchend click", nounClick));

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

        if (location.hash) {
            var actionString = decodeURIComponent(location.hash.replace("#", "").replace(/[+]/g, " "));
            navigateToActionElement($("li[data-action*='" + actionString + "']"));
        }
    });
});