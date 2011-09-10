<?php
/**
 * Lithium: the most rad php framework
 *
 * @copyright     Copyright 2011, Union of RAD (http://union-of-rad.org)
 * @license       http://opensource.org/licenses/bsd-license.php The BSD License
 */

/**
 * The routes file is where you define your URL structure, which is an important part of the
 * [information architecture](http://en.wikipedia.org/wiki/Information_architecture) of your
 * application. Here, you can use _routes_ to match up URL pattern strings to a set of parameters,
 * usually including a controller and action to dispatch matching requests to. For more information,
 * see the `Router` and `Route` classes.
 *
 * @see lithium\net\http\Router
 * @see lithium\net\http\Route
 */
use lithium\net\http\Router;
use lithium\core\Environment;

/**
 * Here, we are connecting `'/'` (the base path) to controller called `'Pages'`,
 * its action called `view()`, and we pass a param to select the view file
 * to use (in this case, `/views/pages/home.html.php`; see `app\controllers\PagesController`
 * for details).
 *
 * @see app\controllers\PagesController
 */
Router::connect('/', 'Pages::view');

/**
 * Connect the rest of `PagesController`'s URLs. This will route URLs like `/pages/about` to
 * `PagesController`, rendering `/views/pages/about.html.php` as a static page.
 */
Router::connect('/pages/{:args}', 'Pages::view');

Router::connect('/api/authenticate', array('http:method' => 'GET', 'controller' => 'User', 'action' => 'authenticate'));
Router::connect('/api/authenticateByToken', array('http:method' => 'GET', 'controller' => 'User', 'action' => 'authenticateByToken'));

Router::connect('/api/upload', array('http:method' => 'POST', 'controller' => 'Asset', 'action' => 'upload'));

Router::connect('/api/{:controller}', array('http:method' => 'POST', 'action' => 'create'));
Router::connect('/api/{:controller}', array('http:method' => 'GET', 'action' => 'search'));
Router::connect('/api/{:controller}/{:model_id}', array('http:method' => 'GET', 'action' => 'read'));
Router::connect('/api/{:controller}', array('http:method' => 'PUT', 'action' => 'update'));


Router::connect('/{:controller}/{:action}/{:args}');