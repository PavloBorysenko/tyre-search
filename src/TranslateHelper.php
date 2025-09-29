<?php

namespace TyreSearch;

class TranslateHelper {

    private $currentLang;

    private $overrideTranslation = [];


    public function __construct($overrideTranslation = []) {
        //An example of $overrideTranslation:
        //[
        //    'fr_FR' => [
        //        'Hello' => 'Bonjour',
        //    ],
        //    'de_DE' => [
        //        'Hello' => 'Hallo',
        //    ],
        //    'es_ES' => [
        //        'Hello' => 'Hola',
        //    ],
        //    'pl_PL' => [
        //        'Hello' => 'Cześć',
        //    ],
        //]
        $overrideTranslationDefault = [];
        /*$overrideTranslationDefault = [
            'es_ES' => [
                'Select Width' => 'Seleccionar ancho',
                'Select Aspect Ratio' => 'Seleccionar relación de aspecto',
                'Select Rim Diameter' => 'Seleccionar diámetro de llanta',
                'Select Load Speed Index' => 'Seleccionar índice de carga/velocidad',
            ],
        ];*/
        $overrideTranslation = array_merge($overrideTranslationDefault, $overrideTranslation);
        $this->overrideTranslation = $overrideTranslation;
    }

    public function getOverrideTranslation($string) {
        if(isset($this->overrideTranslation[$this->getCurrentLang()][$string])) {
            return $this->overrideTranslation[$this->getCurrentLang()][$string];
        }
        return false;
    }
    public function getTranslatepressTranslation($string) {
        if($this->getOverrideTranslation($string)) {
            return $this->getOverrideTranslation($string);
        }
        if(function_exists('trp_translate')){
            return trp_translate($string, $this->getCurrentLang(), false);
        }
        return $string;
    }

    private function getCurrentLang() {
        if($this->currentLang) {
            return $this->currentLang;
        }
        $this->currentLang = get_locale();
        return $this->currentLang;
    }
}