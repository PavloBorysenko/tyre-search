jQuery(document).ready(function ($) {
    let all_tyres = [];
    checkSelectState();

    // Initialize Select2 for tyre name search
    $('#tyre-search-by-name-select').select2({
        placeholder: 'Select Tyre Name',
        allowClear: true,
        width: '100%',
    });

    $('.tab-button').on('click', function () {
        const tabId = $(this).data('tab');

        $('.tab-button').removeClass('active');
        $('.tab-panel').removeClass('active');

        $(this).addClass('active');
        $('#tab-' + tabId).addClass('active');

        $('#tyre-search-results').hide();
    });

    $('#tyre-spec-search-form').on('submit', function (e) {
        e.preventDefault();
        displaySearchResults(all_tyres);
        scrollToResults();
    });

    $('#reset-search').on('click', function () {
        resetSearchForm();
        CheckStateResetFilterButtons();
    });

    // why do you need second search request?
    $('#search-tyres').on('click', function () {
        //performTyreSearch();
    });

    $('#search-by-ean').on('click', function () {
        const eanValue = $('#ean-search-input').val().trim();
        if (eanValue) {
            performEanSearch(eanValue);
        }
    });

    $('#search-tyres-by-name').on('click', function () {
        const selectedTyreId = $('#tyre-search-by-name-select').val();
        if (selectedTyreId) {
            performTyreNameSearch(selectedTyreId);
        }
    });

    // Init search on change
    $(
        '#tyre-spec-search-form .spec-dropdown select, #tyre-spec-search-form input'
    ).on('change', function () {
        CheckStateResetFilterButtons();
        checkSelectState(this);
        performTyreSearch();
    });

    function performTyreSearch() {
        var formData = {
            action: 'tyre_specification_search',
            vehicle_type: $('input[name="vehicle_type"]:checked').val(),
            tyre_season: $('input[name="tyre_season[]"]:checked')
                .map(function () {
                    return this.value;
                })
                .get(),
            tyre_width: $('#tyre_width').val(),
            aspect_ratio: $('#aspect_ratio').val(),
            rim_diameter: $('#rim_diameter').val(),
            load_index: $('#load_speed_index').val(),
        };

        $('#tyre-search-results').hide();
        $('#search-tyres').hide();
        $('#tyre-spec-search-form').addClass('tyre-search-form-loading');
        //return;
        $.ajax({
            url: tyre_spec_ajax.ajax_url,
            type: 'POST',
            data: formData,
            success: function (response) {
                CheckStateResetFilterButtons();
                if (response.success) {
                    all_tyres = response.data;
                    recountFiltersItems(all_tyres);
                } else {
                    alert(
                        'Error: ' + (response.data || 'Unknown error occurred')
                    );
                }
                $('#tyre-spec-search-form').removeClass(
                    'tyre-search-form-loading'
                );
            },
            error: function (error) {
                alert('An error occurred while searching for tyres.');
                $('#tyre-spec-search-form').removeClass(
                    'tyre-search-form-loading'
                );
            },
        });
    }

    function performEanSearch(ean) {
        const formData = {
            action: 'tyre_ean_search',
            ean: ean,
        };

        $('#tyre-search-results').hide();

        $.ajax({
            url: tyre_spec_ajax.ajax_url,
            type: 'POST',
            data: formData,
            success: function (response) {
                if (response.success) {
                    all_tyres = response.data;
                    displaySearchResults(all_tyres);
                } else {
                    alert(
                        'Error: ' + (response.data || 'Unknown error occurred')
                    );
                }
                $('#search-by-ean').prop('disabled', false).text('Search');
            },
            error: function (error) {
                alert('An error occurred while searching for tyres.');
                $('#search-by-ean').prop('disabled', false).text('Search');
            },
        });
    }

    function performTyreNameSearch(tyreId) {
        const formData = {
            action: 'tyre_name_search',
            name: tyreId,
        };

        $('#tyre-search-results').hide();

        $.ajax({
            url: tyre_spec_ajax.ajax_url,
            type: 'POST',
            data: formData,
            success: function (response) {
                if (response.success) {
                    all_tyres = response.data;
                    displaySearchResults(all_tyres);
                } else {
                    alert(
                        'Error: ' + (response.data || 'Unknown error occurred')
                    );
                }
                $('#search-tyres-by-name')
                    .prop('disabled', false)
                    .text('Search');
            },
            error: function (error) {
                alert('An error occurred while searching for tyres.');
                $('#search-tyres-by-name')
                    .prop('disabled', false)
                    .text('Search');
            },
        });
    }

    function displaySearchResults(data) {
        var tbody = $('#tyre-results-tbody');
        tbody.empty();
        $('#tyre-search-loading').show();
        if (data.tyres && data.tyres.length > 0) {
            data.tyres.forEach(function (tyre) {
                var row =
                    '<tr>' +
                    '<td>' +
                    (tyre.tyre_name || '') +
                    '</td>' +
                    '<td>' +
                    (tyre.inch || '') +
                    '</td>' +
                    '<td>' +
                    (tyre.size || '') +
                    '</td>' +
                    '<td>' +
                    (tyre.note || '') +
                    '</td>' +
                    '<td>' +
                    (tyre.art || '') +
                    '</td>' +
                    '<td class="fuel-icon">' +
                    (tyre.fuel_efficiency || '') +
                    '</td>' +
                    '<td class="wet-icon">' +
                    (tyre.wet_grip || '') +
                    '</td>' +
                    '<td class="noise-icon">' +
                    (tyre.noise || '') +
                    '</td>' +
                    '<td class="snow-icon">' +
                    (tyre.snow_grip || '') +
                    '</td>' +
                    '<td class="ice_grip-icon">' +
                    (tyre.ice_grip || '') +
                    '</td>' +
                    '<td>' +
                    (tyre.eu_label || '') +
                    '</td>' +
                    '</tr>';
                tbody.append(row);
            });
        } else {
            tbody.append(
                '<tr><td colspan="11" style="text-align: center; padding: 20px;">No tyres found matching your criteria.</td></tr>'
            );
        }
        $('#tyre-search-loading').hide();
        $('#tyre-search-results').show();
    }

    function resetSearchForm() {
        $('#tyre-spec-search-form')[0].reset();
        $('#tyre-search-results').hide();
        checkSelectState();
        all_tyres = [];

        // Show all filters after reset
        $('.vehicle-type-option').show();
        $('.season-option').show();
        $('#tyre_width option').show();
        $('#aspect_ratio option').show();
        $('#rim_diameter option').show();
        $('#load_speed_index option').show();
    }

    function isFormHasSelected() {
        return (
            $('#tyre-spec-search-form')
                .find(
                    'input[type=checkbox]:checked, input[type=radio]:checked, select'
                )
                .filter(function () {
                    return $(this).is('select') ? $(this).val() !== '' : true;
                }).length > 0
        );
    }
    function checkSelectState(select_element = null) {
        let selects = [
            $('#tyre_width'),
            $('#aspect_ratio'),
            $('#rim_diameter'),
            $('#load_speed_index'),
        ];
        if (select_element != null && $(select_element).val() != '') {
            let reset = false;
            selects.forEach(function (select) {
                if (reset) {
                    $(select).val('');
                }
                if ($(select).attr('id') == $(select_element).attr('id')) {
                    reset = true;
                }
            });
        }
        let disabled = false;
        selects.forEach(function (select) {
            if (disabled) {
                select.prop('disabled', true);
                select.val('');
            } else {
                select.prop('disabled', false);
            }
            if (select.val() === '') {
                disabled = true;
            }
        });
    }
    function scrollToResults() {
        let $el = $('#tyre-search-results');
        if ($el.length === 0) return;

        let offset = -100;
        let top = $el.offset().top + offset;

        $('html, body').animate({ scrollTop: top }, 300);
    }
    function CheckStateResetFilterButtons() {
        if (isFormHasSelected()) {
            $('#reset-search').show();
            $('#search-tyres').show();
        } else {
            $('#reset-search').hide();
            $('#search-tyres').hide();
        }
    }
    function recountFiltersItems(data) {
        console.log(data);
        if ($('.vehicle-type-option input:checked').length === 0) {
            let checkboxes = $('.vehicle-type-option input');
            hideCheckBoxFilters(data, checkboxes, 'tyre_type');
        }
        if ($('.season-option input:checked').length === 0) {
            let checkboxes = $('.season-option input');
            hideCheckBoxFilters(data, checkboxes, 'tyre_season');
        }
        if ($('#tyre_width').val() === '') {
            let options = $('#tyre_width option');
            hideSelectFilters(data, options, 'width');
        }
        if ($('#aspect_ratio').val() === '') {
            let options = $('#aspect_ratio option');
            hideSelectFilters(data, options, 'ratio');
        }
        if ($('#rim_diameter').val() === '') {
            let options = $('#rim_diameter option');
            hideSelectFilters(data, options, 'diameter');
        }
        if ($('#load_speed_index').val() === '') {
            let options = $('#load_speed_index option');
            hideSelectFilters(data, options, 'load_speed_index');
        }
    }

    function hideCheckBoxFilters(data, checkboxes, key) {
        checkboxes.each(function () {
            const $input = $(this);
            const value = $input.val();
            const found = data.tyres.some(function (tyre) {
                return tyre[key] === value;
            });
            if (found) {
                $input.parent('label').show();
            } else {
                $input.parent('label').hide();
            }
        });
    }
    function hideSelectFilters(data, options, key) {
        options.each(function () {
            const $option = $(this);
            const value = $option.val();
            const found = data.tyres.some(function (tyre) {
                return tyre[key] === value || value === '';
            });

            if (found) {
                $option.show();
            } else {
                $option.hide();
            }
        });
    }
});
