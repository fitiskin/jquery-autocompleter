<a href="http://gruntjs.com" target="_blank"><img src="https://cdn.gruntjs.com/builtwith.png" alt="Built with Grunt"></a>
# jQuery Autocompleter

## Demo:

Here: [Example with Crayola colors](http://artemfitiskin.github.io/jquery-autocompleter/).

## Usage:

The minimum to include: ``jquery.autocompleter.css`` and ``jquery.autocompleter.min.js``.

#### Scripts:
```html
<script src="js/jquery.js" type="text/javascript"></script>
<script src="js/jquery.autocompleter.min.js" type="text/javascript"></script>
```

#### Styles:
```html
<link rel="stylesheet" href="css/jquery.autocompleter.css">
```

#### Define your autocompleter:

```javascript
$(function () {
    $('input').autocompleter({ source: 'path/to/get_data_request' });
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
    $('input').autocompleter({ source: data });
});
```

If you will not defined a value in source object, label will be used as value in input field after select.

## Options:

Autocompleter has some options.

| Name        | Type | Description           | Deafult  |
| ------------- |:-------------:| -----:|-----:|
| source    | str, obj  | URL to server or local object  | null |
| empty     | bool      |  Launch if value are empty |  true  |
| limit | int      |  Count results to show | 10 |
| customClass | array      |  Array with custom classes for autocompleter element | [] |
| cache | bool      |  Save xhr data to localStorage to avoid repeated requests | true |
| focusOpen | bool      |  Launch autocompleter when input get focus  | true |
| hint | bool      |  Add hint to input with first match label, appropriate styles should be established | false |
| selectFirst | bool      |  If set ``true``, first element in autocomplete list will be selected automatically, ignore if changeWhenSelect are on | false |
| changeWhenSelect | bool      |  Change input value when use arrow keys navigation in autocomplete list | true |
| highlightmatches | bool      |  This option define ``<strong>`` tag wrap for matches in autocomplete results | false |
| ignoredKeyCode | array      |  Array with ignorable keycodes, by default: ``9, 13, 17, 19, 20, 27, 33, 34, 35, 36, 37, 39, 44, 92, 113, 114, 115, 118, 119, 120, 122, 123, 144, 145`` | [] |
| customLabel  | str | Property name in source who will be implemented as label | false |
| customValue  | str | Property name in source who will be implemented as value | false |
| combine | function | Returns an object for extend ajax data. Useful if you want to pass on any additional server options | $.noop |
| callback | function      |  Select value callback function. Arguments: ``value``, ``index`` | $.noop |

## Methods:

#### Clear all cache:
```javascript
$.autocompleter('clearCache');
```

#### Set defaults:
```javascript
$.autocompleter('defaults', {
    customClass: 'myClassForAutocompleter'
});
```

#### Destroy plugin:
```javascript
$("#firstname").autocompleter('destroy');
```

## Example:

Autocompleter for firstname input with caching, highlight matches and 5 results limit. Remote response depends from gender:

#### Form:
```html
<label for="gender_male">Male</label>
<input type="radio" name="gender" value="male" id="gender_male" checked="checked" />

<label for="gender_female">Female</label>
<input type="radio" name="gender" value="female" id="gender_female" />

<label for="firstname">First Name</label>
<input type="text" name="firstname" id="firstname" />
```

#### JavaScript:
```javascript
$(function () {
    $("#firstname").autocompleter({
        limit: 5,
        cache: true,
        combine: function () {
            var gender = $("input:radio[name=gender]:checked").val();

            return {
                gender: gender
            };
        },
        callback: function (value, index) {
            console.log( "Value "+value+" are selected (with index "+index+")." );
        }
    });
});
```

## Main structure:

Simple 3-level: div (node) -> ul (list) -> li (item).

```html
<div class="autocompleter" id="autocompleter-1">
	<ul class="autocompleter-list">
		<li class="autocompleter-item">First</li>
		...
		<li class="autocompleter-item">Last</li>
	</ul>
</div>
```
