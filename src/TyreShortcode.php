<?php

namespace TyreSearch;

use TyreSearch\Cache\TransientCache as TyreCache;
use TyreSearch\TranslateHelper;

class TyreShortcode {

    public $tyreCache = null;
    public $translateHelper = null;
    public function __construct(TranslateHelper $translateHelper) {
        $this->tyreCache = new TyreCache();
        $this->translateHelper = $translateHelper;
        $this->init();
    }

    public function init() {
        add_shortcode('tyre_specification_search', array($this, 'getHtmlShortcode'));
    }

    public function getHtmlShortcode($atts) {
        $atts = shortcode_atts([
            'target' => 'desktop',
        ], $atts);

        
        $vehicle_types = $this->getVehicleTypesTerms();
        $tyre_seasons = $this->getTyreSeasonsTerms();

        $filters_data = $this->getFiltersData();
        $widths            = $filters_data['widths'];
        $ratios            = $filters_data['ratios'];
        $diameters         = $filters_data['diameters'];
        $load_speed_indices = $filters_data['load_speed_indices'];
        $tyre_names  = $filters_data['tyre_names'];
        $translated_strings = [
            'Select Tyre Width' => $this->translateHelper->getTranslatepressTranslation('Select Tyre Width'),
            'Select Aspect Ratio' => $this->translateHelper->getTranslatepressTranslation('Select Aspect Ratio'),
            'Select Rim Diameter' => $this->translateHelper->getTranslatepressTranslation('Select Rim Diameter'),
            'Select Load Speed Index' => $this->translateHelper->getTranslatepressTranslation('Select Load Speed Index'),
            'No search results.' => $this->translateHelper->getTranslatepressTranslation('No search results.'),
            'Select Tyre Name' => $this->translateHelper->getTranslatepressTranslation('Select Tyre Name'),
        ];
        ob_start();
        include TYRE_SEARCH_PATH . 'views/shortcode/tyre-specification-search.php';
        return ob_get_clean();
    }

    private function getVehicleTypesTerms() {
        $vehicle_types = get_terms([
            'taxonomy' => 'tyre_type',
            'hide_empty' => true,
        ]);
        return $vehicle_types;
    }

    private function getTyreSeasonsTerms() {
        $tyre_seasons = get_terms([
            'taxonomy' => 'tyre_season',
            'hide_empty' => true,
        ]);
        return $tyre_seasons;
    }

    private function getFiltersData() {
        $cached_data = $this->tyreCache->get('tyre_filters_data');
        if ($cached_data !== false) {
            return $cached_data;
        }
        $widths = [];
        $ratios = [];
        $diameters = [];
        $load_speed_indices = [];
        $tyre_names = [];
        
        $args = array(
            'post_type' => 'tyres',
            'posts_per_page' => -1,
            'post_status' => 'publish',
            'fields' => 'ids',
            'no_found_rows' => true,
            'order' => 'ASC',
            'orderby' => 'title',
            'update_post_meta_cache' => false,
            'update_post_term_cache' => false
        );

        $tyres = get_posts($args);

        foreach ($tyres as $tyre_id) {
            $tyre_names[$tyre_id] = get_the_title($tyre_id);
            $variants = get_field('tyre_variants', $tyre_id);
            if (!is_array($variants)) {
                continue;
            }
            foreach ($variants as $variant) {
                if (!isset($widths[$variant['width']])){
                    $widths[$variant['width']] = true;
                }
                if (!isset($ratios[$variant['ratio']])){
                    $ratios[$variant['ratio']] = true;
                }
                if (!isset($diameters[$variant['diameter']])){
                    $diameters[$variant['diameter']] = true;
                }
                if (!isset($load_speed_indices[$variant['load_index']])){
                    $load_speed_indices[$variant['load_index']] = true;
                }
            }

        }

        $widths = array_keys($widths);
        sort($widths, SORT_NUMERIC);
        $ratios = array_keys($ratios);
        sort($ratios, SORT_NUMERIC);
        $diameters = array_keys($diameters);
        sort($diameters, SORT_NUMERIC);
        $load_speed_indices = array_keys($load_speed_indices);
        sort($load_speed_indices, SORT_NUMERIC);
        $data = [
            'widths' => $widths,
            'ratios' => $ratios,
            'diameters' => $diameters,
            'load_speed_indices' => $load_speed_indices,
            'tyre_names' => $tyre_names,
        ];
        $this->tyreCache->set('tyre_filters_data', $data, 6 * HOUR_IN_SECONDS);
        
        return $data;
    }

}