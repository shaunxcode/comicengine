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
	
	protected function apiTokenExists($apiToken)
	{
		$result = User::find('first', array('conditions' => array('apiToken' => $apiToken)));
		return !empty($result);
	}
	
	protected function apiTokenCheck()
	{
		if(isset(self::$tokenOverride['search'])) {
			if(isset($this->request->query['apiToken'])) {
				unset($this->request->query['apiToken']);
				return true;
			}
		}
		
		if(isset($this->request->data['apiToken'])) {
			if($this->apiTokenExists($this->request->data['apiToken'])) {
				unset($this->request->data['apiToken']);
				return true;
			}
		}
		
		if(isset($this->request->query['apiToken'])) {
			if($this->apiTokenExists($this->request->query['apiToken'])) {
				unset($this->request->query['apiToken']);
				return true;
			}
		}			
		
		$this->jsonException('Invalid api token');
	}
	
	public function create()
	{
		if($this->apiTokenCheck()) {
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
		if(!isset($this->request->params[$this->primaryField])) {
			throw new \Exception('Yo dawg, I heard you forgot to give me an id');
		}
		
		var_dump($this->request->params);
		$pkey = $this->request->params[$this->primaryField];
		echo "hey dog I heard you like {$this->modelName} {$pkey}";
		die();
	}

	public function search()
	{
		if($this->apiTokenCheck()) {
			if(count($this->request->query)) {
				$result = $this->model->find('all', array('conditions' => $this->request->query));
			}
			
			return $this->json(empty($result) ? array() : $this->model->filterFields($result->data()));
		}
	}
	
	public function update()
	{
		if($this->apiTokenCheck()) {
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