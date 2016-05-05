'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('mainApp', [
  'ngResource',
  'ui.router',
]);


app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
  $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'home.html',
        access: 'public'
      })
      .state('profile', {
        url: '/profile',
        templateUrl: 'profile.html',
        controller: 'ProfileController',
        access: 'private'
      })
      .state('share', {
        url: '/share',
        templateUrl: 'share.html',
        controller: 'ShareController',
        'access': 'private'
      })
      .state('authorize', {
        url: '/authorize',
        templateUrl: 'authorize.html',
        controller: 'AuthController',
        'access': 'public'
      })
      .state('oauth_callback', {
        url: '/oauth-callback',
        templateUrl: 'oauth_callback.html',
        controller: 'OAuthCallbackController'
      })
  
  $urlRouterProvider.otherwise('/login');

  $locationProvider.html5Mode(true);
});

app.controller('MainController', function($rootScope, $scope, $state) {
  $scope.onLinkedInLoad = function() {
    console.log("Loaded LinkedIn");
    $rootScope.$broadcast("linkedInLoaded");

    $rootScope.$on("$stateChangeStart", function(e, toState, toParams, fromState, fromParams) {
      if (toState.access == 'private' && IN.User.isAuthorized() == false) {
        e.preventDefault();
        console.log("Not authorized - go do that first.");
        $state.go('authorize');
      }
    });

  };

});


function onLinkedInLoad() {
  angular.element(document.getElementById('wrap')).scope().onLinkedInLoad();
}



/**
 * /authorize/
 */
app.controller('AuthController', function($scope, $state) {
  $scope.authorize = function() {
    //window.location.href = "https://www.linkedin.com/uas/oauth2/authorization?response_type=code&client_id=775i5ch3fl3s4c&redirect_uri=http://localhost:8000/oauth-callback&state=tz3pHQoeU7wv8YH6"
    IN.User.authorize($scope.authorized, $scope);
  }

  $scope.authorized = function() {
    $state.go('profile');
  };
});

/**
 * /profile/
 */
app.controller('ProfileController', function($rootScope, $scope) {

  // wait for async SDK load
  if (IN.API) {
    console.log("SDK loaded already");
    loadProfile();
  } else {
    console.log("waiting for SDK to load");
    $rootScope.$on("linkedInLoaded", loadProfile);
  }

  function loadProfile() {
    console.log("loading profile");
    IN.API.Profile("me").result(function(result) {
      var member = result.values[0];
      $scope.id = member.id;
      $scope.firstName = member.firstName;
      $scope.lastName = member.lastName;
      $scope.pictureUrl = member.pictureUrl;
      $scope.headline = member.headline;
      $scope.$apply();
    });
  }
});

/**
 * /share/
 */
app.controller('ShareController', function($rootScope, $scope) {

  $scope.share = function() {
    console.log($scope.content);
    // wait for async SDK load
    if (IN.API) {
      console.log("SDK loaded already");
      post();
    } else {
      console.log("waiting for SDK to load");
      $rootScope.$on("linkedInLoaded", post);
    }
  };

  function post() {
    var payload = {
      "comment": $scope.content,
      "visibility": {
        "code": "anyone"
      }
    };

    IN.API.Raw("/people/~/shares?format=json")
        .method("POST")
        .body(JSON.stringify(payload))
        .result(onSuccess)
        .error(onError);

    function onSuccess(response) {
      $scope.message = 'Success! View the post on LinkedIn at the link below.';
      $scope.postLink = response.updateUrl;
      console.log(response);
      $scope.$apply();
    }

    function onError(response) {
      $scope.message = "Something went wrong.";
      console.log(response);
      $scope.$apply();
    }
  }
  
});




  /**
 * /oauth-callback/
 *
 * Make POST request to https://www.linkedin.com/uas/oauth2/accessToken to get access token
 */
app.controller('OAuthCallbackController', function($scope, $location, $http) {
  var queryParams = $location.search();
  if (queryParams.error) {
    console.log("Error: " + queryParams.error_description);
  }

  if (queryParams.code) {
    $scope.code = queryParams.code;

    var data = {
      "grant_type": "authorization_code",
      "code": $scope.code,
      "redirect_uri": "http://localhost:8000/oauth-callback",
      "client_id": "775i5ch3fl3s4c",
      "client_secret": "tz3pHQoeU7wv8YH6"
    };

    /*var url = "https://www.linkedin.com/uas/oauth2/authorization";
     $http.get(url).then(function(response) {
     console.log(response);
     });

    window.location.href = "https://www.linkedin.com/uas/oauth2/authorization";

    /*$http({
     method: 'POST',
     url: 'https://www.linkedin.com/uas/oauth2/accessToken',
     headers: {
     'Content-Type': 'application/x-www-form-urlencoded'
     },
     transformRequest: function(obj) {
     var str = [];
     for(var p in obj)
     str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
     return str.join("&");
     },
     data: data
     }).then(function(response) {
     // success
     console.log(response);
     }, function(response) {
     // error
     console.log(response);
     });*/

  }

});
