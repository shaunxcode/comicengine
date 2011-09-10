<?php

namespace app\controllers;

use app\models\User;

class Controller extends \Lithium\action\Controller
{
	private $modelName; 
	
	protected static $tokenOverride = array();
	
	public function __construct(array $config = array())
	{
		$class = explode('\\', get_class($this));
		list($this->modelName) = explode('Controller', end($class));
		$FQModelClass = "app\models\\{$this->modelName}";
		$this->model = new $FQModelClass;
		$this->primaryField = lcfirst($this->modelName) . 'Id';
		parent::__construct($config);
	}
	
	protected function json($data)
	{
		return $this->render(array('json' => $data));
	}

	protected function jsonException($msg, $code = false)
	{
		return $this->json(array('exception' => $msg, 'code' => 666));
	}
	
	protected function api_tokenExists($api_token)
	{
		$result = User::find('first', array('conditions' => array('api_token' => $api_token)));
		return !empty($result);
	}
	
	protected function api_tokenCheck($method)
	{
		if(in_array($method, static::$tokenOverride)) {
			if(isset($this->request->query['api_token'])) {
				unset($this->request->query['api_token']);
			}
			if(isset($this->request->data['api_token'])) {
				unset($this->request->data['api_token']);
			}
			
			return true;
		}
		
		if(isset($this->request->data['api_token'])) {
			if($this->api_tokenExists($this->request->data['api_token'])) {
				unset($this->request->data['api_token']);
				return true;
			}
		}
		
		if(isset($this->request->query['api_token'])) {
			if($this->api_tokenExists($this->request->query['api_token'])) {
				unset($this->request->query['api_token']);
				return true;
			}
		}			
		
		$this->jsonException('Invalid api token');
	}
	
	public function create()
	{
		if($this->api_tokenCheck('create')) {
			$record = $this->model->create($this->request->data[$this->modelName]);
			try { 
				if($record->save()) {
					return $this->json($this->model->filterFields($record->to('array')));
				} else {
					return $this->jsonException('could not create');
				}
			} catch(\Exception $e) {
				return $this->jsonException($e->getMessage());
			}
		}
	}
		
	public function read()
	{
		$result = $this->model->find('first', array('conditions' => array('id' => $this->request->params['model_id'])));
		if(empty($result)) {
			$this->jsonException('Could not find record');
		}
		
		return $this->json($this->model->filterFields($result));
	}

	public function search()
	{
		if($this->api_tokenCheck('search')) {
			if(count($this->request->query)) {
				$result = $this->model->find('all', array('conditions' => $this->request->query));
			}
						
			return $this->json(empty($result) ? array() : $this->model->filterFields($result));
		}
	}
	
	public function update()
	{
		if($this->api_tokenCheck('update')) {
			$record = $this->request->data[$this->modelName];
			if($this->model->update($record, array('id' => $record['id']))) {
				return $this->json($this->model->filterFields($record));
			}
		}
	}
	
	public function delete()
	{
		
	}
}