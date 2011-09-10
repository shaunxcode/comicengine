<?php

namespace app\models;

use app\models\Asset;

class Frame extends Model 
{ 
	protected function getRelations($record)
	{
		$assetModel = new Asset;
		return array(
			'assets' => $assetModel->filterFields(Asset::find('all', array('conditions' => array('frame_id' => $record['id'])))));
	}
}

Frame::bind('belongsTo', 'Strip');

Frame::applyFilter('save', function($self, $params, $chain) {
    $record = $params['entity'];
    
    if(!$record->id) {
		$total = Frame::find('count', array('conditions' => array('strip_id' => $record->strip_id)));
		$record->position = $total + 1;
  	}

    $params['entity'] = $record;

    return $chain->next($self, $params, $chain);
});