<?php
namespace TyreSearch\Cache;


class TransientCache implements \TyreSearch\Cache\CacheInterface {

    private $cache_prefix = 'tyre_search_';

    private $active = true;


    public function get($key) {
        if (!$this->active) {
            return false;
        }
        return get_transient($this->get_cache_key($key));
    }
    public function set($key, $value, $ttl = null) {
        if (!$this->active) {
            return false;
        }
        return set_transient($this->get_cache_key($key), $value, $ttl);
    }
    public function delete($key) {
        return delete_transient($key);
    }

    public function clear() {
        global $wpdb;

        $search = $this->cache_prefix . '%';
        
        $wpdb->query( $wpdb->prepare(
            "DELETE FROM $wpdb->options WHERE option_name LIKE %s",
            '_transient_' . $search
        ));
        
        $wpdb->query( $wpdb->prepare(
            "DELETE FROM $wpdb->options WHERE option_name LIKE %s",
            '_transient_timeout_' . $search
        ));

        error_log('Transient cache cleared');
    }
    private function get_cache_key($key) {
        if(is_string($key)){
            return $this->cache_prefix . md5($key);
        }
        return $this->cache_prefix . md5(json_encode($key));
    }

}