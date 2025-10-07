<?php

namespace rft\searchabledepdrop\widgets;

use yii\web\AssetBundle;

class SearchableDepDropAsset extends AssetBundle
{
    public $sourcePath = '@common/widgets/searchable_dep_drop/assets';

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
