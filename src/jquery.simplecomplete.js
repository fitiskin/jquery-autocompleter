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
        highlightmatches: false,
        ignoredKeyCode: [],
        combine: $.noop,
        callback: $.noop
    };

    var publics = {
        defaults: function (opts) {
            options = $.extend(options, opts || {});
            return $(this);
        },
        clearCache: function () {
            _deleteCache();
        },
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

    function _build($node, opts) {
        if (!$node.hasClass("simplecomplete-node")) {
            // Extend options
            opts = $.extend({}, opts, $node.data("simplecomplete-options"));

            var html = '<div class="simplecomplete '+opts.customClass.join(' ')+'">';
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
                query: '',
                originalAutocomplete: originalAutocomplete,
                guid: guid++
            }, opts);

            // Bind simplecomplete events
            data.$simplecomplete.on("mousedown.simplecomplete", ".simplecomplete-item", data, _select)
                                .data("simplecomplete", data);

            // Bind node events
            data.$node.on("keyup.simplecomplete", data, _onKeyup)
                      .on("keydown.simplecomplete", data, _onKeyupHelper)
                      .on("focus.simplecomplete", data, _onFocus)
                      .on("blur.simplecomplete", data, _onBlur)
                      .on("click.simplecomplete", data, _onClick);
        }
    }

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

    function _clear(data) {
        // Clear data
        data.$list = null;
        data.$selected = null;
        data.index = 0;
        data.$simplecomplete.find(".simplecomplete-list").empty();
        data.$simplecomplete.find('.simplecomplete-hint').removeClass('simplecomplete-hint-show').empty();
        data.hintText = false;

        _close(null, data);
    }

    function _response(response, data) {
        _buildList(response, data);

        if (data.$simplecomplete.hasClass('simplecomplete-focus')) {
            _open(null, data);
        }
    }

    function _buildList(list, data) {
        var menu = '';

        for (var item in list) {
            var classes = ["simplecomplete-item"];

            if (data.selectFirst && item == "0" && !data.changeWhenSelect) {
                classes.push("simplecomplete-item-selected");
            }

            var re = new RegExp(data.query, "gi");
            var label = data.highlightmatches ? list[item].label.replace(re, "<strong>$&</strong>") : list[item].label;
            menu += '<li data-value="'+list[item].value+'" class="'+classes.join(' ')+'">' + label + '</li>';
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
        data.$simplecomplete.find("ul").html(menu);
        data.$selected = (data.$simplecomplete.find(".simplecomplete-item-selected").length) ? data.$simplecomplete.find(".simplecomplete-item-selected") : null;
        data.$list = (list.length) ? data.$simplecomplete.find("ul li") : null;
        data.index = data.$selected ? data.$list.index(data.$selected): -1;
    }

    function _onKeyup(e) {
        var data = e.data;

        if (e.keyCode == 40 || e.keyCode == 38 ) {
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
                data.$node.trigger('click.simplecomplete');
            }
        } else if (ignoredKeyCode.indexOf(e.keyCode) == -1 && data.ignoredKeyCode.indexOf(e.keyCode) == -1) {
            // Typing
            _launch(data);
        }
    }

    function _onKeyupHelper(e) {
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

    function _onFocus(e, internal) {
        if (!internal) {
            e.preventDefault();
            e.stopPropagation();

            var data = e.data;

            if (!data.$node.prop("disabled") && !data.$simplecomplete.hasClass('simplecomplete-show')) {
                data.$simplecomplete.addClass("simplecomplete-focus")
                if (data.focusOpen) {
                    _launch(data);
                }
            }
        }
    }

    function _onBlur(e, internal) {
        e.preventDefault();
        e.stopPropagation();

        var data = e.data;

        if (!internal) {
            data.$simplecomplete.removeClass("simplecomplete-focus")
            _close(e);
        }
    }

    function _onClick(e) {
        e.preventDefault();
        e.stopPropagation();

        var data = e.data;

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

    function _open(e, data) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        var data = e ? e.data : data;

        if (!data.$node.prop("disabled") && !data.$simplecomplete.hasClass("simplecomplete-show") && data.$list && data.$list.length ) {
            data.$simplecomplete.removeClass("simplecomplete-closed").addClass("simplecomplete-show");
            $body.on("click.simplecomplete-" + data.guid, ":not(.simplecomplete-item)", data, _closeHelper);
        }
    }

    function _closeHelper(e) {
        e.preventDefault();
        e.stopPropagation();

        if ($(e.currentTarget).parents(".simplecomplete").length === 0) {
            _close(e);
        }
    }

    function _close(e, data) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        var data = e ? e.data : data;

        if (data.$simplecomplete.hasClass("simplecomplete-show")) {
            data.$simplecomplete.removeClass("simplecomplete-show").addClass("simplecomplete-closed");
            $body.off(".simplecomplete-" + data.guid);
        }
    }

    function _select(e) {
        // Disable middle & right mouse click
        if (e.type == "mousedown" && [2, 3].indexOf(e.which) != -1) { return; }

        var data = e.data;

        e.preventDefault();
        e.stopPropagation();

        var $target = (e.type == "keyup" && data.$selected ) ? data.$selected : $(this);

        if (!data.$node.prop("disabled")) {
            var active = data.$list.index($target);

            _close(e);
            _update(active, data);

            if (e.type == "click") {
                data.$node.trigger("focus", [true]);
            }
        }
    }

    function _setHint(data) {
        _setValue(data);
        _handleChange(data);
        _launch(data);
    }

    function _setValue(data) {
        if (data.$selected) {
            if (data.hintText && data.$simplecomplete.find('.simplecomplete-hint').hasClass('simplecomplete-hint-show')) {
                data.$simplecomplete.find('.simplecomplete-hint').removeClass('simplecomplete-hint-show');
            }
            data.$node.val(data.$selected.text().trim());
        } else {
            if (data.hintText && !data.$simplecomplete.find('.simplecomplete-hint').hasClass('simplecomplete-hint-show')) {
                data.$simplecomplete.find('.simplecomplete-hint').addClass('simplecomplete-hint-show');
            }
            data.$node.val(data.query);
        }
    }

    function _update(active, data) {
        _setValue(data);
        _handleChange(data);
        _clear(data);
    }

    function _handleChange(data) {
        data.callback.call(data.$simplecomplete, data.$node.val(), data.index);
        data.$node.trigger("change");
    }

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

    function _getCache(url) {
        if (!url) { return; }
        var response = (cache[url] && cache[url].value) ? cache[url].value : false;
        return response;
    }

    function _loadCache() {
        if (!supportLocalStorage) { return; }
        var json = localStorage.getItem(localStorageKey) || '{}';
        return JSON.parse(json);
    }

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
