<?php

namespace app\models;

class Model extends \lithium\data\Model 
{
	protected $filterFields = array();
	
	protected function getRelations($record) {
		return array();
	}
	
	protected function filterRecord($record) {
		if(!is_array($record)) {
			$record = $record->data();
		}
		
		$record = array_merge($record, $this->getRelations($record));
		
		foreach($this->filterFields as $field) {
			if(isset($record[$field])) {
				unset($record[$field]);
			}
		}
		return $record;
	}
	
	public function filterFields($data)
	{
		if(is_array(current($data))) {
			if(is_object($data)) {
				$data = $data->data();
			}
			
			foreach($data as &$record) {
				$record = $this->filterRecord($record);
			}
		} else {
			$data = $this->filterRecord($data);
		}
		
		return $data;
	}
}