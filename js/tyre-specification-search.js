jQuery(document).ready(function ($) {
    /* 
        All variables 
    */

    let all_tyres = [];
    let all_tyres_ean = [];
    let all_tyres_name = [];

    // Initialize TomSelect for all selects
    const selectIds = [
        'tyre-search-by-name-select',
        'tyre_width',
        'aspect_ratio',
        'rim_diameter',
        'load_speed_index',
    ];

    const tomSelectInstances = {};
    let currentPagination = null;

    /* 
        Init all actions after page load 
    */

    // Initialize TomSelect for all selects
    selectIds.forEach((selectId) => {
        const selectElement = document.getElementById(selectId);
        if (selectElement) {
            const tomSelectInstance = new TomSelect(selectElement, {
                create: false,
                maxOptions: null,
                render: {
                    no_results: function (data, escape) {
                        const select = document.getElementById(selectId);
                        const noResults = select.dataset.noResults;
                        return (
                            '<div class="no-results">' + noResults + '</div>'
                        );
                    },
                    option: function (data, escape) {
                        const hiddenClass = data.hidden
                            ? ' style="display:none;"'
                            : '';
                        return `<div${hiddenClass}>${escape(data.text)}</div>`;
                    },
                },
                score: function (search) {
                    const original_score = this.getScoreFunction(search);
                    return function (item) {
                        if (item.hidden) return 0;
                        return original_score(item);
                    };
                },
            });

            tomSelectInstances[selectId] = tomSelectInstance;

            // Add change event listener to show/hide label
            tomSelectInstance.on('change', function (value) {
                let label;
                if (selectId === 'tyre-search-by-name-select') {
                    label = document.querySelector(
                        '#tyre-search-by-name-container label'
                    );
                } else {
                    label = document
                        .querySelector(`#${selectId}`)
                        .closest('.spec-dropdown-container')
                        .querySelector('label');
                }

                if (label) {
                    if (value && value !== '') {
                        label.style.display = 'block';
                    } else {
                        label.style.display = 'none';
                    }
                }
            });

            // Reset scroll to top on both open and close events
            tomSelectInstance.on('dropdown_open', function () {
                const dropdown = this.dropdown_content;
                if (dropdown) {
                    dropdown.scrollTop = 0;
                    setTimeout(() => {
                        dropdown.scrollTop = 0;
                    }, 10);
                }
            });

            tomSelectInstance.on('dropdown_close', function () {
                const dropdown = this.dropdown_content;
                if (dropdown) {
                    dropdown.scrollTop = 0;
                }
            });
        }
    });

    // Handle tab button click
    $('.tab-button').on('click', function () {
        const tabId = $(this).data('tab');

        $('.tab-button').removeClass('active');
        $('.tab-panel').removeClass('active');

        $(this).addClass('active');
        $('#tab-' + tabId).addClass('active');

        $('#tyre-search-results').hide();
    });

    // Handle search form submit
    $('#tyre-spec-search-form').on('submit', function (e) {
        e.preventDefault();
        displaySearchResults(all_tyres);
        scrollToResults();
    });

    // Handle search by EAN button click
    $('#search-by-ean').on('click', function () {
        const eanValue = $('#ean-search-input').val().trim();
        if (eanValue) {
            performEanSearch(eanValue);
        }
    });
    // Handle Enter key press in EAN search input
    /* $('#ean-search-input').on('keypress', function (e) {
        if (e.which === 13) {
            // Enter key
            e.preventDefault();
            const eanValue = $(this).val().trim();
            if (eanValue) {
                performEanSearch(eanValue);
            }
        }
    });*/
    // EAN input clear functionality
    $('#ean-search-input').on('input', function () {
        const clearIcon = $('.clear-icon');
        if ($(this).val().length > 0) {
            clearIcon.show();
        } else {
            clearIcon.hide();
        }
    });

    // Handle search by name button click
    $('#search-tyres-by-name').on('click', function () {
        const selectedTyreId = $('#tyre-search-by-name-select').val();
        if (selectedTyreId) {
            performTyreNameSearch(selectedTyreId);
        }
    });

    // Clear button click handler
    $('.clear-icon').on('click', function () {
        $('#ean-search-input').val('').trigger('input').focus();
        $(this).hide();
        // Hide any previous search results
        $('#tyre-search-results').hide();
        $('.ean-search-ean-no-results').hide();
    });

    // Init search on change for regular inputs
    $('#tyre-spec-search-form input').on('change', function () {
        // Reset search form if vehicle type is changed
        if ($(this).attr('name') === 'vehicle_type') {
            resetSearchForm();
            $(this).prop('checked', true);
        }

        CheckStateResetFilterButtons();
        performTyreSearch();
    });

    // Handle TomSelect changes
    selectIds.forEach((selectId) => {
        if (tomSelectInstances[selectId]) {
            tomSelectInstances[selectId].on('change', function (value) {
                CheckStateResetFilterButtons();
                checkSelectState(document.getElementById(selectId));
                performTyreSearch();
            });
        }
    });

    // Handle reset search button click
    $('#reset-search').on('click', function () {
        resetSearchForm();
        doInitialSearch();
    });

    /* 
        Init all function after page load 
    */

    initTyreSizeModal();

    // Initialize checkSelectState after TomSelect instances are created
    checkSelectState();

    //checkTyreNameSelectState();

    // Auto-select 'car' vehicle type on page load
    doInitialSearch();

    /*
        All functions
    */

    function doInitialSearch() {
        const carRadio = $('input[name="vehicle_type"][value="car"]');
        if (
            carRadio.length > 0 &&
            !$('input[name="vehicle_type"]:checked').length
        ) {
            carRadio.prop('checked', true);
            CheckStateResetFilterButtons();
            performTyreSearch();
        }
    }

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
                    console.log(
                        'Error: ' + (response.data || 'Unknown error occurred')
                    );
                }
                $('#tyre-spec-search-form').removeClass(
                    'tyre-search-form-loading'
                );
                $('#search-tyres').show();
            },
            error: function (error) {
                console.log('An error occurred while searching for tyres.');
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
                    all_tyres_ean = response.data;
                    // Open PDF in new tab if function exists
                    if (
                        typeof pdf_tire_generator_open_in_new_tab === 'function'
                    ) {
                        const noResults = document.querySelector(
                            '.ean-search-ean-no-results'
                        );
                        noResults.style.display = 'none';
                        if (
                            all_tyres_ean.tyres &&
                            all_tyres_ean.tyres.length > 0 &&
                            all_tyres_ean.tyres[0].hasOwnProperty('pdf_url')
                        ) {
                            pdf_tire_generator_open_in_new_tab(
                                all_tyres_ean.tyres[0]['pdf_url']
                            );
                        }
                        if (all_tyres_ean.no_results) {
                            noResults.style.display = 'block';
                            noResults.textContent = all_tyres_ean.no_results;
                        }
                        return;
                    }
                    displaySearchResults(all_tyres_ean);
                } else {
                    console.log(
                        'Error: ' + (response.data || 'Unknown error occurred')
                    );
                }
                $('#search-by-ean').prop('disabled', false).text('Search');
            },
            error: function (error) {
                console.log('An error occurred while searching for tyres.');
                $('#search-by-ean').prop('disabled', false).text('Search');
            },
        });
    }

    function performTyreNameSearch(tyreId) {
        const formData = {
            action: 'tyre_id_search',
            id: tyreId,
        };

        $('#tyre-search-results').hide();

        $.ajax({
            url: tyre_spec_ajax.ajax_url,
            type: 'GET',
            data: formData,
            success: function (response) {
                if (response.success) {
                    all_tyres_name = response.data;
                    displaySearchResults(all_tyres_name);
                } else {
                    console.log(
                        'Error: ' + (response.data || 'Unknown error occurred')
                    );
                }
                $('#search-tyres-by-name')
                    .prop('disabled', false)
                    .text('Search');
            },
            error: function (error) {
                console.log('An error occurred while searching for tyres.');
                $('#search-tyres-by-name')
                    .prop('disabled', false)
                    .text('Search');
            },
        });
    }

    function displaySearchResults(data) {
        var tbody = $('#tyre-results-tbody');

        if (currentPagination) {
            currentPagination.clearResults();
            currentPagination = null;
        }

        tbody.empty();
        $('#tyre-search-loading').show();

        if (data.tyres && data.tyres.length > 0) {
            currentPagination = new TyrePagination(data.tyres, tbody, 10);
            currentPagination.init();
        } else {
            let noResults = 'No tyres found matching your criteria.';
            if (data.no_results) {
                noResults = data.no_results;
            }
            tbody.append(
                '<tr><td colspan="12" style="text-align: center; padding: 20px;">' +
                    noResults +
                    '</td></tr>'
            );
        }

        $('#tyre-search-loading').hide();
        $('#tyre-search-results').show();
    }

    function resetSearchForm() {
        $('#tyre-spec-search-form')[0].reset();
        $('#tyre-search-results').hide();

        all_tyres = [];

        // Show all filters after reset
        $('.vehicle-type-option').show();
        $('.season-option').show();
        //$('#tyre_width option').show();
        //$('#aspect_ratio option').show();
        //$('#rim_diameter option').show();
        //$('#load_speed_index option').show();

        // Reset all selects and hide their labels
        resetAllSelects();
        checkSelectState();
    }

    function resetAllSelects() {
        selectIds.forEach((selectId) => {
            const selectElement = document.getElementById(selectId);
            if (selectElement && tomSelectInstances[selectId]) {
                const tomSelectInstance = tomSelectInstances[selectId];

                for (let optionValue in tomSelectInstance.options) {
                    if (
                        tomSelectInstance.options[optionValue] &&
                        optionValue !== ''
                    ) {
                        const option = tomSelectInstance.options[optionValue];

                        option.hidden = false;

                        if (option.$div) {
                            option.$div.style.display = '';
                        }
                    }
                }

                tomSelectInstance.refreshOptions(false);
                tomSelectInstance.clear(true);
            }
        });
    }

    function isFormHasSelected() {
        return (
            $('#tyre-spec-search-form')
                .find(
                    'input[type=checkbox]:checked, input[type=radio]:checked, select'
                )
                .filter(function () {
                    if (
                        $(this).is('input[type=radio]') &&
                        $(this).attr('name') === 'vehicle_type' &&
                        $(this).val() === 'car'
                    ) {
                        return false;
                    }
                    return $(this).is('select') ? $(this).val() !== '' : true;
                }).length > 0
        );
    }

    function checkSelectState(select_element = null) {
        let selectIds = [
            'tyre_width',
            'aspect_ratio',
            'rim_diameter',
            'load_speed_index',
        ];

        if (select_element != null && $(select_element).val() != '') {
            let reset = false;
            selectIds.forEach(function (selectId) {
                if (reset && tomSelectInstances[selectId]) {
                    tomSelectInstances[selectId].clear();
                }
                if (selectId == $(select_element).attr('id')) {
                    reset = true;
                }
            });
        }

        let disabled = false;
        selectIds.forEach(function (selectId) {
            const tomSelectInstance = tomSelectInstances[selectId];
            if (tomSelectInstance) {
                if (disabled) {
                    tomSelectInstance.disable();
                    tomSelectInstance.clear();
                } else {
                    tomSelectInstance.enable();
                }

                const value = tomSelectInstance.getValue();
                if (value === '') {
                    disabled = true;
                }
                // Show/hide label
                const label = document
                    .querySelector(`#${selectId}`)
                    .closest('.spec-dropdown-container')
                    .querySelector('label');
                if (label) {
                    if (value && value !== '') {
                        label.style.display = 'block';
                    } else {
                        label.style.display = 'none';
                    }
                }
            }
        });
    }

    //TODO delete this function after test
    function checkTyreNameSelectState() {
        const tyreNameSelect = $('#tyre-search-by-name-select');
        const label = tyreNameSelect
            .parent('.tyre-name-search-form_contaner')
            .find('label');

        if (tyreNameSelect.val() !== '' && tyreNameSelect.val() !== null) {
            label.addClass('show');
        } else {
            label.removeClass('show');
        }
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
            $('#reset-search').prop('disabled', false);
            //$('#search-tyres').show();
        } else {
            $('#reset-search').prop('disabled', true);
            //$('#search-tyres').hide();
        }
    }

    function recountFiltersItems(data) {
        if ($('.vehicle-type-option input:checked').length === 0) {
            let checkboxes = $('.vehicle-type-option input');
            hideCheckBoxFilters(data, checkboxes, 'tyre_type');
        }
        if ($('.season-option input:checked').length === 0) {
            let checkboxes = $('.season-option input');
            hideCheckBoxFilters(data, checkboxes, 'tyre_season');
        }

        let selectIds = {
            width: 'tyre_width',
            ratio: 'aspect_ratio',
            diameter: 'rim_diameter',
            load_speed_index: 'load_speed_index',
        };

        Object.entries(selectIds).forEach(function ([key, selectId]) {
            if (
                tomSelectInstances[selectId] &&
                !tomSelectInstances[selectId].isDisabled &&
                !tomSelectInstances[selectId].getValue()
            ) {
                for (let optionValue in tomSelectInstances[selectId].options) {
                    if (optionValue === '') continue;

                    const found = data.tyres.some(function (tyre) {
                        return tyre[key] === optionValue;
                    });

                    const option =
                        tomSelectInstances[selectId].options[optionValue];
                    option.hidden = !found;

                    if (option.$div) {
                        if (!found) {
                            option.$div.style.display = 'none';
                        } else {
                            option.$div.style.display = '';
                        }
                    }
                }

                tomSelectInstances[selectId].refreshOptions(false);
            }
        });
        return;
        // in case if we need to filter by select
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

    // Pagination Class
    class TyrePagination {
        constructor(tyres, tbody, itemsPerPage = 10) {
            this.tyres = tyres;
            this.tbody = tbody;
            this.itemsPerPage = itemsPerPage;
            this.currentPage = 1;
            this.totalPages = Math.ceil(tyres.length / itemsPerPage);
            this.perPageTomSelect = null;
        }

        init() {
            this.renderPage(1);
            this.bindEvents();
        }

        changeItemsPerPage(newItemsPerPage) {
            this.itemsPerPage = newItemsPerPage;
            this.totalPages = Math.ceil(this.tyres.length / this.itemsPerPage);
            this.currentPage = 1;
            this.renderPage(1);
        }

        renderPage(page) {
            this.currentPage = page;
            this.clearResults();
            this.renderTyres();
            this.renderPagination();
        }

        clearResults() {
            if (this.perPageTomSelect) {
                this.perPageTomSelect.destroy();
                this.perPageTomSelect = null;
            }

            this.tbody.find('.tyre-result-row, .pagination-row').remove();
        }

        renderTyres() {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = Math.min(
                startIndex + this.itemsPerPage,
                this.tyres.length
            );
            const currentItems = this.tyres.slice(startIndex, endIndex);

            currentItems.forEach((tyre) => {
                const row = this.createTyreRow(tyre);
                this.tbody.append(row);
            });

            document.dispatchEvent(
                new CustomEvent('tyre-search-results-rendered')
            );
        }

        createTyreRow(tyre) {
            return `
            <tr class="tyre-result-row">
                <td>${tyre.tyre_name || ''}</td>
                <td>${tyre.inch || ''}</td>
                <td>${tyre.size || ''}</td>
                <td>${tyre.note || ''}</td>
                <td>${tyre.art || ''}</td>
                <td>${tyre.ean || ''}</td>
                <td class="fuel-icon">${tyre.fuel_efficiency || ''}</td>
                <td class="wet-icon">${tyre.wet_grip || ''}</td>
                <td class="noise-icon">${
                    tyre.noise_db
                        ? tyre.noise_db + 'DB/' + (tyre.noise || '')
                        : ''
                }</td>
                <td class="snow-icon">${tyre.snow_grip || ''}</td>
                <td class="ice_grip-icon">${tyre.ice_grip || ''}</td>
                <td>${tyre.eu_label || ''}</td>
            </tr>
        `;
        }

        renderPagination() {
            if (this.totalPages <= 0) return;

            const template = document.getElementById('pagination-template');
            const clone = template.content.cloneNode(true);

            const selectElement = clone.querySelector('.items-per-page-select');
            selectElement.value = this.itemsPerPage;

            // Update info
            this.updatePaginationInfo(clone);

            // Update prev/next buttons
            this.updateNavigationButtons(clone);

            // Update page numbers
            this.updatePageNumbers(clone);

            this.tbody.append(clone);

            this.initPerPageTomSelect();
        }

        updatePaginationInfo(clone) {
            const showingFrom = (this.currentPage - 1) * this.itemsPerPage + 1;
            const showingTo = Math.min(
                this.currentPage * this.itemsPerPage,
                this.tyres.length
            );

            clone.querySelector('.from').textContent = showingFrom;
            clone.querySelector('.to').textContent = showingTo;
            clone.querySelector('.total').textContent = this.tyres.length;
        }

        updateNavigationButtons(clone) {
            const prevBtn = clone.querySelector('.pagination-prev');
            const nextBtn = clone.querySelector('.pagination-next');

            prevBtn.disabled = this.currentPage <= 1;
            prevBtn.dataset.page = this.currentPage - 1;

            nextBtn.disabled = this.currentPage >= this.totalPages;
            nextBtn.dataset.page = this.currentPage + 1;
        }

        updatePageNumbers(clone) {
            const numbersContainer = clone.querySelector('.pagination-numbers');
            const pageNumbers = this.getPageNumbers();

            pageNumbers.forEach((pageInfo) => {
                if (pageInfo.isEllipsis) {
                    const ellipsisTemplate = document.getElementById(
                        'pagination-ellipsis-template'
                    );
                    const ellipsisClone =
                        ellipsisTemplate.content.cloneNode(true);
                    numbersContainer.appendChild(ellipsisClone);
                } else {
                    const pageTemplate = document.getElementById(
                        'page-number-template'
                    );
                    const pageClone = pageTemplate.content.cloneNode(true);

                    const button = pageClone.querySelector('.pagination-page');
                    const numberSpan = pageClone.querySelector('.page-number');

                    button.dataset.page = pageInfo.page;
                    numberSpan.textContent = pageInfo.page;

                    if (pageInfo.page === this.currentPage) {
                        button.classList.add('active');
                    }

                    numbersContainer.appendChild(pageClone);
                }
            });
        }

        getPageNumbers() {
            const maxVisible = 3;
            const pages = [];

            if (this.totalPages <= maxVisible) {
                for (let i = 1; i <= this.totalPages; i++) {
                    pages.push({ page: i, isEllipsis: false });
                }
            } else {
                if (this.currentPage <= 2) {
                    pages.push({ page: 1, isEllipsis: false });
                    pages.push({ page: 2, isEllipsis: false });
                    pages.push({ page: 3, isEllipsis: false });
                    if (this.totalPages > 4) {
                        pages.push({ isEllipsis: true });
                    }
                    if (this.totalPages > 3) {
                        pages.push({
                            page: this.totalPages,
                            isEllipsis: false,
                        });
                    }
                } else if (this.currentPage >= this.totalPages - 1) {
                    pages.push({ page: 1, isEllipsis: false });
                    if (this.totalPages > 4) {
                        pages.push({ isEllipsis: true });
                    }
                    pages.push({
                        page: this.totalPages - 2,
                        isEllipsis: false,
                    });
                    pages.push({
                        page: this.totalPages - 1,
                        isEllipsis: false,
                    });
                    pages.push({ page: this.totalPages, isEllipsis: false });
                } else {
                    pages.push({ page: 1, isEllipsis: false });
                    pages.push({ isEllipsis: true });
                    pages.push({
                        page: this.currentPage - 1,
                        isEllipsis: false,
                    });
                    pages.push({ page: this.currentPage, isEllipsis: false });
                    pages.push({
                        page: this.currentPage + 1,
                        isEllipsis: false,
                    });
                    pages.push({ isEllipsis: true });
                    pages.push({ page: this.totalPages, isEllipsis: false });
                }
            }

            return pages;
        }

        bindEvents() {
            this.tbody.off('click', '.pagination-btn');

            this.tbody.on('click', '.pagination-btn', (e) => {
                e.preventDefault();
                const button = $(e.currentTarget);

                if (button.prop('disabled') || button.hasClass('active'))
                    return;

                const page = parseInt(button.data('page'));
                const action = button.data('action');

                let newPage = page;
                if (action === 'prev') newPage = this.currentPage - 1;
                if (action === 'next') newPage = this.currentPage + 1;

                if (newPage && newPage >= 1 && newPage <= this.totalPages) {
                    this.renderPage(newPage);
                    scrollToResults();
                }
            });
        }

        initPerPageTomSelect() {
            const selectElement = this.tbody[0].querySelector(
                '.items-per-page-select'
            );

            if (selectElement && !this.perPageTomSelect) {
                this.perPageTomSelect = new TomSelect(selectElement, {
                    create: false,
                    controlInput: null,
                    searchField: [],
                    allowEmptyOption: false,
                    closeAfterSelect: true,
                    hideSelected: false,
                    maxOptions: 10,
                    dropdownParent: 'body',
                });

                const wrapper = this.perPageTomSelect.wrapper;
                wrapper.classList.add('dropdown-up');
                this.perPageTomSelect.dropdown.classList.add(
                    'tyres-search-per-page-dd'
                );

                this.perPageTomSelect.on('change', (value) => {
                    if (value) {
                        const newItemsPerPage = parseInt(value);
                        this.changeItemsPerPage(newItemsPerPage);
                        scrollToResults();
                    }
                });
            }
        }
    }

    // TYRE SIZE MODAL
    function initTyreSizeModal() {
        const modal = $('#tyre-size-modal');
        const closeBtn = $('.modal-close');
        const overlay = $('.modal-overlay');

        $('.tyre-info_icon').on('click', function (e) {
            e.preventDefault();
            openModal();
        });

        closeBtn.on('click', function (e) {
            e.preventDefault();
            closeModal();
        });

        overlay.on('click', function (e) {
            if (e.target === this) {
                closeModal();
            }
        });

        $(document).on('keydown', function (e) {
            if (e.key === 'Escape' && modal.hasClass('active')) {
                closeModal();
            }
        });

        function openModal() {
            modal.addClass('active');
            $('body').addClass('modal-open');

            $('body').css('overflow', 'hidden');
        }

        function closeModal() {
            modal.removeClass('active');
            $('body').removeClass('modal-open');

            $('body').css('overflow', '');
        }
    }
});
