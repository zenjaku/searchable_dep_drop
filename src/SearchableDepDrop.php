<?php

namespace rft\searchabledepdrop\widgets;

use yii\base\Widget;
use yii\helpers\Html;
use yii\helpers\Json;
use yii\helpers\Url;

class SearchableDepDrop extends Widget
{
    public $data = [];
    public $url;
    public $depends = [];
    public $paramNames = [];
    public $placeholder = 'Select...';
    public $pluginOptions = [];
    public $rowSelector = '.item-item, .item';
    public $allowMultiple = false;

    public function init()
    {
        parent::init();
        if (!isset($this->options['id'])) {
            $this->options['id'] = $this->getId();
        }
    }

    public function run()
    {
        $this->registerAssets();
        echo $this->renderWidget();
    }

    protected function renderWidget()
    {
        $containerOptions = $this->options;
        if (isset($containerOptions['class'])) {
            $containerOptions['class'] .= ' sdd-container';
        } else {
            $containerOptions['class'] = 'sdd-container';
        }

        $clientOptions = $this->getClientOptions();
        $containerOptions['data-sdd-options'] = Json::encode($clientOptions);

        $hiddenInput = $this->hasModel()
            ? Html::activeHiddenInput($this->model, $this->attribute)
            : Html::hiddenInput($this->name, $this->value);

        $display = Html::tag('div', '', ['class' => 'sdd-display']);
        $search = Html::textInput(null, '', ['class' => 'sdd-search', 'placeholder' => 'Search...']);
        $list = Html::tag('ul', '', ['class' => 'sdd-list']);
        $dropdown = Html::tag('div', $search . $list, ['class' => 'sdd-dropdown']);

        return Html::tag('div', $hiddenInput . $display . $dropdown, $containerOptions);
    }

    protected function getClientOptions()
    {
        $clientOptions = $this->pluginOptions;
        $clientOptions['data'] = $this->data;
        $clientOptions['placeholder'] = $this->placeholder;
        $clientOptions['rowSelector'] = $this->rowSelector;
        $clientOptions['allowMultiple'] = $this->allowMultiple;

        if (!empty($this->paramNames)) {
            $clientOptions['paramNames'] = $this->paramNames;
        }

        if ($this->hasModel()) {
            $clientOptions['initialValue'] = Html::getAttributeValue($this->model, $this->attribute);
        } else {
            $clientOptions['initialValue'] = $this->value;
        }

        if (!empty($this->url)) {
            $clientOptions['url'] = Url::to($this->url);
        }

        if (!empty($this->depends)) {
            $clientOptions['depends'] = $this->depends;
        }
        return $clientOptions;
    }

    protected function registerAssets()
    {
        $view = $this->getView();
        SearchableDepDropAsset::register($view);
    }
}
