'use strict';

/**
 * @ngdoc overview
 * @name ngCookies
 */


angular.module('ngCookies', ['ng']).
  /**
   * @ngdoc object
   * @name ngCookies.$cookies
   * @requires $browser
   *
   * @description
   * Предоставляет доступ на чтение и запись к cookies браузера.  
   *
   * Доступен только простой Object. Новые cookies создаются/удаляются 
   * при добавлении/удалении свойств к этому объекту в конце текущего $eval.   
   *
   * @example
   <doc:example>
     <doc:source>
       <script>
         function ExampleController($cookies) {
           // Извлечение cookie
           var favoriteCookie = $cookies.myFavorite;
           // Запись cookie
           $cookies.myFavorite = 'oatmeal';
         }
       </script>
     </doc:source>
   </doc:example>
   */
   factory('$cookies', ['$rootScope', '$browser', function ($rootScope, $browser) {
      var cookies = {},
          lastCookies = {},
          lastBrowserCookies,
          runEval = false,
          copy = angular.copy,
          isUndefined = angular.isUndefined;

      //creates a poller fn that copies all cookies from the $browser to service & inits the service
      $browser.addPollFn(function() {
        var currentCookies = $browser.cookies();
        if (lastBrowserCookies != currentCookies) { //relies on browser.cookies() impl
          lastBrowserCookies = currentCookies;
          copy(currentCookies, lastCookies);
          copy(currentCookies, cookies);
          if (runEval) $rootScope.$apply();
        }
      })();

      runEval = true;

      //at the end of each eval, push cookies
      //TODO: this should happen before the "delayed" watches fire, because if some cookies are not
      //      strings or browser refuses to store some cookies, we update the model in the push fn.
      $rootScope.$watch(push);

      return cookies;


      /**
       * Pushes all the cookies from the service to the browser and verifies if all cookies were stored.
       */
      function push() {
        var name,
            value,
            browserCookies,
            updated;

        //delete any cookies deleted in $cookies
        for (name in lastCookies) {
          if (isUndefined(cookies[name])) {
            $browser.cookies(name, undefined);
          }
        }

        //update all cookies updated in $cookies
        for(name in cookies) {
          value = cookies[name];
          if (!angular.isString(value)) {
            if (angular.isDefined(lastCookies[name])) {
              cookies[name] = lastCookies[name];
            } else {
              delete cookies[name];
            }
          } else if (value !== lastCookies[name]) {
            $browser.cookies(name, value);
            updated = true;
          }
        }

        //verify what was actually stored
        if (updated){
          updated = false;
          browserCookies = $browser.cookies();

          for (name in cookies) {
            if (cookies[name] !== browserCookies[name]) {
              //delete or reset all cookies that the browser dropped from $cookies
              if (isUndefined(browserCookies[name])) {
                delete cookies[name];
              } else {
                cookies[name] = browserCookies[name];
              }
              updated = true;
            }
          }
        }
      }
    }]).


  /**
   * @ngdoc object
   * @name ngCookies.$cookieStore
   * @requires $cookies
   *
   * @description
   * Предоставляет ключ-значение (строка-объект) хранилище на основе сессионных cookies.
   * Объекты помещённые или извлечённые из этого хранилища автоматически сериализуются
   * или десериализуются с помощью toJson/fromJson angular'а.
   * @example
   */
   factory('$cookieStore', ['$cookies', function($cookies) {

      return {
        /**
         * @ngdoc method
         * @name ngCookies.$cookieStore#get
         * @methodOf ngCookies.$cookieStore
         *
         * @description
         * Возвращает значение cookie по заданному ключу         
         *
         * @param {string} key Id для поиска.
         * @returns {Object} Десериализованное значение cookie.
         */
        get: function(key) {
          return angular.fromJson($cookies[key]);
        },

        /**
         * @ngdoc method
         * @name ngCookies.$cookieStore#put
         * @methodOf ngCookies.$cookieStore
         *
         * @description
         * Записывает значение для cookie с заданным ключом         
         *
         * @param {string} key Id для `value`.
         * @param {Object} value Значение для записи.
         */
        put: function(key, value) {
          $cookies[key] = angular.toJson(value);
        },

        /**
         * @ngdoc method
         * @name ngCookies.$cookieStore#remove
         * @methodOf ngCookies.$cookieStore
         *
         * @description
         * Удаляет cookie         
         *
         * @param {string} key Id для удаления.
         */
        remove: function(key) {
          delete $cookies[key];
        }
      };

    }]);
