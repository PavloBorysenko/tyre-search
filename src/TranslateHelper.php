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
        //    'it_IT' => [
        //        'Hello' => 'Ciao',
        //    ],
        //]
        $overrideTranslationDefault = [];
        /*$overrideTranslationDefault = [
            'es_ES' => [
                'Select Tyre Width' => 'Seleccionar ancho',
                'Select Aspect Ratio' => 'Seleccionar relación de aspecto',
                'Select Rim Diameter' => 'Seleccionar diámetro de llanta',
                'Select Load Speed Index' => 'Seleccionar índice de carga/velocidad',
                'No search results.' => 'No se encontraron resultados.',
                'Select Tyre Name' => 'Seleccionar nombre de la goma',
            ],
            'it_IT' => [
                'Select Tyre Width' => 'Seleziona larghezza',
                'Select Aspect Ratio' => 'Seleziona rapporto di aspetto',
                'Select Rim Diameter' => 'Seleziona diametro di ruota',
                'Select Load Speed Index' => 'Seleziona indice di carico/velocità',
                'No search results.' => 'Nessun risultato trovato.',
                'Select Tyre Name' => 'Seleziona nome della gomma',
            ],
            'fr_FR' => [
                'Select Tyre Width' => 'Sélectionner la largeur',
                'Select Aspect Ratio' => 'Sélectionner le rapport de aspect',
                'Select Rim Diameter' => 'Sélectionner le diamètre de la jante',
                'Select Load Speed Index' => 'Sélectionner l\'indice de charge/vitesse',
                'No search results.' => 'Aucun résultat trouvé.',
                'Select Tyre Name' => 'Sélectionner le nom de la gomme',
            ],
            'de_DE' => [
                'Select Tyre Width' => 'Breite auswählen',
                'Select Aspect Ratio' => 'Verhältnis auswählen',
                'Select Rim Diameter' => 'Jentilänge auswählen',
                'Select Load Speed Index' => 'Ladefaktor/Geschwindigkeitsindex auswählen',  
                'No search results.' => 'Keine Ergebnisse gefunden.',
                'Select Tyre Name' => 'Reifenname auswählen',
            ],
            'pl_PL' => [
                'Select Tyre Width' => 'Wybierz szerokość',
                'Select Aspect Ratio' => 'Wybierz współczynnik',
                'Select Rim Diameter' => 'Wybierz średnicę felgi',
                'Select Load Speed Index' => 'Wybierz indeks obciążenia/prędkości',
                'No search results.' => 'Nie znaleziono wyników.',
                'Select Tyre Name' => 'Wybierz nazwę opony',
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