# Searchable & Dependent Dropdown Widget for Yii2

A reusable Yii2 widget that provides a searchable dropdown list with support for dependent (cascading) dropdowns.  
It is designed to work seamlessly within the `wbraganca/yii2-dynamicform` widget and has no dependency on any specific CSS framework like Bootstrap.

> **Note:** This package uses the `rft\searchabledepdrop\widgets` namespace. Make sure to update your imports if you're upgrading from an older version.

## Features

- Searchable dropdown list.
- Support for dependent dropdowns (e.g., State -> City).
- **Multiple selection support** - Allow users to select multiple values.
- Works with `wbraganca/yii2-dynamicform` for creating dynamic forms.
- Framework-independent styling with modern, responsive design.
- Custom styling for multiple selection with removable tags.
- Compatible with PHP 5.6+ and modern Yii2 projects.

## Installation

### Via Composer (Recommended)

The preferred way to install this extension is through [Composer](https://getcomposer.org/).

```bash
composer require rft/yii2-searchable-depdrop
```

Yii2 will automatically load the widget via Composer’s autoloader.

### Manual Installation (Alternative)

If you don't want to use Composer, you can still install it manually:

1. Download the source files from the `src/` directory
2. Place them in your project's widget directory (e.g., `common/widgets/searchable_dep_drop/`)
3. Ensure the namespace in the widget files matches the new location if you change it
4. Include the CSS and JS assets from the `src/assets/` directory

## Usage

### 1. Controller Action for Dependent Data

For dependent dropdowns, you need a controller action that returns data in JSON format.  
The widget expects the parent value as a POST parameter (the name of the parameter is derived from the parent field's name).

The action should return a JSON object with an `output` key, which is an array of objects, each having an `id` and `text` property.

**Example Controller Action:**

```php
public function actionListCities()
{
    \Yii::\$app->response->format = \yii\web\Response::FORMAT_JSON;
    $out = ['output' => [], 'selected' => ''];

    if (Yii::\$app->request->post('state')) {
        $state = Yii::\$app->request->post('state');
        if ($state) {
            $cities = AddressCity::find()
                ->where(['state' => $state])
                ->orderBy('name')
                ->all();

            $output = [];
            foreach ($cities as $city) {
                $output[] = ['id' => $city->id, 'text' => $city->name];
            }
            $out['output'] = $output;
        }
    }

    return $out;
}
```

---

### 2. View File Setup

In your view file, you can use the widget like any other Yii2 input widget.

**A. Standalone Searchable Dropdown**

```php
use rft\searchabledepdrop\widgets\SearchableDepDrop;

echo $form->field($model, 'state')->widget(SearchableDepDrop::class, [
    'data' => [
        'California' => 'California',
        'Texas' => 'Texas',
        // ... other states
    ],
    'placeholder' => 'Select a state...',
]);
```

**B. Multiple Selection Dropdown**

```php
use rft\searchabledepdrop\widgets\SearchableDepDrop;

echo $form->field($model, 'tags')->widget(SearchableDepDrop::class, [
    'data' => [
        '1' => 'PHP',
        '2' => 'JavaScript',
        '3' => 'Python',
        '4' => 'Java',
        '5' => 'C#',
        // ... other options
    ],
    'allowMultiple' => true,
    'placeholder' => 'Select multiple technologies...',
]);
```

**C. Dependent Dropdown**

Example for a State → City dropdown setup:

```php
use rft\searchabledepdrop\widgets\SearchableDepDrop;
use yii\helpers\ArrayHelper;
use yii\helpers\Url;
use common\models\AddressCity;

// State Dropdown (Parent)
echo $form->field($model, 'state')->widget(SearchableDepDrop::class, [
    'data' => ArrayHelper::map(
        AddressCity::find()->select('state')->distinct()->orderBy('state')->all(),
        'state',
        'state'
    ),
    'options' => [
        'id' => 'address-state',
    ],
    'placeholder' => 'Select a state...',
]);

// City Dropdown (Child)
echo $form->field($model, 'city_id')->widget(SearchableDepDrop::class, [
    'options' => [
        'id' => 'address-city',
    ],
    'placeholder' => 'Select City/Municipality',
    'pluginOptions' => [
        'depends' => ['address-state'],
        'url' => Url::to(['/site/list-cities']),
    ],
])->label('City/Municipality');
```

---

## Styling Features

The widget comes with built-in CSS that provides:

- **Modern Design**: Clean, professional appearance with subtle shadows and borders
- **Responsive Layout**: Adapts to different screen sizes and container widths
- **Multiple Selection Tags**: Selected items appear as removable tags with:
  - Black background with white text
  - Rounded corners (12px border-radius)
  - Remove button (×) with hover effects
  - Text truncation for long items
- **Search Interface**: Dedicated search input with clear visual separation
- **Dropdown Styling**:
  - Smooth hover effects
  - Scrollable list (max-height: 200px)
  - Active item highlighting
  - No results message styling
- **Framework Independence**: No dependency on Bootstrap or other CSS frameworks

### Custom Styling

You can override the default styles by targeting the CSS classes:

```css
/* Main container */
.sdd-container {
  /* Your custom styles */
}

/* Display area */
.sdd-display {
  border: 2px solid #your-color;
  border-radius: 6px;
}

/* Selected items in multiple selection */
.sdd-selected-item {
  background-color: #your-color;
  border-radius: 8px;
}

.sdd-selected-item-container {
  max-width: 100px; /* Adjust tag width */
}

.sdd-item-text {
  font-size: 12px; /* Adjust text size */
}

.sdd-remove-btn {
  color: #your-remove-color;
}

/* Dropdown */
.sdd-dropdown {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

/* Search input */
.sdd-search {
  padding: 10px 12px;
  font-size: 14px;
}

/* List items */
.sdd-list li {
  padding: 10px 15px;
}

.sdd-list li:hover {
  background-color: #your-hover-color;
}
```

### Available CSS Classes

| Class                          | Purpose                                       |
| ------------------------------ | --------------------------------------------- |
| `.sdd-container`               | Main widget container                         |
| `.sdd-display`                 | Display area showing selected values          |
| `.sdd-selected-item`           | Individual selected item tag                  |
| `.sdd-selected-item-container` | Container for selected item and remove button |
| `.sdd-item-text`               | Text within selected item                     |
| `.sdd-remove-btn`              | Remove button (×) for selected items          |
| `.sdd-dropdown`                | Dropdown container                            |
| `.sdd-search`                  | Search input field                            |
| `.sdd-list`                    | List of available options                     |
| `.sdd-active`                  | Currently highlighted option                  |
| `.sdd-no-results`              | No results message                            |

---

## Configuration Options

The widget supports several configuration options:

| Option          | Type    | Default               | Description                                       |
| --------------- | ------- | --------------------- | ------------------------------------------------- |
| `data`          | array   | `[]`                  | Array of options for the dropdown                 |
| `url`           | string  | `null`                | URL for dependent dropdown data                   |
| `depends`       | array   | `[]`                  | Array of parent field IDs for dependent dropdowns |
| `paramNames`    | array   | `[]`                  | Custom parameter names for dependent requests     |
| `placeholder`   | string  | `'Select...'`         | Placeholder text for the dropdown                 |
| `allowMultiple` | boolean | `false`               | Enable multiple selection                         |
| `rowSelector`   | string  | `'.item-item, .item'` | CSS selector for dynamic form rows                |
| `pluginOptions` | array   | `[]`                  | Additional JavaScript options                     |

---

### 3. Dynamic Form Integration

The widget works seamlessly with `wbraganca/yii2-dynamicform`. Here's how to implement dependent dropdowns in dynamic forms:

**Essential Widget Usage:**

```php
use rft\searchabledepdrop\widgets\SearchableDepDrop;

// State dropdown (parent)
echo $form->field($addresses[$i], "[{$i}]state")->widget(SearchableDepDrop::classname(), [
    'data' => ArrayHelper::map(
        AddressCity::find()->select('state')->distinct()->orderBy('state')->all(),
        'state', 'state'
    ),
    'placeholder' => 'Select State...',
    'options' => ['class' => 'form-control state-dropdown'],
]);

// City dropdown (child - depends on state)
echo $form->field($addresses[$i], "[{$i}]city_id")->widget(SearchableDepDrop::classname(), [
    'data' => [],
    'placeholder' => 'Select City...',
    'options' => ['class' => 'form-control city-dropdown'],
    'pluginOptions' => [
        'depends' => ['.state-dropdown'],
        'paramNames' => ['state'],
        'url' => Url::to(['/site/cities']),
    ]
]);
```

**Required JavaScript for Dynamic Forms:**

```javascript
function initSearchableDepDrop(context) {
  $(context)
    .find(".sdd-container")
    .each(function () {
      var $container = $(this);
      if ($container.data("searchableDepDrop")) return;

      var optionsJson = $container.data("sdd-options");
      if (optionsJson) {
        var options = typeof optionsJson === "string" ? JSON.parse(optionsJson) : optionsJson;
        $container.searchableDepDrop(options);
      }
    });
}

// Initialize widgets on new form rows
$(".dynamicform_wrapper").on("afterInsert", function (e, item) {
  initSearchableDepDrop(item);
});

// Initialize existing widgets
initSearchableDepDrop(document.body);
```

> **Note:** Replace `.dynamicform_wrapper` with your actual `widgetContainer` class from `DynamicFormWidget::begin()`.

### Multiple Selection Example

To enable multiple selection in any dropdown, simply set `allowMultiple => true`:

```php
// Multiple selection for skills/tags
echo $form->field($model, 'skills')->widget(SearchableDepDrop::classname(), [
    'data' => [
        '1' => 'PHP',
        '2' => 'JavaScript',
        '3' => 'Python',
        '4' => 'Java',
        '5' => 'C#',
        '6' => 'Ruby',
        '7' => 'Go',
        '8' => 'Swift',
    ],
    'allowMultiple' => true,
    'placeholder' => 'Select your skills...',
    'options' => ['class' => 'form-control skills-dropdown'],
]);

// Multiple selection for categories in dynamic form
echo $form->field($contact, "[{$i}]categories")->widget(SearchableDepDrop::classname(), [
    'data' => [
        '1' => 'Business',
        '2' => 'Personal',
        '3' => 'Emergency',
        '4' => 'Family',
        '5' => 'Friend',
    ],
    'allowMultiple' => true,
    'placeholder' => 'Select contact categories...',
    'options' => ['class' => 'form-control categories-dropdown'],
]);
```

**Important Notes:**

- For multiple selection, your model attribute should be an array or JSON field
- The widget automatically handles the serialization of multiple values
- Selected items appear as removable tags in the display area
- The `paramNames` option is crucial for dependent dropdowns to work properly

---

## Recent Changes (v1.0.1)

### Fixed Issues

- **Fixed PSR-4 Autoloading**: Reorganized file structure to match namespace requirements
  - Moved `SearchableDepDrop.php` to `src/widgets/SearchableDepDrop.php`
  - Moved `SearchableDepDropAsset.php` to `src/widgets/SearchableDepDropAsset.php`
  - Updated asset sourcePath to use vendor directory path
  - This resolves the "Class not found" error after composer install

### Enhanced Features

- **Improved CSS Styling**: Enhanced dropdown list items with text wrapping and visual separation
- **Better Documentation**: Added comprehensive styling documentation and usage examples
- **Multiple Selection Support**: Full support for selecting multiple values with removable tags

### Package Structure

```
src/
├── widgets/
│   ├── SearchableDepDrop.php
│   └── SearchableDepDropAsset.php
└── assets/
    ├── css/
    │   └── searchable-dep-drop.css
    └── js/
        └── searchable-dep-drop.js
```

### Migration Guide

If you're upgrading from a previous version:

1. Update your composer package: `composer update rft/yii2-searchable-depdrop`
2. The namespace remains the same: `use rft\searchabledepdrop\widgets\SearchableDepDrop;`
3. No code changes required in your existing implementations

---

## License

This project is licensed under the [MIT License](LICENSE).
