<?php
/**
 * Plugin Name: Tyre Search
 * Description: Tyre Search plugin
 * Version: 1.2.0
 * Author: Na-Gora&totoroko
 * Author URI: #
 * License: GPL-2.0+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.txt
 */

define('TYRE_SEARCH_PATH', plugin_dir_path(__FILE__));
define('TYRE_SEARCH_URL', plugin_dir_url(__FILE__));

require_once TYRE_SEARCH_PATH . 'src/Cache/CacheInterface.php';
require_once TYRE_SEARCH_PATH . 'src/Cache/TransientCache.php';
require_once TYRE_SEARCH_PATH . 'src/TyresSearch.php';
require_once TYRE_SEARCH_PATH . 'src/TranslateHelper.php';
require_once TYRE_SEARCH_PATH . 'src/TyresData.php';
require_once TYRE_SEARCH_PATH . 'src/TyreShortcode.php';

use TyreSearch\Cache\TransientCache as TyreCache;
use TyreSearch\TyresSearch as TyresSearch;
use TyreSearch\TranslateHelper as TranslateHelper;
use TyreSearch\TyreShortcode as TyreShortcode;


// Initialize Tyre Shortcode
add_action('init', function() {
    new TyreShortcode(new TranslateHelper());
});

function tyre_specification_enqueue_assets() {


    wp_enqueue_style('tom-select-css', 
    TYRE_SEARCH_URL . 'css/tom-select/tom-select.default.min.css', 
    array(), '2.4.3');
    wp_enqueue_script('tom-select-js', 
    TYRE_SEARCH_URL . 'js/tom-select/tom-select.complete.min.js', 
    array(), '2.4.3', true);



    wp_enqueue_style('tyre-specification-search-css', 
    TYRE_SEARCH_URL . 'css/tyre-specification-search.css', 
    array('tom-select-css'), '1.0.0');
    
    wp_enqueue_script('tyre-specification-search-js', 
    TYRE_SEARCH_URL . 'js/tyre-specification-search.js', 
    array('jquery', 'tom-select-js'), '1.0.0', true);
    
    wp_localize_script('tyre-specification-search-js', 'tyre_spec_ajax', array(
        'ajax_url' => admin_url('admin-ajax.php')
    ));
}

add_action('wp_enqueue_scripts', 'tyre_specification_enqueue_assets');


add_action('wp_ajax_tyre_specification_search', 'handle_tyre_specification_search');
add_action('wp_ajax_nopriv_tyre_specification_search', 'handle_tyre_specification_search');
function handle_tyre_specification_search() {
    $search['vehicle_type'] = sanitize_text_field($_POST['vehicle_type'] ?? '');
    $search['tyre_seasons'] = isset($_POST['tyre_season']) ? array_map('sanitize_text_field', $_POST['tyre_season']) : array();
    $search['tyre_width'] = sanitize_text_field($_POST['tyre_width'] ?? '');
    $search['aspect_ratio'] = sanitize_text_field(isset($_POST['aspect_ratio'])? $_POST['aspect_ratio'] : '');
    $search['rim_diameter'] = sanitize_text_field($_POST['rim_diameter'] ?? '');
    $search['load_speed_index'] = sanitize_text_field(isset($_POST['load_index'])? $_POST['load_index'] : '');

    // Have to add market to make correct cache key 
    if (function_exists('yokohama_get_current_market_term')) {
        $search['market'] = yokohama_get_current_market_term();
    }

    $translate_helper = new TranslateHelper();

    $no_results = $translate_helper->getTranslatepressTranslation('No tyres found matching your criteria.');
    $cache = new TyreCache();
    $cached_data = $cache->get($search);
    if ($cached_data !== false) {
        $cached_data = tyre_prepare_response($cached_data, $no_results);
        wp_send_json_success($cached_data);
        return;
    }

    
    $tyres_search = new TyresSearch($translate_helper);
    $result = $tyres_search->searchBySpecification($search['vehicle_type'], $search['tyre_seasons'], $search['tyre_width'], $search['aspect_ratio'], $search['rim_diameter'], $search['load_speed_index']);
    
    $cache->set($search, $result, DAY_IN_SECONDS);
    $result = tyre_prepare_response($result, $no_results);
    wp_send_json_success($result);
    return;

}


add_action('wp_ajax_tyre_ean_search', 'handle_tyre_ean_search');
add_action('wp_ajax_nopriv_tyre_ean_search', 'handle_tyre_ean_search');
function handle_tyre_ean_search() {
    $ean = sanitize_text_field($_POST['ean'] ?? '');

    $translate_helper = new TranslateHelper();
    $no_results = $translate_helper->getTranslatepressTranslation('No matches found. Try a different search term.');

    $cache = new TyreCache();
    $cache_key = tyre_prepare_cache_key('ean_' . $ean);
    $cached_data = $cache->get($cache_key);
    if ($cached_data !== false) {
        $cached_data = tyre_prepare_response($cached_data, $no_results);
        wp_send_json_success($cached_data);
        return;
    }
    
    $tyres_search = new TyresSearch($translate_helper);
    $result = $tyres_search->searchByEan($ean);

    if (isset($result[0]) && isset($result[0]['eu_label']) && 'TMB' == $result[0]['eu_label']) {
        $result = [];
        $no_results = $translate_helper->getTranslatepressTranslation('This tyre does not have an EU label.');
    }

    if (isset($result[0]) && isset($result[0]['tyre_id']) && isset($result[0]['tyre_variant_index'])) {
        if (function_exists('pdf_tire_generator_handle')) {
            $result[0]['pdf_url'] = pdf_tire_generator_handle(
                $result[0]['tyre_id'], 
                $result[0]['tyre_variant_index']
            );
        }
    }

    $cache->set($cache_key, $result, DAY_IN_SECONDS);
    $result = tyre_prepare_response($result, $no_results);
    wp_send_json_success($result);
    return;
}



add_action('wp_ajax_tyre_id_search', 'handle_tyre_id_search');
add_action('wp_ajax_nopriv_tyre_id_search', 'handle_tyre_id_search');
function handle_tyre_id_search() {
    $id = (int)$_GET['id'] ?? 0;
    $translate_helper = new TranslateHelper();
    $no_results = $translate_helper->getTranslatepressTranslation('No matches found. Try a different tire name.');

    $cache = new TyreCache();
    $cache_key = tyre_prepare_cache_key('id_' . $id);
    $cached_data = $cache->get($cache_key);
    if ($cached_data !== false) {
        $cached_data = tyre_prepare_response($cached_data, $no_results);
        wp_send_json_success($cached_data);
        return;
    }

    $translate_helper = new TranslateHelper();
    $tyres_search = new TyresSearch($translate_helper);
    $result = $tyres_search->searchById($id);

    $cache->set($cache_key, $result, DAY_IN_SECONDS);

    $result = tyre_prepare_response($result, $no_results);
    wp_send_json_success($result);
}

function tyre_prepare_response($result, $text) {
    $response = [
        'tyres' => $result,
        'total' => count($result)
    ];
    if (empty($result)) {
        $response['no_results'] =  $text;
    }
    return $response;
}

// Prepare cache key for cache. 
// This is necessary to create a correct cache and display wheels only for specific regions.
function tyre_prepare_cache_key($key) {
    if (function_exists('yokohama_get_current_market_term')) {
        $current_market_term = yokohama_get_current_market_term();
        $key .= '_' . $current_market_term;
    }
    return $key;
}

// Invalidate cache when tyres post is saved/updated
add_action( 'save_post_tyres', function( $post_id, $post, $update ) {
    if ( wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
        return;
    }

    $cache = new TyreCache();
    $cache->clear();

}, 10, 3 );


