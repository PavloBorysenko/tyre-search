<?php
/**
 * Plugin Name: Tyre Search
 * Description: Tyre Search plugin
 * Version: 1.0.0
 * Author: Na-Gora&totoroko
 * Author URI: #
 * License: GPL-2.0+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.txt
 */

define('TYRE_SEARCH_PATH', plugin_dir_path(__FILE__));
define('TYRE_SEARCH_URL', plugin_dir_url(__FILE__));

require_once plugin_dir_path(__FILE__) . 'src/Cache/CacheInterface.php';
require_once plugin_dir_path(__FILE__) . 'src/Cache/TransientCache.php';
require_once plugin_dir_path(__FILE__) . 'src/TyresSearch.php';
require_once plugin_dir_path(__FILE__) . 'src/TranslateHelper.php';
require_once plugin_dir_path(__FILE__) . 'src/TyresData.php';
require_once plugin_dir_path(__FILE__) . 'src/TyreShortcode.php';

use TyreSearch\Cache\TransientCache as TyreCache;
use TyreSearch\TyresSearch as TyresSearch;
use TyreSearch\TranslateHelper as TranslateHelper;
use TyreSearch\TyresDataHelper as TyresDataHelper;
use TyreSearch\TyreShortcode as TyreShortcode;

new TyreShortcode();



function tyre_specification_enqueue_assets() {
    $plugin_url = plugin_dir_url(__FILE__);
    
    wp_enqueue_style('tyre-specification-search-css', $plugin_url . 'css/tyre-specification-search.css', array(), '1.0.0');
    
    wp_enqueue_script('tyre-specification-search-js', $plugin_url . 'js/tyre-specification-search.js',array('jquery'), '1.0.0', true);
    
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

    $no_results = $translate_helper->getTranslatepressTranslation('No matches found. Try a different search term.');
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
add_action('wp_ajax_tyre_ean_search', 'handle_tyre_ean_search');
function handle_tyre_ean_search() {
    $ean = sanitize_text_field($_POST['ean'] ?? '');

    $translate_helper = new TranslateHelper();
    $no_results = $translate_helper->getTranslatepressTranslation('No matches found. Try a different EAN number.');

    $cache = new TyreCache();
    $cached_data = $cache->get('ean_' . $ean);
    if ($cached_data !== false) {
        $cached_data = tyre_prepare_response($cached_data, $no_results);
        wp_send_json_success($cached_data);
        return;
    }
    
    $tyres_search = new TyresSearch($translate_helper);
    $result = $tyres_search->searchByEan($ean);

    $cache->set('ean_' . $ean, $result, DAY_IN_SECONDS);
    $result = tyre_prepare_response($result, $no_results);
    wp_send_json_success($result);
    return;
}


add_action('wp_ajax_tyre_name_search', 'handle_tyre_name_search');
add_action('wp_ajax_tyre_name_search', 'handle_tyre_name_search');

function handle_tyre_name_search() {
    $name = sanitize_text_field($_POST['name'] ?? '');

    $translate_helper = new TranslateHelper();

    $cache = new TyreCache();
    $cached_data = $cache->get('name_' . $name);
    $no_results = $translate_helper->getTranslatepressTranslation('No matches found. Try a different search name.');
    if ($cached_data !== false) {
        $cached_data = tyre_prepare_response($cached_data, $no_results);
        wp_send_json_success($cached_data);
        return;
    }


    $tyres_search = new TyresSearch($translate_helper);
    $result = $tyres_search->searchByNameSizeEan($name);

    $cache->set('name_' . $name, $result, DAY_IN_SECONDS);

    $result = tyre_prepare_response($result, $no_results);
    wp_send_json_success( $result);
    return;
}

add_action('wp_ajax_tyre_id_search', 'handle_tyre_id_search');
add_action('wp_ajax_nopriv_tyre_id_search', 'handle_tyre_id_search');
function handle_tyre_id_search() {
    $id = (int)$_GET['id'] ?? 0;
    $translate_helper = new TranslateHelper();
    $no_results = $translate_helper->getTranslatepressTranslation('No matches found. Try a different ID.');

    $cache = new TyreCache();
    $cached_data = $cache->get('id_' . $id);
    if ($cached_data !== false) {
        $cached_data = tyre_prepare_response($cached_data, $no_results);
        wp_send_json_success($cached_data);
        return;
    }

    $translate_helper = new TranslateHelper();
    $tyres_search = new TyresSearch($translate_helper);
    $result = $tyres_search->searchById($id);

    $cache->set('id_' . $id, $result, DAY_IN_SECONDS);

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

// Invalidate cache when tyres post is saved/updated
add_action( 'save_post_tyres', function( $post_id, $post, $update ) {
    if ( wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
        return;
    }

    $cache = new TyreCache();
    $cache->clear();

}, 10, 3 );


