$(function () {

    $("#response").hide();

    var topClearance = 200;
    var selectedActionElement = $("ul#noun-list li:first");
    var currentAction;
    var _showingAllNouns = true;
    var isDragging = false;
    var scrollTimer;
    var userLat = 47.6388;
    var userLon = -121.9598;

    function updateOverscroll() {
        var newSize = $(window).height() - topClearance - 50;
        $("#noun-list-container").css({"padding-bottom": newSize});
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function locationSuccess(position) {
        userLat = position.coords.latitude;
        userLon = position.coords.longitude;
    }

    function locationError(error) {
        switch (error.code) {
            case error.TIMEOUT:
                //showError("A timeout occured! Please try again!");
                break;
            case error.POSITION_UNAVAILABLE:
                //showError('We can\'t detect your location. Sorry!');
                break;
            case error.PERMISSION_DENIED:
                //showError('Please allow geolocation access for this to work.');
                break;
            case error.UNKNOWN_ERROR:
                //showError('An unknown error occured!');
                break;
        }

    }

    // Does this browser support geolocation?
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(locationSuccess, locationError);
    }
    else {
        showError("Your browser does not support Geolocation!");
    }

    $("#loader").hide();
    $(".top-clearance").css({marginTop: topClearance});

    function displayAnswer(source, what, when) {
        var now = new Date();
        var whenMoment = moment(when);

        // If this date is within 5 minutes, go ahead an call it now
        if (Math.abs(now - when) * 1000 <= 300000) {
            $("#answer-time").text("NOW");
        }
        else {
            startCountdownTimer(when);
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
                    $this.find('span.' + event.type).html(event.value);
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
        /*try
         {
         $("#countdown").hide().countdown("stop");
         }
         catch(e)
         {
         console.log(e);
         }*/
    }

    function processSelectedAction(element) {
        isDragging = false;
        selectedActionElement = element;
        var action = element.data("action");

        // Update Google analytics
        if(action.wwib)
        {
            ga('send', 'event', 'action', 'completed', action.wwib);
        }

        stopCountdownTimer();
        $("#loader").hide();

        $("#response").fadeOut(function () {

            if (action && action.function && wwib[action.function]) {

                $("#loader").show();

                currentAction = action.function;
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

                    displayAnswer(action.source, response.what, response.when);

                }, userLat, userLon);
            }
            else
            {
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
            var newBackground = $('<div class="full-background"></div>').css({"background-image": "url(" + imageSource + ")", "opacity": 0});

            $("#background-container").append(newBackground);

            $('<img>').attr('src', imageSource).load(function () {
                fadeOldBackground();
                newBackground.animate({'opacity': 0.5}, 500);
            });
        }
        else {
            fadeOldBackground();
        }
    }

    function nounClick(event) {

        // Ignore clicks when the list is scrolling
        if (isDragging) {
            return;
        }

        $("ul#noun-list li").show();

        var container = $("#noun-list-container");
        var scrollTo = $(event.target);

        container.animate({scrollTop: scrollTo.position().top - container.position().top + container.scrollTop() - topClearance}, 250, function () {
            isDragging = false;
            processSelectedAction(scrollTo);
            clickedNoun = false;
        });
    }

    // If the user starts typing, show search box
    $(document).keypress(function (e) {
        if (!$("#search-field").is(":focus")) {
            $("#search-field").focus();
        }
    });

    $("#search-field").focus(function () {
        $("#noun-list-container").scrollTop(0);
        isDragging = false;
        $("ul#noun-list li:first").animate({'opacity': 0.0});
    });

    $("#search-field").on('input', function () {
        if ($(this).val().length == 0) {
            $("ul#noun-list li").show();
        }
        else {
            $("ul#noun-list li").hide();
            $("ul#noun-list li:first").show();
            $("li[data-action*='" + $(this).val() + "']").show();
            _showingAllNouns = false;
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
    $("ul#noun-list li").click(nounClick);

    $("#noun-list-container").kinetic().css({"cursor": "pointer"});

    $("#noun-list-container").scrollsnap({
        snaps: 'ul#noun-list li',
        proximity: 50,
        offset: -topClearance,
        onSnap: processSelectedAction
    });

    function onDragStarted()
    {
        isDragging = true;
        $("#noun-list-container").css({"z-index" : 100});
        $("#search-field-container").css({"z-index" : 50});
        $("#search-field").prop('disabled', true);
    }

    function onDragStopped()
    {
        isDragging = false;
        $("#noun-list-container").css({"z-index" : 50});
        $("#search-field-container").css({"z-index" : 100});
        $("#search-field").prop('disabled', false);
    }

    var mouseDown = false;
    $("#noun-list-container").mousedown(function () {
        mouseDown = true;
    }).mouseup(function () {
            mouseDown = false;
        });

    var movement = false;
    $("#noun-list-container").bind('scroll', function () {

        if (!movement) {
            movement = true;
            onDragStarted();
        }

        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {

            if(mouseDown)
            {
                return;
            }

            movement = false;
            onDragStopped();

        }, 150);
    });

    $.each(wwibActions, function (index, action) {

        $("ul#noun-list").append($("<li></li>").attr({"data-action": action.wwib}).data("action", action).text(action.wwib).click(nounClick));

    });

    updateOverscroll();

    $(window).resize(function () {
        updateOverscroll();
    });
});