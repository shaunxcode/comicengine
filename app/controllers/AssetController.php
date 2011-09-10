<?php

namespace app\controllers;

class AssetController extends Controller 
{
 
	public function upload() 
	{
		var_dump($this->request->data);
		die();
		if (is_uploaded_file($data['file']['tmp_name'])) {
			$method = 'storeFile';
			$file = $data['file']['tmp_name'];
			$data['filename'] = $data['file']['name'];
		}
	}
		
}