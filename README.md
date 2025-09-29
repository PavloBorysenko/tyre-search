# Tyre Search Plugin

WordPress plugin for searching tyres by specification, EAN code, name and ID.

## Shortcode

-   `[tyre_specification_search]` for displaying search form and posts

## Caching

### Enabling Cache

Caching is **disabled** by default. To enable it, change the `$active` parameter in `src/Cache/TransientCache.php`:

```php
private $active = true; // change from false to true
```

### What Gets Cached

1. **Search Results** - cached for 24 hours (DAY_IN_SECONDS):

    - Search by specification
    - Search by EAN code
    - Search by name
    - Search by ID

2. **Filter Data** - cached for 6 hours (6 \* HOUR_IN_SECONDS):
    - Available tyre widths
    - Aspect ratios
    - Rim diameters
    - Load/speed indices
    - Tyre names

### Automatic Cache Clearing

Cache is automatically cleared when:

-   Saving/updating `tyres` post type (currently disabled in code)
-   Cache TTL expires

### Manual Cache Clearing

Cache can be cleared programmatically:

```php
$cache = new TyreSearch\Cache\TransientCache();
$cache->clear();
```

## Usage

Add the shortcode to any page or post:

```
[tyre_specification_search]
```

## Requirements

-   WordPress 5.0+
-   PHP 7.4+
-   Advanced Custom Fields (ACF) for tyre field management
