<?php

namespace TyreSearch;

use TyreSearch\TranslateHelper;

class TyresDataHelper {
    private $translateHelper = null;
    private $seasonCache = [];
    private $typeCache = [];

    public function __construct( TranslateHelper $translateHelper ) {
        $this->translateHelper = $translateHelper;
    }
    public function getPreparedData($tyre_id, $index, $tyre_data) {

        $tyre_id = (int) $tyre_id;
        $index = (int) $index;
        if (empty($tyre_id) || $tyre_id < 1) {
            return [];
        }
        
        if ($index < 0) {
            $index = 0;
        }
        
        if (!is_array($tyre_data)) {
            $tyre_data = [];
        }
    
        $data = [
            //'id'                  => $tyre_id,
            //'tyre_variant_index'  => (int) $index,
            //'ean'                 => $tyre_data['eanjan'] ?? '',
            'tyre_name'          => get_the_title($tyre_id),
            'inch'               => $tyre_data['inch'] ?? '',
            'size'               => $tyre_data['size'] ?? '',
            //'note'               => $tyre_data['note'] ?? '',
            'art'                => $tyre_data['sales_art'] ?? '',
            'fuel_efficiency'    => $tyre_data['fuel_icon'] ?? '',
            'wet_grip'           => $tyre_data['wet_grip'] ?? '',
            'noise'              => $tyre_data['external_noise'] ?? '',
            'snow_grip'          => $tyre_data['snow_grip'] ?? '',
            'ice_grip'           => $tyre_data['ice_grip'] ?? '',
            'width'              => $tyre_data['width'] ?? '',
            'ratio'              => $tyre_data['ratio'] ?? '',
            'diameter'           => $tyre_data['diameter'] ?? '',
            'load_speed_index'   => $tyre_data['load_index'] ?? '',
            'tyre_season'        => $this->getSeasonTaxonomySlug($tyre_id),
            'tyre_type'          => $this->getTypeTaxonomySlug($tyre_id) ?? '',
        ];

        $data['eu_label'] = $this->getEuLabel($tyre_id, $index, $data);
        
        return $data;       
    }
    public function getEuLabel($tyre_id, $index, $tyre_data) {

        $has_eprel_url = !empty($tyre_data['eprel_url']);
        
        if (!$has_eprel_url || $this->isMotorsport($tyre_data)) {
            return 'TMB';
        }
        if (function_exists('pdf_tire_generator_get_link_html')) {
            return pdf_tire_generator_get_link_html(
                $tyre_id, 
                $index, 
                $this->translateHelper->getTranslatepressTranslation('LINK')
            );
        } else {
            return "Please install and activate PDF Tire Generator plugin";
        }

    }
    private function isMotorsport($tyre_data): bool {
        return $tyre_data['tyre_type'] && $tyre_data['tyre_type'] == 'motorsport';
    }
    private function getSeasonTaxonomySlug($id) {
        if (isset($this->seasonCache[$id])) {
            return $this->seasonCache[$id];
        }
        $season = get_the_terms($id, 'tyre_season');
        $this->seasonCache[$id] = $season[0]->slug ?? false;
        return $this->seasonCache[$id];
    }
    private function getTypeTaxonomySlug($id) {
        if (isset($this->typeCache[$id])) {
            return $this->typeCache[$id];
        }
        $type = get_the_terms($id, 'tyre_type');
        $this->typeCache[$id] = $type[0]->slug ?? false;
        return $this->typeCache[$id];
    }


}