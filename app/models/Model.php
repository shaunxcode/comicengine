<?php

namespace app\models;

class Model extends \lithium\data\Model 
{
	protected $filterFields = array();
	
	private function filterRecord($record) {
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
			foreach($data as &$record) {
				$record = $this->filterRecord($record);
			}
		} else {
			$data = $this->filterRecord($data);
		}
		
		return $data;
	}
}