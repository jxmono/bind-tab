"use strict";

var self;
var config;

var Bind = require("github/jillix/bind");
var Events = require("github/jillix/events");
var EmitEvents = {
    tabActivated: function (miid) {
        self.on("ready", miid, function() {
            self.emit("tabActivated", miid);
        });
    }
};

module.exports = function (conf) {

    self = this;
    config = processConfig(conf);

    Events.call(self, conf);

    var container = $(config.container, self.dom);

    if (config.options.reuse) {
        self.tabs = {};
    }

    // On tab click
    $(config.tabs, self.dom).on("click", function() {

        // Change the hash in URL
        if (config.options.hash) {
            if (!$(this).attr("data-hash")) {
                return;
            }

            window.location.hash = $(this).attr("data-hash");
        } else {
            activateTab(config, $(this));
        }

        return false;
    });

    // hashchange handler
    $(window).on("hashchange", function () {
        var tab = $("[data-hash=" + window.location.hash.substring(1) +  "]", self.dom);
        activateTab(config, tab);
    })

    // Load first content
    if ((config.options.first) && (!window.location.hash)) {
        M(config.container, config.options.first, function () {

            EmitEvents.tabActivated(config.options.first);

            if (config.options.reuse) {
                self.tabs[config.options.first] = true;
            }
        });
    }
    // Load the right content for hash
    else if ((window.location.hash) && (config.options.hash)) {
        var tab = $("[data-hash=" + window.location.hash.substring(1) +  "]", self.dom);

        var options = {
            tab: tab,
            firstLoad: true
        };

        activateTab(config, options);
    }

    if (typeof window[config.onInitEnd] === "function") {
        window[config.onInitEnd].apply(self);
    }

    // run the binds
    if (config.binds) {
        for (var i = 0; i < config.binds.length; ++i) {
            Bind.call(self, config.binds[i]);
        }
    }

    self.emit("ready");
}

function activateTab(config, options) {

    var tab = options.tab || options;

    if (typeof tab === "function") {
        tab = options;
    }

    if (!tab.length) {
        return;
    }

    // gets the active tab
    var active = $(config.tabs, self.dom).parent().find("." + config.options.classes.selected);

    // Removes the active class
    $(config.tabs, self.dom).removeClass(config.options.classes.selected);

    // Adds active class
    tab.addClass(config.options.classes.selected);

    // TODO we cannot rely that the selected class exists and based on this
    // to test the current tab. The current miid should be buffered
    if (tab.attr("data-miid") === active.attr("data-miid") && !options.firstLoad) {
        return;
    }

    // set title
    var newTitle = active.attr("data-title");
    if (newTitle) {
        window.title = newTitle;
    }

    // Remove the content of container if reuse is false or undefined
    if (!config.options.reuse) {
        $(config.container).html("");
    }

    var miid = tab.attr("data-miid");

    // Sets the content in container
    // reuse is true
    if (config.options.reuse) {

        // miid was NOT loaded
        if (!self.tabs[miid]) {
            M(config.container, miid, function () {
                EmitEvents.tabActivated(miid);

                self.tabs[miid] = true;
                $(config.container).children().hide(config.options.transition);
                $("#" + miid).show(config.options.transition);
                tab.constructor === jQuery ? tab.click() : "";
            });
        }
        // miid was already loaded, show it!
        else {
            $(config.container).children().hide(config.options.transition);
            $("#" + miid).show(config.options.transition);
            EmitEvents.tabActivated(miid);
        }
    }
    // reuse is false
    else {
        M(config.container, miid, function () {
            EmitEvents.tabActivated(miid);
        });
    }
}

function processConfig (config) {

    config.options = config.options || {};
    config.options.classes = config.options.classes || {};

    return config;
}

