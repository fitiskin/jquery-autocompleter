<a href="http://gruntjs.com" target="_blank"><img src="https://cdn.gruntjs.com/builtwith.png" alt="Built with Grunt"></a>
# jQuery Autocompleter :octocat:

## Demo:

Here: [Example with Crayola colors](http://artemfitiskin.github.io/jquery-autocompleter/).

## Usage:

### Bower support:

Use ``bower install Autocompleter`` command.

### Manually:

Minimum requirements: ``jquery.autocompleter.css`` and ``jquery.autocompleter.min.js``.

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
    { 'value': '1', 'label': 'one' },
    { 'value': '2', 'label': 'two' },
    { 'value': '3', 'label': 'three' }
];

$(function () {
    $('input').autocompleter({ source: data });
});
```

If you will not define a value in source object, label will be used as a default value in input field after select.

## Options:

Autocompleter has the following options:

| Name        | Type | Description           | Deafult  |
| ------------- |:-------------:| -----:|-----:|
| source | str, obj | URL to the server or a local object  | null |
| asLocal | bool | Parse remote response as local source | false |
| empty | bool | Launch if value is empty |  true  |
| limit | int | Number of results to be displayed | 10 |
| minLength | int | Minimum length for autocompleter | 0 |
| delay | int | Few milliseconds to defer the request | 0 |
| customClass | array | Array with custom classes for autocompleter element | [] |
| cache | bool | Save xhr data to localStorage to avoid the repetition of requests | true |
| cacheExpires | int | localStorage data lifetime in sec (0 to disable cache expire) | 86400 |
| focusOpen | bool | Launch autocompleter when input gets focus  | true |
| hint | bool | Add hint to input with first matched label, correct styles should be installed | false |
| selectFirst | bool | If set to ``true``, first element in autocomplete list will be selected automatically, ignore if changeWhenSelect is on | false |
| changeWhenSelect | bool | Allows to change input value using arrow keys navigation in autocomplete list | true |
| highlightMatches | bool | This option defines ``<strong>`` tag wrap for matches in autocomplete results | false |
| ignoredKeyCode | array |  Array with ignorable keycodes, by default: ``9, 13, 17, 19, 20, 27, 33, 34, 35, 36, 37, 39, 44, 92, 113, 114, 115, 118, 119, 120, 122, 123, 144, 145`` | [] |
| customLabel  | str | The name of object's property which will be used as a label | false |
| customValue  | str | The name of object's property which will be used as a value | false |
| template | str | Custom template for list items. For example: ``<span>{{ label }} is {{ customPropertyFromSource }}</span>``. Template appends to ``.autocompleter-item``. | false |
| offset | str | Source response offset, for example: response.items.posts | false |
| combine | function | Returns an object which extends ajax data. Useful if you want to pass some additional server options | $.noop |
| callback | function | Select value callback function. Arguments: ``value``, ``index`` | $.noop |

## Methods:

#### Change option after plugin is defined:
```javascript
$('#input').autocompleter('option', data);
```

For example:
```javascript
$('#input').autocompleter('option', {
    limit: 5,
    template: '<img src="{{ image }}" alt="Image for autocompleter list item" /> {{ label }}'
});
```

#### Open list:
```javascript
$('#input').autocompleter('open');
```

#### Close list:
```javascript
$('#input').autocompleter('close');
```

#### Destroy plugin:
```javascript
$('#input').autocompleter('destroy');
```

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

## Example:

Autocompleter for the first name input with caching, match highlighting and 5 results limit. Remote response depends on a gender:

#### Form:
```html
<label for="gender_male">Male</label>
<input type="radio" name="gender" value="male" id="gender_male" checked="checked">

<label for="gender_female">Female</label>
<input type="radio" name="gender" value="female" id="gender_female">

<label for="firstname">First Name</label>
<input type="text" name="firstname" id="firstname">
```

#### JavaScript:
```javascript
$(function () {
    $('#firstname').autocompleter({
        limit: 5,
        cache: true,
        combine: function () {
            var gender = $('input:radio[name=gender]:checked').val();

            return {
                gender: gender
            };
        },
        callback: function (value, index) {
            console.log('Value ' + value + ' are selected (with index ' + index + ').');
        }
    });
});
```

## Main structure:

Simple 3-level: ``div (node) -> ul (list) -> li (item)``.

```html
<div class="autocompleter" id="autocompleter-1">
	<ul class="autocompleter-list">
		<li class="autocompleter-item">First</li>
		...
		<li class="autocompleter-item">Last</li>
	</ul>
</div>
```
