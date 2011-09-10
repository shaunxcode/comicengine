<?php

namespace app\controllers;

use app\models\User;
use lithium\security\Password; 

class UserController extends Controller 
{
	protected static $tokenOverride = array('create');
	
	public function authenticate()
	{
		$result = User::find('first', array(
			'conditions' => array(
				'email' => $this->request->query['User']['email'], 
				'password' => Password::hash($this->request->query['User']['password'], User::salt))));
		
		if(!empty($result)) { 
			$data = $result->data();
			unset($data['password']);
			return $this->json($data);
		}
		
		return $this->jsonException('failed to authenticate');
	}
	
	public function authenticateByToken()
	{
		$result = User::find('first', array(
			'conditions' => array(
				'api_token' => $this->request->query['api_token'])));
				
		if(!empty($result)) {
			$data = $result->data();
			unset($data['password']);
			return $this->json($data);
		} 
		$this->jsonException('invalid token');
	}
}