<?php

namespace app\models;

use lithium\security\Password; 

class User extends Model 
{
	const salt = 'catfishratfishdogpish';
	protected $filterFields = array('password');
}


User::applyFilter('save', function($self, $params, $chain) {
    $record = $params['entity'];
    
    if(!$record->id && !empty($record->password)){
        $record->password = Password::hash($record->password, User::salt);
		$record->apiToken = md5(time() . rand());
		
		$existingUser = User::find('first', array('conditions' => array('email' => $record->email)));
		if(!empty($existingUser)) {
			throw new \Exception('There is already a user registered with that email address');
		}
    }

    $params['entity'] = $record;

    return $chain->next($self, $params, $chain);
});