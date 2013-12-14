var app = angular.module('doorbell', [])
.directive('ngEnter', function() {
  return function(scope, element, attrs) {
    element.bind("keydown keypress", function(event) {
      if(event.which === 13) {
        scope.$apply(function(){
          scope.$eval(attrs.ngEnter);
        });
        event.preventDefault();
      }
    });
  };
})
.factory('ajax', function($q, $http){
  var service = {};

  service.call = function(url, method, data) {
    var p = $q.defer();

    $http({
      method: method,
      url: url,
      data: data
    }).success(function(data) {
      p.resolve(data);
    }).error(function(err) {
      p.reject(err);
    });

    return p.promise;
  };

  service.ring = function(data){
    return service.call('/ring', 'post', data);
  };

  service.unring = function(data){
    return service.call('/unring', 'post', data);
  };

  service.leave = function(data){
    return service.call('/leave', 'post', data);
  };

  service.whosthere = function(){
    var toReturn = service.call('/whosthere', 'get');
    return toReturn;
  };

  return service;
})
.controller('doorbell', function($scope, $timeout, ajax) {
  // Initialize variables.
  $scope.state = {};
  $scope.state.hasRung = false;
  $scope.state.inside = false;

  var contactInfoExists = function() {
    console.log($scope.name, $scope.contact);
    return ($scope.name && $scope.contact);
  };

  // Checks if a given input looks like an email or a phone number.
  var checkContactInfo = function(){
    if ($scope.name.length < 2) return false;
    var contact = $scope.contact;
    if ( contact && contact.match(/.+\@.+\..+/) ){
      return true;
    } else {
      $scope.contact = contact.replace(/[^\d]*/g, '', 'g');
      if (contact.length > 9){
         return true;
      }
    }
    return false;
  };

  // Button bindings.
  $scope.ring = function() {
    if (contactInfoExists()) {
      if (checkContactInfo()) {
        var data = {name: $scope.name, contact: $scope.contact};
        ajax.ring(data).then(
          function() {
            getWhosThere();
            $scope.state.hasRung = true;
            $scope.state.inside = false;
            $scope.message = "Rang that bell!  Click cancel once you're inside.";
          },
          function(err) {
            $scope.message = "Error logging in.  Try again.";
          }
        );
      } else {
        $scope.message = "What kind of name and contact is that?";
      }
    } else {
      $scope.message = "Whoa there! Don't try to shirk your responsibilities!";
    }
  };

  $scope.unring = function() {
    if (contactInfoExists()) {
      if (checkContactInfo()) {
        var data = {name: $scope.name, contact: $scope.contact};
        ajax.unring(data).then(
          function() {
            getWhosThere();
            $scope.state.hasRung = true;
            $scope.state.inside = true;
            $scope.message = "Great!  Thanks for keeping everyone posted.";
          },
          function(err) {
            $scope.message = "Error unringing bell.  Try again.";
          }
        );
      } else {
        $scope.message = "What kind of name and contact is that?";
      }
    } else {
      $scope.message = "We need your name and info to look you up.";
    }
  };

  $scope.leave = function() {
    if (contactInfoExists()) {
      if (checkContactInfo()) {
        var data = {contact: $scope.contact};
        ajax.unring(data).then(
          function() {
            getWhosThere();
            $scope.state.hasRung = false;
            $scope.state.inside = false;
            $scope.message = "See you next time!";
          },
          function(err) {
            $scope.message = "Error leaving.  Try again, or you'll keep getting messages.";
          }
        );
      } else {
        $scope.message = "What kind of name and contact is that?";
      }
    } else {
      $scope.message = "We need your name and info to log you out.";
    }
  };

  // Who's there timer.
  var getWhosThere = function() {
    ajax.whosthere().then(
      function(data) {
        if (data.length) {
          $scope.people = data;
        }
      }
    );
  };

  // Durned Angular don't got no set-interval.
  var recurringGetWhosThere = function() {
    getWhosThere();
    $timeout(recurringGetWhosThere, 10000);
  };
  recurringGetWhosThere();

});