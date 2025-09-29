jQuery(document).ready(function ($) {
    let all_tyres = [];
    checkSelectState();

    initTyreSizeModal();

    new TomSelect('#tyre-search-by-name-select', {
        create: true,
        sortField: {
            field: 'text',
            direction: 'asc',
        },
        render: {
            no_results: function (data, escape) {
                const select = document.querySelector(
                    '#tyre-search-by-name-select'
                );
                const noResults = select.dataset.noResults;
                return '<div class="no-results">' + noResults + '</div>';
            },
        },
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

    // EAN input clear functionality
    $('#ean-search-input').on('input', function () {
        const clearIcon = $('.clear-icon');
        if ($(this).val().length > 0) {
            clearIcon.show();
        } else {
            clearIcon.hide();
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
                    // Open PDF in new tab if function exists
                    if (
                        typeof pdf_tire_generator_open_in_new_tab === 'function'
                    ) {
                        const noResults = document.querySelector(
                            '.ean-search-ean-no-results'
                        );
                        noResults.style.display = 'none';
                        if (
                            all_tyres.tyres &&
                            all_tyres.tyres.length > 0 &&
                            all_tyres.tyres[0].hasOwnProperty('pdf_url')
                        ) {
                            pdf_tire_generator_open_in_new_tab(
                                all_tyres.tyres[0]['pdf_url']
                            );
                        }
                        if (all_tyres.no_results) {
                            noResults.style.display = 'block';
                        }
                        return;
                    }
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
            const pagination = new TyrePagination(data.tyres, tbody, 10);
            pagination.init();
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

    // Pagination Class
    class TyrePagination {
        constructor(tyres, tbody, itemsPerPage = 10) {
            this.tyres = tyres;
            this.tbody = tbody;
            this.itemsPerPage = itemsPerPage;
            this.currentPage = 1;
            this.totalPages = Math.ceil(tyres.length / itemsPerPage);
        }

        init() {
            this.renderPage(1);
            this.bindEvents();
        }

        renderPage(page) {
            this.currentPage = page;
            this.clearResults();
            this.renderTyres();
            this.renderPagination();
        }

        clearResults() {
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
        }

        createTyreRow(tyre) {
            return `
                <tr class="tyre-result-row">
                    <td>${tyre.tyre_name || ''}</td>
                    <td>${tyre.inch || ''}</td>
                    <td>${tyre.size || ''}</td>
                    <td>${tyre.note || ''}</td>
                    <td>${tyre.art || ''}</td>
                    <td class="fuel-icon">${tyre.fuel_efficiency || ''}</td>
                    <td class="wet-icon">${tyre.wet_grip || ''}</td>
                    <td class="noise-icon">${tyre.noise || ''}</td>
                    <td class="snow-icon">${tyre.snow_grip || ''}</td>
                    <td class="ice_grip-icon">${tyre.ice_grip || ''}</td>
                    <td>${tyre.eu_label || ''}</td>
                </tr>
            `;
        }

        renderPagination() {
            if (this.totalPages <= 1) return;

            const template = document.getElementById('pagination-template');
            const clone = template.content.cloneNode(true);

            // Update info
            this.updatePaginationInfo(clone);

            // Update prev/next buttons
            this.updateNavigationButtons(clone);

            // Update page numbers
            this.updatePageNumbers(clone);

            this.tbody.append(clone);
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
            this.tbody.on('click', '.pagination-btn', (e) => {
                e.preventDefault();
                const button = $(e.target).closest('.pagination-btn');

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
    }

    // TYRE SIZE MODAL
    function initTyreSizeModal() {
        const modal = $('#tyre-size-modal');
        const closeBtn = $('.modal-close');
        const overlay = $('.modal-overlay');

        $('.info-icon').on('click', function (e) {
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
