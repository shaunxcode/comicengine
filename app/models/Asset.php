<?php

namespace app\models;

class Asset extends Model 
{ 
	public function filterRecord($record)
	{
		$record = parent::filterRecord($record);
		
		if($record['type'] == 'background') {
			$record['value'] = unserialize($record['value']);
		}
		
		return $record;
	}
}

Asset::applyFilter('save', function($self, $params, $chain) {
    $record = $params['entity'];
    
	if(isset($record->value)) {
		$record->value = serialize($record->value);
	}
	
    if(isset($record->image)) {
		$imageString = base64_decode(chunk_split(str_replace('data:image/png;base64,', '', $record->image))); 
		unset($record->image);
  	}

    $params['entity'] = $record;

    $result = $chain->next($self, $params, $chain);

	if($result) {
		$dir = '../webroot/assets/' . $record->frame_id;
	
		if(!file_exists($dir)) {
			mkdir($dir);
		}
		
		file_put_contents($dir . '/' . 'frame.png', $imageString);
		file_put_contents($dir . '/' . $record->id . '.png', $imageString);
	}
	
	return $result;
	
});