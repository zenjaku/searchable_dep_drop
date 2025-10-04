# Searchable & Dependent Dropdown Widget for Yii2

A reusable Yii2 widget that provides a searchable dropdown list with support for dependent (cascading) dropdowns.  
It is designed to work seamlessly within the `wbraganca/yii2-dynamicform` widget and has no dependency on any specific CSS framework like Bootstrap.

## Features

- Searchable dropdown list.
- Support for dependent dropdowns (e.g., State -> City).
- Works with `wbraganca/yii2-dynamicform` for creating dynamic forms.
- Framework-independent styling.
- Compatible with PHP 5.6+ and modern Yii2 projects.

## Installation

### Via Composer (Recommended)

The preferred way to install this extension is through [Composer](https://getcomposer.org/).

```bash
composer require tomaraoo/searchabledepdrop
```

(Replace `tomaraoo/searchabledepdrop` with your actual GitHub/Packagist package name.)

Yii2 will automatically load the widget via Composer’s autoloader.

### Manual Installation (Alternative)

If you don’t want to use Composer, you can still install it manually:

1. Copy the entire `common/widgets/searchable_dep_drop` directory into your project’s `common/widgets` (or any other suitable location).
2. Ensure the namespace in the widget files matches the new location if you change it.

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
use tomaraoo\searchabledepdrop\SearchableDepDrop;

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

Example for a State → City dropdown setup:

```php
use tomaraoo\searchabledepdrop\SearchableDepDrop;
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

### 3. Dynamic Form Integration

To make the widget work with `wbraganca/yii2-dynamicform`, you need to add a JavaScript block to your view to initialize the widgets on newly added form rows.

Place this **after `ActiveForm::end()`**.

```php
<?php
$jsMain = <<<JS
function initSearchableDepDrop(context) {
    $(context).find('.sdd-container').each(function() {
        var $container = $(this);
        if ($container.data('searchableDepDrop')) {
            return;
        }

        var optionsJson = $container.data('sdd-options');
        if (optionsJson) {
            var options = (typeof optionsJson === 'string') ? JSON.parse(optionsJson) : optionsJson;

            if (options.depends) {
                var newDepends = [];
                var newId = $container.attr('id');
                var matches = newId.match(/-(\d+)-/);
                if (matches) {
                    var index = matches[1];
                    $.each(options.depends, function(i, dep) {
                        newDepends.push(dep.replace(/-(\d+)-/, '-' + index + '-'));
                    });
                    options.depends = newDepends;
                }
            }
            $container.searchableDepDrop(options);
        }
    });
}

$('.your-dynamic-form-wrapper-class').on('afterInsert', function(e, item) {
    initSearchableDepDrop(item);
});

$('.your-dynamic-form-wrapper-class').on('afterDelete', function(e, item) {
    // Optional: handle delete cleanup
});

initSearchableDepDrop(document.body);
JS;

$this->registerJs($jsMain, \yii\web\View::POS_READY);
?>
```

> ⚠️ Replace `.your-dynamic-form-wrapper-class` with the `widgetContainer` class you defined in `DynamicFormWidget::begin()`.

---

## License

This project is licensed under the [MIT License](LICENSE).
