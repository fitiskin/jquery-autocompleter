/* 
 * Simplecomplete v0.0.5 - 2014-05-09 
 * Simple, easy, customisable and with cache support. 
 * http://github.com/ArtemFitiskin/jquery-simplecomplete 
 * 
 * Copyright 2014 Artem Fitiskin; MIT Licensed 
 */ 

;(function ($, window) {
    "use strict";

    var guid = 0,
        ignoredKeyCode = [9, 13, 17, 19, 20, 27, 33, 34, 35, 36, 37, 39, 44, 92, 113, 114, 115, 118, 119, 120, 122, 123, 144, 145],
        userAgent = (window.navigator.userAgent||window.navigator.vendor||window.opera),
        isFirefox = /Firefox/i.test(userAgent),
        isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(userAgent),
        isFirefoxMobile = (isFirefox && isMobile),
        $body = null,
        localStorageKey = 'simpleAutocompleteCache',
        supportLocalStorage = (function () {
            var supported = typeof window.localStorage !== 'undefined';
            if (supported) {
                try {
                    localStorage.setItem("simplecomplete", "simplecomplete");
                    localStorage.removeItem("simplecomplete");
                } catch (e) {
                    supported = false;
                }
            }
            return supported;
         })(),
        cache = _loadCache();

    /**
	 * @options
	 * @param source [(string|object)] <null> "URL to server or local object"
	 * @param empty [boolean] <true> "Launch if value are empty"
	 * @param limit [int] <10> "Count results to show"
	 * @param customClass [array] <[]> "Array with custom classes for simplecomplete element"
	 * @param cache [boolean] <true> "Save xhr data to localStorage to avoid repeated requests"
	 * @param focusOpen [boolean] <true> "Launch simplecomplete when input get focus"
	 * @param hint [boolean] <false> "Add hint to input with first match label, appropriate styles should be established "
	 * @param selectFirst [boolean] <false> "If set true, first element in autocomplete list will be selected automatically, ignore if changeWhenSelect are on"
	 * @param changeWhenSelect [boolean] <true> "Change input value when use arrow keys navigation in autocomplete list"
	 * @param highlightMatches [boolean] <false> "This option define <strong> tag wrap for matches in autocomplete results"
	 * @param ignoredKeyCode [array] <[]> "Array with ignorable keycodes"
	 * @param customLabel [boolean] <false> "Property name in source who will be implemented as label"
	 * @param customValue [boolean] <false> "Property name in source who will be implemented as value"
	 * @param combine [function] <$.noop> "Returns an object for extend ajax data. Useful if you want to pass on any additional server options"
	 * @param callback [function] <$.noop> "Select value callback function. Arguments: value, index"
	 */
    var options = {
        source: null,
        empty: true,
        limit: 10,
        customClass: [],
        cache: true,
        focusOpen: true,
        hint: false,
        selectFirst: false,
        changeWhenSelect: true,
        highlightMatches: false,
        ignoredKeyCode: [],
        customLabel: false,
        customValue: false,
        combine: $.noop,
        callback: $.noop
    };

    var publics = {

        /**
		 * @method
		 * @name defaults
		 * @description Sets default plugin options
		 * @param opts [object] <{}> "Options object"
		 * @example $.simplecomplete("defaults", opts);
		 */
        defaults: function (opts) {
            options = $.extend(options, opts || {});
            return $(this);
        },

        /**
         * @method
         * @name clearCache
         * @description Remove localStorage cache
         */
        clearCache: function () {
            _deleteCache();
        },

        /**
		 * @method
		 * @name destroy
		 * @description Removes instance of plugin
		 * @example $(".target").simplecomplete("destroy");
		 */
        destroy: function () {
            return $(this).each(function (i, input) {
                var data = $(input).next(".simplecomplete").data("simplecomplete");

                if (data) {
                    // About xhr
                    if (data.jqxhr) {
                        data.jqxhr.abort();
                    }

                    // If has selected item & open - confirm it
                    if (data.$simplecomplete.hasClass("open")) {
                        data.$simplecomplete.find(".simplecomplete-selected")
                                            .trigger("click.simplecomplete");
                    }

                    // Restore original autocomplete attr
                    if(!data.originalAutocomplete) {
                        data.$node.removeAttr("autocomplete");
                    } else {
                        data.$node.attr("autocomplete", data.originalAutocomplete);
                    }

                    // Remove simplecomplete & unbind events
                     data.$node.off(".simplecomplete")
                               .removeClass("simplecomplete-node");
                     data.$simplecomplete.off(".simplecomplete")
                                         .remove();
                }
            });
        }
    };

    /**
	 * @method private
	 * @name _init
	 * @description Initializes plugin
	 * @param opts [object] "Initialization options"
	 */
    function _init(opts) {
        // Local options
        opts = $.extend({}, options, opts || {});

        // Check for Body
        if ($body === null) {
            $body = $("body");
        }

        // Apply to each element
        var $items = $(this);
        for (var i = 0, count = $items.length; i < count; i++) {
            _build($items.eq(i), opts);
        }

        return $items;
    }

    /**
	 * @method private
	 * @name _build
	 * @description Builds each instance
	 * @param $node [jQuery object] "Target jQuery object"
	 * @param opts [object] <{}> "Options object"
	 */
    function _build($node, opts) {
        if (!$node.hasClass("simplecomplete-node")) {
            // Extend options
            opts = $.extend({}, opts, $node.data("simplecomplete-options"));

            var html = '<div class="simplecomplete '+opts.customClass.join(' ')+'" id="simplecomplete-'+(guid+1)+'">';
                if (opts.hint) {
                    html += '<div class="simplecomplete-hint"></div>';
                }
                html += '<ul class="simplecomplete-list"></ul>';
                html += '</div>';

            $node.addClass("simplecomplete-node")
                 .after(html);

            var $simplecomplete = $node.next(".simplecomplete").eq(0);

            // Set autocomplete to off for warn overlay
            var originalAutocomplete = $node.attr("autocomplete");
            $node.attr("autocomplete", "off");

            // Store plugin data
            var data = $.extend({
                $node: $node,
                $simplecomplete: $simplecomplete,
                $selected: null,
                $list: null,
                index: -1,
                hintText: false,
                source: false,
                jqxhr: false,
                response: null,
                focused: false,
                query: '',
                originalAutocomplete: originalAutocomplete,
                guid: guid++
            }, opts);

            // Bind simplecomplete events
            data.$simplecomplete.on("mousedown.simplecomplete", ".simplecomplete-item", data, _select)
                                .data("simplecomplete", data);

            // Bind node events
            data.$node.on("keyup.simplecomplete", data, _onKeyup)
                      .on("keydown.simplecomplete", data, _onKeydownHelper)
                      .on("focus.simplecomplete", data, _onFocus)
                      .on("blur.simplecomplete", data, _onBlur)
                      .on("mousedown.simplecomplete", data, _onMousedown);
        }
    }

    /**
     * @method private
     * @name _launch
     * @description Use source locally or create xhr
     * @param data [object] "Instance data"
     */
    function _launch(data) {
        data.query = data.$node.val().trim();

        if (!data.empty && data.query.length === 0) {
            _clear(data);
            return;
        } else {
            if (typeof data.source == 'object') {
                _clear(data);
                var search = $.grep(data.source, function(n, i) {
                    return ( n.label.toUpperCase().indexOf(data.query.toUpperCase()) != -1 );
                }).filter(function (n, i) { return i < data.limit  });

                if (search.length) {
                    _response(search, data)
                }
            } else {
                if (data.jqxhr) {
                    data.jqxhr.abort();
                }

                var ajaxData = $.extend({
                    limit: data.limit,
                    query: data.query
                }, data.combine());

                data.jqxhr = $.ajax({
                    url:        data.source,
                    dataType:   "json",
                    data:       ajaxData,
                    beforeSend: function (xhr) {
                        data.$simplecomplete.addClass('simplecomplete-ajax');
                        _clear(data);
                        if (data.cache) {
                            var stored = _getCache(this.url);
                            if (stored) {
                                xhr.abort();
                                _response(stored, data)
                            }
                        }
                    }
                })
                .done(function (response) {
                    if (data.cache) {
                        _setCache(this.url, response)
                    }
                    _response(response, data)
                })
                .always(function () {
                    data.$simplecomplete.removeClass('simplecomplete-ajax');
                });
            }
        }
    }

    /**
     * @method private
     * @name _clear
     * @param data [object] "Instance data"
     */
    function _clear(data) {
        // Clear data
        data.response = null;
        data.$list = null;
        data.$selected = null;
        data.index = 0;
        data.$simplecomplete.find(".simplecomplete-list").empty();
        data.$simplecomplete.find('.simplecomplete-hint').removeClass('simplecomplete-hint-show').empty();
        data.hintText = false;

        _close(null, data);
    }

    /**
     * @method private
     * @name _response
     * @description Main source response function
     * @param response [object] "Source data"
     * @param data [object] "Instance data"
     */
    function _response(response, data) {
        _buildList(response, data);

        if (data.$simplecomplete.hasClass('simplecomplete-focus')) {
            _open(null, data);
        }
    }

    /**
     * @method private
     * @name _buildList
     * @description Generate simplecomplete-list and update instance data by source
     * @param list [object] "Source data"
     * @param data [object] "Instance data"
     */
    function _buildList(list, data) {
        var menu = '';

        for (var item in list) {
            var classes = ["simplecomplete-item"];

            if (data.selectFirst && item == "0" && !data.changeWhenSelect) {
                classes.push("simplecomplete-item-selected");
            }

            var re = new RegExp(data.query, "gi");
            var label = (data.customLabel && list[item][data.customLabel]) ? list[item][data.customLabel] : list[item].label;
                label = data.highlightMatches ? label.replace(re, "<strong>$&</strong>") : label;

            var value = (data.customValue && list[item][data.customValue]) ? list[item][data.customValue] : list[item].value;

            if (value) {
                menu += '<li data-value="'+value+'" class="'+classes.join(' ')+'">' + label + '</li>';
            } else {
                menu += '<li class="'+classes.join(' ')+'">' + label + '</li>';
            }
        }

        // Set hint
        if (list.length && data.hint) {
            var hint = ( list[0].label.substr(0, data.query.length).toUpperCase() == data.query.toUpperCase() ) ? list[0].label : false;
            if (hint && (data.query != list[0].label)) {
                var re = new RegExp(data.query, "i");
                var hintText = hint.replace(re, "<span>"+data.query+"</span>");
                data.$simplecomplete.find('.simplecomplete-hint').addClass('simplecomplete-hint-show').html(hintText);
                data.hintText = hintText;
            }
        }

        // Update data
        data.response = list;
        data.$simplecomplete.find(".simplecomplete-list").html(menu);
        data.$selected = (data.$simplecomplete.find(".simplecomplete-item-selected").length) ? data.$simplecomplete.find(".simplecomplete-item-selected") : null;
        data.$list = (list.length) ? data.$simplecomplete.find(".simplecomplete-item") : null;
        data.index = data.$selected ? data.$list.index(data.$selected): -1;
        data.$simplecomplete.find(".simplecomplete-item").each(function (i, j) {
            $(j).data(data.response[i]);
        });
    }

    /**
     * @method private
     * @name _onKeyup
     * @description Keyup events in node, up/down simplecomplete-list navigation, typing and enter button callbacks
     * @param e [object] "Event data"
     */
    function _onKeyup(e) {
        var data = e.data;

        if ( (e.keyCode == 40 || e.keyCode == 38) && data.$simplecomplete.hasClass('simplecomplete-show') ) {
            // Arrows up & down
            var len = data.$list.length,
                next,
                prev;

            if (len) {
                // Determine new index
                if (len > 1) {
                    if (data.index == len - 1) {
                        next = data.changeWhenSelect ? -1 : 0;
                        prev = data.index - 1;
                    } else if (data.index === 0) {
                        next = data.index + 1;
                        prev = data.changeWhenSelect ? -1 : len - 1;
                    } else if (data.index == -1) {
                        next = 0;
                        prev = len - 1;
                    } else {
                        next = data.index + 1;
                        prev = data.index - 1;
                    }
                } else if (data.index == -1) {
                    next = 0;
                    prev = 0;
                } else {
                    prev = -1;
                    next = -1;
                }
                data.index = (e.keyCode == 40) ? next : prev;

                // Update HTML
                data.$list.removeClass("simplecomplete-item-selected");
                if (data.index != -1) {
                    data.$list.eq(data.index).addClass("simplecomplete-item-selected");
                }
                data.$selected = data.$simplecomplete.find(".simplecomplete-item-selected").length ? data.$simplecomplete.find(".simplecomplete-item-selected") : null;
                if (data.changeWhenSelect) {
                    _setValue(data);
                }
            }
        } else if ([13].indexOf(e.keyCode) != -1) {
            // Enter
            if (data.$simplecomplete.hasClass('simplecomplete-show') && data.$selected) {
                _select(e);
            } else {
                e.preventDefault();
                e.stopPropagation();
                data.$node.trigger('mousedown.simplecomplete');
            }
        } else if (ignoredKeyCode.indexOf(e.keyCode) == -1 && data.ignoredKeyCode.indexOf(e.keyCode) == -1) {
            // Typing
            _launch(data);
        }
    }

    /**
     * @method private
     * @name _onKeydownHelper
     * @description Keydown events in node, up/down for prevent cursor moving and right arrow for hint
     * @param e [object] "Event data"
     */
    function _onKeydownHelper(e) {
        if (e.keyCode == 40 || e.keyCode == 38 ) {
            e.preventDefault();
        } else if (e.keyCode == 39) {
            // Right arrow
            var data = e.data;
            if (data.hint && data.hintText && data.$simplecomplete.find('.simplecomplete-hint').hasClass('simplecomplete-hint-show')) {
                e.preventDefault();

                var hintOrigin = data.$simplecomplete.find(".simplecomplete-item").length ? data.$simplecomplete.find(".simplecomplete-item").eq(0).text().trim() : false;
                if (hintOrigin) {
                    data.query = hintOrigin;
                    _setHint(data);
                }
            }
        }
    }

    /**
     * @method private
     * @name _onFocus
     * @description Handles instance focus
     * @param e [object] "Event data"
     * @param internal [boolean] "Called by plugin"
     */
    function _onFocus(e, internal) {
        if (!internal) {
            var data = e.data;

            if (!data.$node.prop("disabled") && !data.$simplecomplete.hasClass('simplecomplete-show')) {
                data.$simplecomplete.addClass("simplecomplete-focus")
                if (data.focusOpen) {
                    _launch(data);
                    data.focused = true;
                    setTimeout(function () {
                        data.focused = false;
                    }, 500);
                }
            }
        }
    }

    /**
     * @method private
     * @name _onBlur
     * @description Handles instance blur
     * @param e [object] "Event data"
     * @param internal [boolean] "Called by plugin"
     */
    function _onBlur(e, internal) {
        e.preventDefault();
        e.stopPropagation();

        var data = e.data;

        if (!internal) {
            data.$simplecomplete.removeClass("simplecomplete-focus")
            _close(e);
        }
    }

    /**
     * @method private
     * @name _onMousedown
     * @description Handles mousedown to node
     * @param e [object] "Event data"
     */
    function _onMousedown(e) {
        // Disable middle & right mouse click
        if (e.type == "mousedown" && [2, 3].indexOf(e.which) != -1) { return; }

        var data = e.data;
        if (data.$list && !data.focused) {
            if (!data.$node.is(":disabled")) {
                if (isMobile && !isFirefoxMobile) {
                    var el = data.$select[0];
                    if (window.document.createEvent) { // All
                        var evt = window.document.createEvent("MouseEvents");
                        evt.initMouseEvent("mousedown", false, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                        el.dispatchEvent(evt);
                    } else if (el.fireEvent) { // IE
                        el.fireEvent("onmousedown");
                    }
                } else {
                    // Delegate intent
                    if (data.$simplecomplete.hasClass("simplecomplete-closed")) {
                        _open(e);
                    } else if (data.$simplecomplete.hasClass("simplecomplete-show")) {
                        _close(e);
                    }
                }
            }
        }
    }

    /**
     * @method private
     * @name _open
     * @description Opens option set
     * @param e [object] "Event data"
     * @param data [object] "Instance data"
     */
    function _open(e, data) {
        var data = e ? e.data : data;

        if (!data.$node.prop("disabled") && !data.$simplecomplete.hasClass("simplecomplete-show") && data.$list && data.$list.length ) {
            data.$simplecomplete.removeClass("simplecomplete-closed").addClass("simplecomplete-show");
            $body.on("click.simplecomplete-" + data.guid, ":not(.simplecomplete-item)", data, _closeHelper);
        }
    }

    /**
     * @method private
     * @name _closeHelper
     * @description Determines if event target is outside instance before closing
     * @param e [object] "Event data"
     */
    function _closeHelper(e) {
        if ( $(e.target).hasClass('simplecomplete-node') ) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        if ($(e.currentTarget).parents(".simplecomplete").length === 0) {
            _close(e);
        }
    }

    /**
     * @method private
     * @name _close
     * @description Closes option set
     * @param e [object] "Event data"
     * @param data [object] "Instance data"
     */
    function _close(e, data) {
        var data = e ? e.data : data;

        if (data.$simplecomplete.hasClass("simplecomplete-show")) {
            data.$simplecomplete.removeClass("simplecomplete-show").addClass("simplecomplete-closed");
            $body.off(".simplecomplete-" + data.guid);
        }
    }

    /**
     * @method private
     * @name _select
     * @description Select item from .simplecomplete-list
     * @param e [object] "Event data"
     */
    function _select(e) {
        // Disable middle & right mouse click
        if (e.type == "mousedown" && [2, 3].indexOf(e.which) != -1) { return; }

        var data = e.data;

        e.preventDefault();
        e.stopPropagation();

        var $target = (e.type == "keyup" && data.$selected ) ? data.$selected : $(this);

        if (!data.$node.prop("disabled")) {
            _close(e);
            _update(data);

            if (e.type == "click") {
                data.$node.trigger("focus", [true]);
            }
        }
    }

    /**
     * @method private
     * @name _setHint
     * @description Set simplecomplete by hint
     * @param data [object] "Instance data"
     */
    function _setHint(data) {
        _setValue(data);
        _handleChange(data);
        _launch(data);
    }

    /**
     * @method private
     * @name _setValue
     * @description Set value for native field
     * @param data [object] "Instance data"
     */
    function _setValue(data) {
        if (data.$selected) {
            if (data.hintText && data.$simplecomplete.find('.simplecomplete-hint').hasClass('simplecomplete-hint-show')) {
                data.$simplecomplete.find('.simplecomplete-hint').removeClass('simplecomplete-hint-show');
            }
            var value = data.$selected.attr('data-value') ? data.$selected.attr('data-value') : data.$selected.text().trim();
            data.$node.val(value);
        } else {
            if (data.hintText && !data.$simplecomplete.find('.simplecomplete-hint').hasClass('simplecomplete-hint-show')) {
                data.$simplecomplete.find('.simplecomplete-hint').addClass('simplecomplete-hint-show');
            }
            data.$node.val(data.query);
        }
    }

    /**
     * @method private
     * @name _update
     * @param data [object] "Instance data"
     */
    function _update(data) {
        _setValue(data);
        _handleChange(data);
        _clear(data);
    }

    /**
     * @method private
     * @name _handleChange
     * @description Trigger node change event and call the callback function
     * @param data [object] "Instance data"
     */
    function _handleChange(data) {
        data.callback.call(data.$simplecomplete, data.$node.val(), data.index, data.response[data.index]);
        data.$node.trigger("change");
    }

    /**
     * @method private
     * @name _getCache
     * @description Store AJAX response in plugin cache
     * @param url [string] "AJAX get query string"
     * @param data [object] "AJAX response data"
     */
    function _setCache(url, data) {
        if (!supportLocalStorage) { return; }
        if (url && data) {
            cache[url] = {
                value: data
            };

            // Proccess to localStorage
            try {
                  localStorage.setItem(localStorageKey, JSON.stringify(cache));
            } catch (e) {
                  var code = e.code || e.number || e.message;
                  if (code === 22) {
                    _deleteCache();
                  } else {
                    throw(e);
                  }
            }
        }
    }

    /**
     * @method private
     * @name _getCache
     * @description Get cached data by url if exist
     * @param url [string] "AJAX get query string"
     */
    function _getCache(url) {
        if (!url) { return; }
        var response = (cache[url] && cache[url].value) ? cache[url].value : false;
        return response;
    }

    /**
     * @method private
     * @name _loadCache
     * @description Load all plugin cache from localStorage
     */
    function _loadCache() {
        if (!supportLocalStorage) { return; }
        var json = localStorage.getItem(localStorageKey) || '{}';
        return JSON.parse(json);
    }

    /**
	 * @method private
	 * @name _deleteCache
	 * @description Delete all plugin cache from localStorage
	 */
    function _deleteCache() {
        try {
            localStorage.removeItem(localStorageKey);
            cache = _loadCache();
        } catch (e) {
            throw(e);
        }
    }

    $.fn.simplecomplete = function (method) {
        if (publics[method]) {
            return publics[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return _init.apply(this, arguments);
        }
        return this;
    };

    $.simplecomplete = function (method) {
        if (method === "defaults") {
            publics.defaults.apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (method === "clearCache") {
            publics.clearCache.apply(this, null);
        }
    };
})(jQuery, window);
