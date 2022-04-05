import "./normalize.css";
import "./styles.css";

import $ from "jquery";
import "jquery-autocompleter";

import colors from "./data";

$(function () {
  $("#nope").autocompleter({
    // map "name" as label
    customLabel: "name",

    // marker for autocomplete matches
    highlightMatches: true,

    // object to local or url to remote search
    source: colors,

    // custom template
    template: '{{ label }} <span style="color: {{ hex }};">({{ hex }})</span>',

    // show hint
    hint: true,

    // abort source if empty field
    empty: false,

    // max results
    limit: 10,

    // user callback
    callback: function (value, index, selected) {
      console.log("callback", { value, index, selected });

      if (selected) {
        $(".icon").css("background-color", selected.hex);
      }
    },
  });
});
