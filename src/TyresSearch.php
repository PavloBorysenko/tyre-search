<?php

namespace TyreSearch;

use TyreSearch\TranslateHelper;
use TyreSearch\TyresData;

class TyresSearch {

    public $translateHelper = null;
    public $tyresDataHelper = null;

    public function __construct( TranslateHelper $translateHelper ) {
        $this->translateHelper = $translateHelper;
        $this->tyresDataHelper = new TyresData($translateHelper);
    }

    public function searchById($tyre_id) {

        if ($tyre_id < 1) {
            return [];
        }
        
        $post = get_post( $tyre_id );

        if ( !$post || $post->post_type !== 'tyres' ) {
            return [];
        }
        $results = [];

        $variants = get_field('tyre_variants', $tyre_id);
        if (!is_array($variants)) {
            return [];
        }
        foreach ($variants as $index => $variant) {

            $results[] = $this->tyresDataHelper->getPreparedData($tyre_id, $index, $variant);

        }

        return $results;
    }
    public function searchBySpecification($vehicle_type, $tyre_seasons, $tyre_width, $aspect_ratio, $rim_diameter, $load_speed_index) {
        
        $args = $this->getArgs();

        $args = $this->addTaxQueryExcludeMotorsport($args);
        
        $args = $this->addTaxQueryLocation($args);

        if ($vehicle_type) {
            $args = $this->addTaxQueryVehicleType($args, $vehicle_type);
        }
        if ($tyre_seasons) {
            $args = $this->addTaxQueryTyreSeason($args, $tyre_seasons);
        }
 
        
        $tyres = get_posts($args);

        $results = [];

        foreach ($tyres as $tyre_id) {
            $variants = get_field('tyre_variants', $tyre_id);
            if (!is_array($variants)) {
                continue;
            }
            foreach ($variants as $index => $variant) {

                $matches = true;
                if ($tyre_width && $variant['width'] !== $tyre_width) {
                    $matches = false;
                }
                
                if (($aspect_ratio === '0' || $aspect_ratio) && $variant['ratio'] !== $aspect_ratio) {
                    $matches = false;
                }
                
                if ($rim_diameter && $variant['diameter'] !== $rim_diameter) { 
                    $matches = false;
                }

                if (($load_speed_index === '0' || $load_speed_index) && $variant['load_index'] !== $load_speed_index) {
                    $matches = false;
                }
                
                if ($matches) {
                    $results[] = $this->tyresDataHelper->getPreparedData($tyre_id, $index, $variant);
                }
            }
        }
    
        return $results;
    }
    public function searchByNameSizeEan($search_string) {

        if(empty($search_string)) {
            return [];
        }
        $result = [];

        //EAN search.
        $result = $this->searchByEan($search_string);
        if (!empty($result)) {
            return $result;
        }
    
        //Post name search.
        $post_ids = $this->getTyreIdByName($search_string);
        foreach ($post_ids as $post_id) {
            $variants = get_field('tyre_variants', $post_id);
            if (!is_array($variants)) {
                continue;
            }
            foreach ($variants as $index => $variant) {         
                $result[] = $this->tyresDataHelper->getPreparedData($post_id, $index, $variant);
            }
        }

        //Size search.
        $args = ['post__not_in'    => $post_ids];
        $result = array_merge($result, $this->searchBySize($search_string, $args));
    
        return $result;
        
    }
    public function searchByEan($ean, $args = []): array {

        //if (!$this->isEan($ean)) {
            //return [];
        //}
    
        $args = $this->getArgs($args);
    
        $tyres = get_posts($args);
        $result = [];
        
        foreach ($tyres as $tyre_id) {
            $variants = get_field('tyre_variants', $tyre_id);
            
            if (!is_array($variants)) {
                continue;
            }
    
            foreach ($variants as $index => $variant) {
    
                $ean_match = ($variant['eanjan'] ?? '') == $ean;
                $art_match = ($variant['sales_art'] ?? '') == $ean;
                
                if ($ean_match || $art_match) {
                    $result = $this->tyresDataHelper->getPreparedData($tyre_id, $index, $variant);
                    $result['tyre_id'] = $tyre_id;
                    $result['tyre_variant_index'] = $index;
                    return [$result];
                    //break 2;
                }
            }
        }
    

        return $result;      
    }

    private function searchBySize( string $search_string, array $args = []): array {

        if (empty($search_string)) {
            return [];
        }
        $result = [];
    
        $args = $this->getArgs($args);
    
        $tyres = get_posts($args);
        foreach ($tyres as $tyre_id) {
            $variants = get_field('tyre_variants', $tyre_id);
            if (!is_array($variants)) {
                continue;
            }
            foreach ($variants as $index => $variant) {
                if ($variant['size'] == $search_string) {
                    $result[] = $this->tyresDataHelper->getPreparedData($tyre_id, $index, $variant);
                }
            }
        }
        return $result;
    }
    private function getTyreIdByName(string $search_string): array {

        global $wpdb;

        $post_name_words = explode(' ', $search_string);
        $post_name_words = array_map('trim', $post_name_words);
        $post_name_words = array_unique($post_name_words);
    
        
        $sql_where_params = [];
        $sql_where = '';
     
        foreach ($post_name_words as $word) {
            $sql_where .= ' AND p.post_name LIKE %s ';
            $sql_where_params[] = '%' . $wpdb->esc_like($word) . '%';
        }
        $sql = $wpdb->prepare("SELECT p.ID FROM {$wpdb->posts} p WHERE p.post_type = 'tyres' " .
        "AND p.post_status = 'publish' " .
        " $sql_where ", ...$sql_where_params);
    
        $post_ids = $wpdb->get_col($sql);
    
        return $post_ids;
    }

    private function addTaxQueryLocation($args) {

        if (function_exists('yokohama_get_current_market_term')) {
            $current_market_term = yokohama_get_current_market_term();
            if ($current_market_term) {
                if (!isset($args['tax_query'])) {
                    $args['tax_query'] = array('relation' => 'AND');
                }
                $args['tax_query'][] = array(
                    'taxonomy' => 'tyre_markets',
                    'field' => 'slug',
                    'terms' => $current_market_term
                );
            }
        }

        return $args;
    }

    private function addTaxQueryExcludeMotorsport($args) {
        if (!isset($args['tax_query'])) {
            $args['tax_query'] = array('relation' => 'AND');
        }
        $args['tax_query'][] = array(
            'taxonomy' => 'tyre_type',
            'field' => 'slug',
            'terms' => 'motorsport',
            'operator' => 'NOT IN'
        );
        return $args;
    }

    private function addTaxQueryVehicleType($args, $vehicle_type) {

            if (!isset($args['tax_query'])) {
                 $args['tax_query'] = array('relation' => 'AND');
            }
            $args['tax_query'][] = array(
                'taxonomy' => 'tyre_type',
                'field' => 'slug',
                'terms' => $vehicle_type
            );
        
        return $args;
    }

    private function addTaxQueryTyreSeason($args, $tyre_seasons) {
        if (!isset($args['tax_query'])) {
            $args['tax_query'] = array('relation' => 'AND');
        }
        $args['tax_query'][] = array(
            'taxonomy' => 'tyre_season',
            'field' => 'slug',
            'terms' => $tyre_seasons
        );
        return $args;
    }

    private function isEan($ean) {
        return preg_match('/^(?:\d[- ]?){12}\d$/', $ean);
    }
    private function getArgs($args = []) {
            $args = wp_parse_args($args, [
                'post_type' => 'tyres',
                'posts_per_page' => -1,
                'post_status' => 'publish',
                'fields' => 'ids',
                'orderby' => 'title',
                'order' => 'ASC',
                'no_found_rows' => true,
            ]);
            return $args;
    }
}