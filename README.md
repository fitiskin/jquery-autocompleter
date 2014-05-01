<a href="http://gruntjs.com" target="_blank"><img src="https://cdn.gruntjs.com/builtwith.png" alt="Built with Grunt"></a>

# jQuery Simplecomplete

## Usage:

The minimum to include: ``jquery.simplecomplete.css`` and ``jquery.simplecomplete.min.js``.

#### Scripts:
```html
<script src="js/jquery.js" type="text/javascript"></script>
<script src="js/jquery.simplecomplete.min.js" type="text/javascript"></script>
```

#### Styles:
```html
<link rel="stylesheet" href="css/jquery.simplecomplete.css">
```

#### Define your simplecomplete:

```javascript
$(function () {
    $('input').simplecomplete({ source: 'path/to/get_data_request' });
});
```

or for local JSON source:

```javascript
var data = [
    { "value": "1", "label": "one" },
    { "value": "2", "label": "two" },
    { "value": "3", "label": "three" }
];

$(function () {
    $('input').simplecomplete({ source: data });
});
```

## Options:

Simplecomplete has some options.

| Name        | Type | Description           | Deafult  |
| ------------- |:-------------:| -----:|-----:|
| source    | str, obj  | URL to server or local object  | null |
| empty     | bool      |  Launch if value are empty |  true  |
| limit | int      |  Count results to show | 10 |
| customClass | int      |  Count results to show | [] |
| cache | bool      |  Save xhr data to localStorage to avoid repeated requests | true |
| focusOpen | bool      |  Launch simplecomplete when input  | true |
| hint | bool      |  Add hint to input with first match label, appropriate styles should be established | false |
| selectFirst | bool      |  If set ``true``, first element in autocomplete list will be selected automatically, ignore if changeWhenSelect are on | false |
| changeWhenSelect | bool      |  Change input value when use arrow keys navigation in autocomplete list | true |
| highlightmatches | bool      |  This option define ``<strong>`` tag wrap for matches in autocomplete results | false |
| ignoredKeyCode | array      |  Array with ignorable keycodes, by default: ``9, 13, 17, 19, 20, 27, 33, 34, 35, 36, 37, 39, 44, 92, 113, 114, 115, 118, 119, 120, 122, 123, 144, 145`` | [] |
| combine | function | Returns an object for extend ajax data. Useful if you want to pass on any additional server options | $.noop |
| callback | function      |  Select value callback function. Arguments: ``value``, ``index`` | $.noop |
