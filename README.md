# Searchable & Dependent Dropdown Widget for Yii2

A reusable Yii2 widget that provides a searchable dropdown list with support for dependent (cascading) dropdowns. It is designed to work seamlessly within the `wbraganca/yii2-dynamicform` widget and has no dependency on any specific CSS framework like Bootstrap.

## Features

-   Searchable dropdown list.
-   Support for dependent dropdowns (e.g., State -> City).
-   Works with `wbraganca/yii2-dynamicform` for creating dynamic forms.
-   Framework-independent styling.
-   Compatible with PHP 5.6+ and modern Yii2 projects.

## Installation

1.  Copy the entire `common/widgets/searchable_dep_drop` directory into your project's `common/widgets` (or any other suitable location).
2.  Ensure the namespace in the widget files matches the new location if you change it.

## Usage

### 1. Controller Action for Dependent Data

For dependent dropdowns, you need a controller action that returns data in JSON format. The widget expects the parent value as a POST parameter (the name of the parameter is derived from the parent field's name).

The action should return a JSON object with an `output` key, which is an array of objects, each having an `id` and `text` property.

**Example Controller Action:**

```php
// In your SiteController.php or another controller

public function actionListCities()
{
    \Yii::\$app->response->format = \yii\web\Response::FORMAT_JSON;
    \$out = ['output' => [], 'selected' => ''];

    // The widget sends the parent value, e.g., 'state' => 'California'
    if (Yii::\$app->request->post('state')) {
        \$state = Yii::\$app->request->post('state');
        if (\$state) {
            // Query your data source
            \$cities = AddressCity::find()
                ->where(['state' => \$state])
                ->orderBy('name')
                ->all();

            \$output = [];
            foreach (\$cities as \$city) {
                // Format the data as an array of ['id' => ..., 'text' => ...]
                \$output[] = ['id' => \$city->id, 'text' => \$city->name];
            }
            \$out['output'] = \$output;
        }
    }
    
    return \$out;
}
```

### 2. View File Setup

In your view file, you can use the widget like any other Yii2 input widget.

**A. Standalone Searchable Dropdown**

```php
use common\widgets\searchable_dep_drop\SearchableDepDrop;

// ...

echo $form->field($model, 'state')->widget(SearchableDepDrop::class, [
    'data' => [
        'California' => 'California',
        'Texas' => 'Texas',
        // ... other states
    ],
    'placeholder' => 'Select a state...',
]);
```

**B. Dependent Dropdown**

Here is a complete example for a State -> City dropdown setup.

```php
use common\widgets\searchable_dep_drop\SearchableDepDrop;
use yii\helpers\ArrayHelper;
use yii\helpers\Url;
use common\models\AddressCity; // Your model for cities/states

// ...

// State Dropdown (Parent)
echo $form->field($model, 'state')->widget(SearchableDepDrop::class, [
    'data' => ArrayHelper::map(
        AddressCity::find()->select('state')->distinct()->orderBy('state')->all(),
        'state',
        'state'
    ),
    'options' => [
        'id' => 'address-state', // A unique ID is required
    ],
    'placeholder' => 'Select a state...',
]);

// City Dropdown (Child)
echo $form->field($model, 'city_id')->widget(SearchableDepDrop::class, [
    'options' => [
        'id' => 'address-city', // A unique ID is required
    ],
    'placeholder' => 'Select City/Municipality',
    'pluginOptions' => [
        'depends' => ['address-state'], // The ID of the parent dropdown
        'url' => Url::to(['/site/list-cities']), // The URL of your controller action
    ],
])->label('City/Municipality');
```

### 3. Dynamic Form Integration

To make the widget work with `wbraganca/yii2-dynamicform`, you need to add a JavaScript block to your view to initialize the widgets on newly added form rows.

**Important:** The following script should be placed in your view file after the `ActiveForm::end()` call. It handles the initialization for both the initial page load and for items added dynamically.

**JavaScript for Dynamic Forms:**

```php
<?php
// --- Main DynamicForm & SearchableDepDrop scripts ---

$jsMain = <<<JS

// Function to initialize the SearchableDepDrop widget
function initSearchableDepDrop(context) {
    \$(context).find('.sdd-container').each(function() {
        var \$container = \$(this);
        // Check if the plugin is already initialized
        if (\$container.data('searchableDepDrop')) {
            return; // Skip if already initialized
        }

        var optionsJson = \$container.data('sdd-options');
        if (optionsJson) {
            var options = (typeof optionsJson === 'string') ? JSON.parse(optionsJson) : optionsJson;

            // This is the crucial part for dynamic forms.
            // It updates the 'depends' ID to match the new dynamic row index.
            if (options.depends) {
                var newDepends = [];
                var newId = \$container.attr('id');
                var matches = newId.match(/-(\\d+)-/);
                if (matches) {
                    var index = matches[1];
                    \$.each(options.depends, function(i, dep) {
                        newDepends.push(dep.replace(/-(\\d+)-/, '-' + index + '-'));
                    });
                    options.depends = newDepends;
                }
            }
            \$container.searchableDepDrop(options);
        }
    });
}


// --- DynamicForm Event Handlers ---

\$('.your-dynamic-form-wrapper-class').on('afterInsert', function(e, item) {
    // ... your other afterInsert logic ...
    
    // Initialize our widget on the new item
    initSearchableDepDrop(item);
});

\$('.your-dynamic-form-wrapper-class').on('afterDelete', function(e, item) {
    // ... your afterDelete logic ...
});


// --- Initializations on Page Load ---

initSearchableDepDrop(document.body); // Initialize for existing items

JS;
$this->registerJs($jsMain, \yii\web\View::POS_READY);
?>
```

**Note:** Remember to replace `.your-dynamic-form-wrapper-class` with the actual `widgetContainer` class you defined in your `DynamicFormWidget::begin()` call.
