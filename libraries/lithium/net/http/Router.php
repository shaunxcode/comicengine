<?php
/**
 * Lithium: the most rad php framework
 *
 * @copyright     Copyright 2011, Union of RAD (http://union-of-rad.org)
 * @license       http://opensource.org/licenses/bsd-license.php The BSD License
 */

namespace lithium\net\http;

use lithium\util\Inflector;
use lithium\net\http\RoutingException;

/**
 * The two primary responsibilities of the `Router` class are to generate URLs from parameter lists,
 * and to determine the correct set of dispatch parameters for incoming requests.
 *
 * Using `Route` objects, these two operations can be handled in a reciprocally consistent way.
 * For example, if you wanted the `/login` URL to be routed to
 * `myapp\controllers\SessionsController::add()`, you could set up a route like the following in
 * `config/routes.php`:
 *
 * {{{
 * use lithium\net\http\Router;
 *
 * Router::connect('/login', array('controller' => 'sessions', 'action' => 'add'));
 *
 * // -- or --
 *
 * Router::connect('/login', 'Sessions::add');
 * }}}
 *
 * Not only would that correctly route all requests for `/login` to `SessionsController::add()`, but
 * any time the framework generated a route with matching parameters, `Router` would return the
 * correct short URL.
 *
 * While most framework components that work with URLs (and utilize routing) handle calling the
 * `Router` directly (i.e. controllers doing redirects, or helpers generating links), if you have a
 * scenario where you need to call the `Router` directly, you can use the `match()` method.
 *
 * This allows you to keep your application's URL structure nicely decoupled from the underlying
 * software design. For more information on parsing and generating URLs, see the `parse()` and
 * `match()` methods.
 */
class Router extends \lithium\core\StaticObject {

	/**
	 * An array of loaded lithium\net\http\Route objects used to match Request objects against.
	 *
	 * @var array
	 */
	protected static $_configurations = array();

	/**
	 * Classes used by `Router`.
	 *
	 * @var array
	 */
	protected static $_classes = array(
		'route' => 'lithium\net\http\Route'
	);

	public static function config($config = array()) {
		if (!$config) {
			return array('classes' => static::$_classes);
		}
		if (isset($config['classes'])) {
			static::$_classes = $config['classes'] + static::$_classes;
		}
	}

	/**
	 * Connects a new route and returns the current routes array. This method creates a new
	 * `Route` object and registers it with the `Router`. The order in which routes are connected
	 * matters, since the order of precedence is taken into account in parsing and matching
	 * operations.
	 *
	 * @see lithium\net\http\Route
	 * @see lithium\net\http\Router::parse()
	 * @see lithium\net\http\Router::match()
	 * @param string $template An empty string, or a route string "/"
	 * @param array $params An array describing the default or required elements of the route
	 * @param array $options
	 * @return array Array of routes
	 */
	public static function connect($template, $params = array(), $options = array()) {
		if (!is_object($template)) {
			if (is_string($params)) {
				$params = static::_parseString($params, false);
			}
			if (isset($params[0]) && is_array($tmp = static::_parseString($params[0], false))) {
				unset($params[0]);
				$params = $tmp + $params;
			}
			$params += array('action' => 'index');
			if (is_callable($options)) {
				$options = array('handler' => $options);
			}
			$class = static::$_classes['route'];
			$template = new $class(compact('template', 'params') + $options);
		}
		return (static::$_configurations[] = $template);
	}

	/**
	 * Wrapper method which takes a `Request` object, parses it through all attached `Route`
	 * objects, and assigns the resulting parameters to the `Request` object, and returning it.
	 *
	 * @param object $request A request object, usually an instance of `lithium\action\Request`.
	 * @return object Returns a copy of the `Request` object with parameters applied.
	 */
	public static function process($request) {
		if (!$result = static::parse($request)) {
			return $request;
		}
		return $result;
	}

	/**
	 * Accepts an instance of `lithium\action\Request` (or a subclass) and matches it against each
	 * route, in the order that the routes are connected.
	 *
	 * @see lithium\action\Request
	 * @see lithium\net\http\Router::connect()
	 * @param object $request A request object containing URL and environment data.
	 * @return array Returns an array of parameters specifying how the given request should be
	 *         routed. The keys returned depend on the `Route` object that was matched, but
	 *         typically include `'controller'` and `'action'` keys.
	 */
	public static function parse($request) {
		foreach (static::$_configurations as $route) {
			if ($match = $route->parse($request)) {
				return $match;
			}
		}
	}

	/**
	 * Attempts to match an array of route parameters (i.e. `'controller'`, `'action'`, etc.)
	 * against a connected `Route` object. For example, given the following route:
	 *
	 * {{{
	 * Router::connect('/login', array('controller' => 'users', 'action' => 'login'));
	 * }}}
	 *
	 * This will match:
	 * {{{
	 * $url = Router::match(array('controller' => 'users', 'action' => 'login'));
	 * // returns /login
	 * }}}
	 *
	 * For URLs templates with no insert parameters (i.e. elements like `{:id}` that are replaced
	 * with a value), all parameters must match exactly as they appear in the route parameters.
	 *
	 * Alternatively to using a full array, you can specify routes using a more compact syntax. The
	 * above example can be written as:
	 *
	 * {{{ $url = Router::match('Users::login'); // still returns /login }}}
	 *
	 * You can combine this with more complicated routes; for example:
	 * {{{
	 * Router::connect('/posts/{:id:\d+}', array('controller' => 'posts', 'action' => 'view'));
	 * }}}
	 *
	 * This will match:
	 * {{{
	 * $url = Router::match(array('controller' => 'posts', 'action' => 'view', 'id' => '1138'));
	 * // returns /posts/1138
	 * }}}
	 *
	 * Again, you can specify the same URL with a more compact syntax, as in the following:
	 * {{{
	 * $url = Router::match(array('Posts::view', 'id' => '1138'));
	 * // again, returns /posts/1138
	 * }}}
	 *
	 * You can use either syntax anywhere a URL is accepted, i.e.
	 * `lithium\action\Controller::redirect()`, or `lithium\template\helper\Html::link()`.
	 *
	 * @param string|array $url Options to match to a URL. Optionally, this can be a string
	 *              containing a manually generated URL.
	 * @param object $context An instance of `lithium\action\Request`. This supplies the context for
	 *               any persistent parameters, as well as the base URL for the application.
	 * @param array $options Options for the generation of the matched URL. Currently accepted
	 *              values are:
	 *              - `'absolute'` _boolean_: Indicates whether or not the returned URL should be an
	 *                absolute path (i.e. including scheme and host name).
	 *              - `'host'` _string_: If `'absolute'` is `true`, sets the host name to be used,
	 *                or overrides the one provided in `$context`.
	 *              - `'scheme'` _string_: If `'absolute'` is `true`, sets the URL scheme to be
	 *                used, or overrides the one provided in `$context`.
	 * @return string Returns a generated URL, based on the URL template of the matched route, and
	 *         prefixed with the base URL of the application.
	 */
	public static function match($url = array(), $context = null, array $options = array()) {
		if (is_string($url)) {
			if (strpos($url, '#') === 0 || strpos($url, 'mailto') === 0 || strpos($url, '://')) {
				return $url;
			}
			if (is_string($url = static::_parseString($url, $context))) {
				return static::_prefix($url, $context, $options);
			}
		}
		if (isset($url[0]) && is_array($params = static::_parseString($url[0], $context))) {
			unset($url[0]);
			$url = $params + $url;
		}
		$url = static::_persist($url, $context);
		$defaults = array('action' => 'index');
		$url += $defaults;

		$base = isset($context) ? $context->env('base') : '';
		$suffix = isset($url['#']) ? "#{$url['#']}" : null;
		unset($url['#']);

		foreach (static::$_configurations as $route) {
			if (!$match = $route->match($url, $context)) {
				continue;
			}
			$path = rtrim("{$base}{$match}{$suffix}", '/') ?: '/';
			$path = ($options) ? static::_prefix($path, $context, $options) : $path;
			return $path ?: '/';
		}
		$match = array("\n", 'array (', ',)', '=> NULL', '(  \'', ',  ');
		$replace = array('', '(', ')', '=> null', '(\'', ', ');
		$url = str_replace($match, $replace, var_export($url, true));
		throw new RoutingException("No parameter match found for URL `{$url}`.");
	}

	/**
	 * Returns the prefix (scheme + hostname) for a URL based on the passed `$options` and the
	 * `$context`.
	 *
	 * @param string $path The URL to be prefixed.
	 * @param object $context The request context.
	 * @param array $options Options for generating the proper prefix. Currently accepted values
	 *              are: `'absolute' => true|false`, `'host' => string` and `'scheme' => string`.
	 * @return string The prefixed URL, depending on the passed options.
	 */
	protected static function _prefix($path, $context = null, array $options = array()) {
		$defaults = array('scheme' => null, 'host' => null, 'absolute' => false);

		if ($context) {
			$defaults['host'] = $context->env('HTTP_HOST');
			$defaults['scheme'] = $context->env('HTTPS') ? 'https://' : 'http://';
		}
		$options += $defaults;

		return ($options['absolute']) ? "{$options['scheme']}{$options['host']}{$path}" : $path;
	}

	/**
	 * Copies persistent parameters (parameters in the request which have been designated to
	 * persist) to the current URL, unless the parameter has been explicitly disabled from
	 * persisting by setting the value in the URL to `null`, or by assigning some other value.
	 *
	 * For example:
	 *
	 * {{{ embed:lithium\tests\cases\net\http\RouterTest::testParameterPersistence(1-10) }}}
	 *
	 * @see lithium\action\Request::$persist
	 * @param array $url The parameters that define the URL to be matched.
	 * @param object $context Typically an instance of `lithium\action\Request`, which contains a
	 *               `$persist` property, which is an array of keys to be persisted in URLs between
	 *                requests.
	 * @return array Returns the modified URL array.
	 */
	protected static function _persist($url, $context) {
		if (!$context || !isset($context->persist)) {
			return $url;
		}
		foreach ($context->persist as $key) {
			$url += array($key => $context->params[$key]);

			if ($url[$key] === null) {
				unset($url[$key]);
			}
		}
		return $url;
	}

	/**
	 * Returns a route from the loaded configurations, by name.
	 *
	 * @param string $route Name of the route to request.
	 * @return lithium\net\http\Route
	 */
	public static function get($route = null) {
		if ($route === null) {
			return static::$_configurations;
		}
		return isset(static::$_configurations[$route]) ? static::$_configurations[$route] : null;
	}

	/**
	 * Resets the `Router` to its default state, unloading all routes.
	 *
	 * @return void
	 */
	public static function reset() {
		static::$_configurations = array();
	}

	/**
	 * Helper function for taking a path string and parsing it into a controller and action array.
	 *
	 * @param string $path Path string to parse.
	 * @param boolean $context
	 * @return array
	 */
	protected static function _parseString($path, $context) {
		if (!preg_match('/^[A-Za-z0-9_]+::[A-Za-z0-9_]+$/', $path)) {
			$base = $context ? $context->env('base') : '';
			$path = trim($path, '/');
			return $context !== false ? "{$base}/{$path}" : null;
		}
		list($controller, $action) = explode('::', $path, 2);
		$controller = Inflector::underscore($controller);
		return compact('controller', 'action');
	}
}

?>