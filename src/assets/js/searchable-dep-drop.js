(function ($) {
    'use strict';

    var SearchableDepDrop = function (element, options) {
        this.$container = $(element);
        this.options = options;
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

            // Toggle dropdown
            this.$display.on('click', function () {
                if (self.$dropdown.is(':visible')) {
                    self.closeDropdown();
                } else {
                    self.openDropdown();
                }
            });

            // Search
            this.$search.on('keyup', function () {
                self.filterList($(this).val());
            });

            // Select item
            this.$list.on('click', 'li:not(.sdd-no-results)', function () {
                var $li = $(this);
                var value = $li.data('value');
                var text = $li.text();
                self.selectItem(value, text);
            });

            // Close when clicking outside
            $(document).on('click', function (e) {
                if (!self.$container.is(e.target) && self.$container.has(e.target).length === 0) {
                    self.closeDropdown();
                }
            });

            // Dependent logic
            if (this.isDependent) {
                var eventName = 'change.sdd';
                $.each(this.options.depends, function (i, parentId) {
                    // Use a namespaced event to avoid conflicts
                    $(document).off(eventName, '#' + parentId).on(eventName, '#' + parentId, $.proxy(self.fetchDependentData, self));
                });
                // Also trigger on init to load initial data if parent has value
                this.fetchDependentData();
            }
        },

        initSelection: function () {
            var initialValue = this.options.initialValue;
            if (initialValue !== null && initialValue !== undefined && initialValue !== '') {
                var text = this.getTextFromValue(initialValue);
                if (text !== null) {
                    this.selectItem(initialValue, text, true);
                }
            } else {
                this.clear();
            }
        },

        getTextFromValue: function (value) {
            var text = null;
            $.each(this.data, function (val, txt) {
                if (val == value) { // Use == for loose comparison
                    text = txt;
                    return false; // break
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

            // Only trigger change if value is different
            if (this.$hiddenInput.val() != value) {
                this.$hiddenInput.val(value).trigger('change.sdd');
            }

            this.$display.text(text).removeClass('sdd-placeholder');
            this.$list.find('li').removeClass('sdd-active');
            this.$list.find('li').filter(function () {
                return $(this).data('value') == value;
            }).addClass('sdd-active');

            if (!isInitialization) {
                this.closeDropdown();
            }
        },

        openDropdown: function () {
            // Close other open dropdowns
            $('.sdd-container').not(this.$container).find('.sdd-dropdown').hide();
            this.$dropdown.show();
            this.$search.val('').focus();
            this.filterList('');
        },

        closeDropdown: function () {
            this.$dropdown.hide();
        },

        clear: function () {
            this.$hiddenInput.val('').trigger('change.sdd');
            this.$display.text(this.options.placeholder).addClass('sdd-placeholder');
            this.$list.find('li').removeClass('sdd-active');
        },

        setLoading: function (loading) {
            this.isLoading = loading;
            if (loading) {
                this.$display.text('Loading...').addClass('sdd-placeholder');
            } else {
                // If not loading and no value, revert to placeholder
                if (!this.$hiddenInput.val()) {
                    this.$display.text(this.options.placeholder).addClass('sdd-placeholder');
                }
            }
        },

        fetchDependentData: function () {
            var self = this;
            var parentValues = {};
            var allParentsHaveValue = true;

            $.each(this.options.depends, function (i, parentId) {
                var $parentContainer = $('#' + parentId);
                var $parentInput = $parentContainer.find('input[type="hidden"]');
                var parentVal = $parentInput.val();

                if (parentVal === '' || parentVal === null) {
                    allParentsHaveValue = false;
                    return; // continue to next iteration
                }

                // Determine the parameter name - ONLY ONCE
                var paramName;

                // First priority: use explicitly configured paramNames
                if (self.options.paramNames && self.options.paramNames[i]) {
                    paramName = self.options.paramNames[i];
                }
                // Second priority: extract from the parent input's name attribute
                else {
                    var parentName = $parentInput.attr('name');
                    paramName = self.extractFieldName(parentName) || parentId;
                }

                // Set the parameter value - ONLY ONCE
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
                            // Support both 'name' and 'text' keys for compatibility
                            var text = item.name || item.text || '';
                            data[item.id] = text;
                        });
                    }
                    self.populateList(data);

                    // Check if we should select a value
                    var currentValue = self.$hiddenInput.val();
                    if (currentValue && data[currentValue]) {
                        self.selectItem(currentValue, data[currentValue], true);
                    } else {
                        self.clear();
                    }
                },
                error: function (xhr, status, error) {
                    console.error('Error fetching dependent data for ' + self.$container.attr('id'), error);
                    self.clear();
                    self.populateList({});
                },
                complete: function () {
                    self.setLoading(false);
                }
            });
        },

        // Helper function to extract field name from various input name formats
        extractFieldName: function (fullName) {
            if (!fullName) return null;

            var matches = fullName.match(/(?:\[([^\]]+)\]|[^\[\]]+)$/);
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
                $this.data('searchableDepDrop', (data = new SearchableDepDrop(this, $.extend({}, $.fn.searchableDepDrop.defaults, options, $(this).data()))));
            }

            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.searchableDepDrop.defaults = {};

})(jQuery);