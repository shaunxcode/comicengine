<?php

namespace app\models;

use app\models\Frame;

class Strip extends Model 
{ 
	protected function getRelations($record)
	{
		return array(
			'frames' => Frame::find('all', array('conditions' => array('strip_id' => $record['id'])))->data()
		);
	}
}

Strip::bind('hasMany', 'Frame');

Strip::applyFilter('save', function($self, $params, $chain) {
    $record = $params['entity'];
    
    if(!$record->id) {
		$total = Strip::find('count', array('conditions' => array('comic_id' => $record->comic_id)));
		$record->name = 'Title' . ($total + 1);
    }

    $params['entity'] = $record;

    $result = $chain->next($self, $params, $chain);
	return $result; 
	//create default frame
	
//	var_dump($params['entity']);
});