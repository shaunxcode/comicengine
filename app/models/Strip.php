<?php

namespace app\models;

class Strip extends Model { }

Strip::applyFilter('save', function($self, $params, $chain) {
    $record = $params['entity'];
    
    if(!$record->id) {
		$total = Strip::find('count', array('conditions' => array('comicId' => $record->comicId)));
		$record->name = 'Title' . ($total + 1);
    }

    $params['entity'] = $record;

    return $chain->next($self, $params, $chain);
});