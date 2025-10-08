<?php

namespace rft\searchabledepdrop\widgets;

use yii\web\AssetBundle;

class SearchableDepDropAsset extends AssetBundle
{
    public $sourcePath = '@vendor/rft/yii2-searchable-depdrop/src/assets';

    public $css = [
        'css/searchable-dep-drop.css',
    ];

    public $js = [
        'js/searchable-dep-drop.js',
    ];

    public $depends = [
        'yii\web\YiiAsset',
    ];
}
