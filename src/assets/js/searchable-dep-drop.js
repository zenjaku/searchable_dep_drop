(function ($) {
    'use strict';

    var SearchableDepDrop = function (element, options) {
        this.$container = $(element);
        this.options = options;
        this.allowMultiple = options.allowMultiple || false;
        this.selectedValues = [];
        this.init();
    };

    SearchableDepDrop.prototype = {
        constructor: SearchableDepDrop,

        init: function () {
            // Find elements
            this.$hiddenInput = this.$container.find('input[type="hidden"]');
            this.$display = this.$container.find('.sdd-display');
            this.$dropdown = this.$container.find('.sdd-dropdown');
            this.$search = this.$container.find('.sdd-search');
            this.$list = this.$container.find('.sdd-list');

            // Initial data
            this.data = this.options.data || {};
            this.isDependent = this.options.url && this.options.depends && this.options.depends.length > 0;
            this.isLoading = false;
            this.options.rowSelector = this.options.rowSelector || '.item-item, .item';

            // Populate initial state
            this.populateList(this.data);
            this.initSelection();

            // Bind events
            this.bindEvents();

            // For non-dependent dropdowns, if there's an initial value, set it.
            if (!this.isDependent) {
                this.initSelection();
            }
        },

        bindEvents: function () {
            var self = this;

            this.$display.on('click', function (e) {
                // Prevent dropdown from opening when clicking remove buttons
                if ($(e.target).hasClass('sdd-remove-btn') || $(e.target).closest('.sdd-remove-btn').length > 0) {
                    return;
                }
                
                if (self.$dropdown.is(':visible')) {
                    self.closeDropdown();
                } else {
                    self.openDropdown();
                }
            });

            this.$search.on('keyup', function () {
                self.filterList($(this).val());
            });

            this.$list.on('click', 'li:not(.sdd-no-results)', function () {
                var $li = $(this);
                var value = $li.data('value');
                var text = $li.text();
                self.selectItem(value, text);
            });

            // Event delegation for dynamically created remove buttons
            this.$container.on('click', '.sdd-remove-btn', function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                var value = $(this).data('value');
                self.removeSelectedItem(value);
                return false;
            });

            $(document).on('click', function (e) {
                if (!self.$container.is(e.target) && self.$container.has(e.target).length === 0) {
                    self.closeDropdown();
                }
            });

            if (this.isDependent) {
                var eventName = 'change.sdd.' + this.$container.attr('id');
                var $row = this.$container.closest(this.options.rowSelector);

                $.each(this.options.depends, function (i, parentDep) {
                    var $parentContainer;
                    var parentSelector = parentDep;

                    if (!parentDep.startsWith('.') && !parentDep.startsWith('#')) {
                        parentSelector = '#' + parentDep;
                    }

                    if (parentSelector.startsWith('.')) {
                        if ($row.length) {
                            $parentContainer = $row.find(parentSelector);
                        } else {
                            $parentContainer = $(parentSelector);
                        }
                        
                        if ($parentContainer.length) {
                            var $parentInput = $parentContainer.find('input[type="hidden"]');
                            $parentInput.off(eventName).on(eventName, $.proxy(self.fetchDependentData, self));
                        }
                    } else {
                        $(document).off('change.sdd', parentSelector).on('change.sdd', parentSelector, $.proxy(self.fetchDependentData, self));
                    }
                });

                setTimeout($.proxy(this.fetchDependentData, this), 100);
            }
        },

        initSelection: function () {
            var initialValue = this.options.initialValue;
            if (initialValue !== null && initialValue !== undefined && initialValue !== '') {
                if (this.allowMultiple) {
                    var values = initialValue.toString().split(',');
                    var texts = [];
                    for (var i = 0; i < values.length; i++) {
                        var value = values[i].trim();
                        if (value) {
                            var text = this.getTextFromValue(value);
                            if (text !== null) {
                                this.selectedValues.push(value);
                                texts.push(text);
                                this.$list.find('li').filter(function () {
                                    return $(this).data('value') == value;
                                }).addClass('sdd-active');
                            }
                        }
                    }
                    
                    if (this.selectedValues.length > 0) {
                        this.updateMultipleDisplay();
                        this.$hiddenInput.val(this.selectedValues.join(','));
                    } else {
                        this.clear();
                    }
                } else {
                    var text = this.getTextFromValue(initialValue);
                    if (text !== null) {
                        this.selectItem(initialValue, text, true);
                    }
                }
            } else {
                this.clear();
            }
        },

        getTextFromValue: function (value) {
            var text = null;
            $.each(this.data, function (val, txt) {
                if (val == value) {
                    text = txt;
                    return false;
                }
            });
            return text;
        },

        populateList: function (data) {
            var self = this;
            this.$list.empty();
            this.data = data || {};
            var count = 0;
            $.each(this.data, function (value, text) {
                var $li = $('<li>').data('value', value).text(text);
                self.$list.append($li);
                count++;
            });

            if (count === 0) {
                this.$list.append('<li class="sdd-no-results">No results found</li>');
            }
        },

        filterList: function (query) {
            var found = false;
            query = query.toLowerCase();
            this.$list.find('li:not(.sdd-no-results)').each(function () {
                var $li = $(this);
                var text = $li.text().toLowerCase();
                if (text.indexOf(query) > -1) {
                    $li.show();
                    found = true;
                } else {
                    $li.hide();
                }
            });
            this.$list.find('.sdd-no-results').toggle(!found);
        },

        selectItem: function (value, text, isInitialization) {
            isInitialization = isInitialization || false;

            if (this.allowMultiple) {
                var index = this.selectedValues.indexOf(value);
                if (index === -1) {
                    this.selectedValues.push(value);
                    this.$list.find('li').filter(function () {
                        return $(this).data('value') == value;
                    }).addClass('sdd-active');
                } else {
                    this.selectedValues.splice(index, 1);
                    this.$list.find('li').filter(function () {
                        return $(this).data('value') == value;
                    }).removeClass('sdd-active');
                }
                
                this.updateMultipleDisplay();
                this.$hiddenInput.val(this.selectedValues.join(',')).trigger('change.sdd');
                
                if (!isInitialization) {
                    this.filterList('');
                }
            } else {
                if (this.$hiddenInput.val() != value) {
                    this.$hiddenInput.val(value).trigger('change.sdd');
                }

                this.$display.html('<span>' + text + '</span>').removeClass('sdd-placeholder');
                this.$list.find('li').removeClass('sdd-active');
                this.$list.find('li').filter(function () {
                    return $(this).data('value') == value;
                }).addClass('sdd-active');

                if (!isInitialization) {
                    this.closeDropdown();
                }
            }
        },

        openDropdown: function () {
            $('.sdd-container').not(this.$container).find('.sdd-dropdown').hide();
            this.$dropdown.show();
            this.$search.val('').focus();
            this.filterList('');
        },

        closeDropdown: function () {
            this.$dropdown.hide();
        },

        updateMultipleDisplay: function () {
            if (!this.allowMultiple) return;
            
            if (this.selectedValues.length === 0) {
                this.$display.html('<span class="sdd-placeholder">' + this.options.placeholder + '</span>').addClass('sdd-placeholder');
            } else {
                var self = this;
                var displayHtml = '';
                
                // Create individual chips for each selected item with remove buttons
                $.each(this.selectedValues, function (index, value) {
                    var text = self.getTextFromValue(value);
                    if (text) {
                        displayHtml += '<div class="sdd-selected-item-container"><span class="sdd-selected-item" data-value="' + value + '">' + 
                                     '<span class="sdd-item-text">' + text + '</span>' +
                                     '<span class="sdd-remove-btn" data-value="' + value + '">−</span>' +
                                     '</span></div>';
                    }
                });
                
                this.$display.html(displayHtml).removeClass('sdd-placeholder');
            }
        },

        removeSelectedItem: function (value) {
            if (!this.allowMultiple) return;
            
            // Convert to string to ensure type consistency with selectedValues array
            var stringValue = String(value);
            var index = this.selectedValues.indexOf(stringValue);
            
            if (index !== -1) {
                this.selectedValues.splice(index, 1);
                this.$list.find('li').filter(function () {
                    return $(this).data('value') == value;
                }).removeClass('sdd-active');
                
                this.updateMultipleDisplay();
                this.$hiddenInput.val(this.selectedValues.join(',')).trigger('change.sdd');
            }
        },

        clear: function () {
            this.$hiddenInput.val('').trigger('change.sdd');
            if (this.allowMultiple) {
                this.selectedValues = [];
                this.updateMultipleDisplay();
            } else {
                this.$display.text(this.options.placeholder).addClass('sdd-placeholder');
            }
            this.$list.find('li').removeClass('sdd-active');
        },

        setLoading: function (loading) {
            this.isLoading = loading;
            if (loading) {
                this.$display.text(this.options.loadingText || 'Loading...').addClass('sdd-placeholder');
            } else {
                if (!this.$hiddenInput.val()) {
                    this.$display.text(this.options.placeholder).addClass('sdd-placeholder');
                }
            }
        },

        fetchDependentData: function () {
            var self = this;
            var parentValues = {};
            var allParentsHaveValue = true;
            var $row = this.$container.closest(this.options.rowSelector);

                $.each(this.options.depends, function (i, parentDep) {
                    var $parentContainer;
                    var parentSelector = parentDep;

                    if (!parentDep.startsWith('.') && !parentDep.startsWith('#')) {
                        parentSelector = '#' + parentDep;
                    }

                    if (parentSelector.startsWith('.')) {
                        if ($row.length) {
                            $parentContainer = $row.find(parentSelector);
                        } else {
                            $parentContainer = $(parentSelector);
                        }
                    } else {
                        $parentContainer = $(parentSelector);
                    }

                    if (!$parentContainer || $parentContainer.length === 0) {
                        allParentsHaveValue = false;
                        return;
                    }
                    
                    var $parentInput = $parentContainer.find('input[type="hidden"]');
                    var parentVal = $parentInput.val();

                    if (parentVal === '' || parentVal === null) {
                        allParentsHaveValue = false;
                        return;
                    }

                    var paramName;
                    if (self.options.paramNames && self.options.paramNames[i]) {
                        paramName = self.options.paramNames[i];
                    } else {
                        var parentName = $parentInput.attr('name');
                        paramName = self.extractFieldName(parentName) || parentDep.replace(/[^a-zA-Z0-9_]/g, '');
                    }
                    parentValues[paramName] = parentVal;
                });

            if (!allParentsHaveValue) {
                this.clear();
                this.populateList({});
                return;
            }

            this.setLoading(true);

            $.ajax({
                url: this.options.url,
                dataType: 'json',
                data: parentValues,
                method: 'POST',
                success: function (response) {
                    var data = {};
                    if (response.output) {
                        $.each(response.output, function (i, item) {
                            var text = item.name || item.text || '';
                            data[item.id] = text;
                        });
                    }
                    self.populateList(data);

                    var currentValue = self.$hiddenInput.val();
                    if (self.options.initialize && currentValue && data[currentValue]) {
                        self.selectItem(currentValue, data[currentValue], true);
                    } else {
                        self.clear();
                    }
                },
                error: function (xhr, status, error) {
                    self.clear();
                    self.populateList({});
                },
                complete: function () {
                    self.setLoading(false);
                }
            });
        },

        extractFieldName: function (fullName) {
            if (!fullName) return null;
            // Extract field name from array notation like "Model[field]" or "Model[0][field]"
            var matches = fullName.match(/(?:\\\[([^\\\]]+)\\\]|[^\\\[\\\]]+)$/);
            return matches ? matches[1] || matches[0] : fullName;
        }
    };

    $.fn.searchableDepDrop = function (option) {
        var args = Array.apply(null, arguments);
        args.shift();
        return this.each(function () {
            var $this = $(this),
                data = $this.data('searchableDepDrop'),
                options = typeof option === 'object' && option;

            if (!data) {
                var pluginOptions = $.extend({}, $.fn.searchableDepDrop.defaults, options, $this.data('sdd-options'));
                $this.data('searchableDepDrop', (data = new SearchableDepDrop(this, pluginOptions)));
            }

            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.searchableDepDrop.defaults = {};

})(jQuery);