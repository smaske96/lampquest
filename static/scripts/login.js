var loginApp = angular.module("loginApp", ['ngRoute']);
loginApp.config(['$routeProvider', function($routeProvider) {
   $routeProvider.
   when('/', {
      templateUrl: 'view/login-form.html'
   }).
   when('/signup', {
      templateUrl: 'view/signup-form.html'
   }).
   otherwise({
      redirectTo: '/'
   });
}]);
         
//Custom Validator to check if passwords match
loginApp.directive("compareTo", function() {
    return {
        require: "ngModel",
        scope: {
            otherModelValue: "=compareTo"
        },
        link: function(scope, element, attributes, ngModel) {
            ngModel.$validators.compareTo = function(modelValue) {
                return modelValue ==  scope.otherModelValue;
            };
    
            scope.$watch("otherModelValue", function() {
                ngModel.$validate();
            });
        }
    };
});
        
//Custom Validator to check if Username is available
loginApp.directive('usernameAvailable', ['$http', function($http) {
    return {
        require: 'ngModel',
        link: function(scope, element, attributes, model) { 
            model.$asyncValidators.usernameAvailable = function(uname) { 
                return $http.get('/user/uname/available', {params: { username:  uname}}).then(function (res) {
                    model.$setValidity('usernameExists', res.data);
                }); 
            };
        }
    } 
}]);


loginApp.controller('signupControl',function($scope) {
    $scope.encryptPassword = function () {
        var shaObj = new jsSHA("SHA-512", "TEXT");
        shaObj.update($scope.inputPassword);
        
        $scope.inputPassword = shaObj.getHash("HEX");
        $scope.inputConfirmPassword = shaObj.getHash("HEX");
    }
});

loginApp.controller('loginControl', function($scope, $http) {
    $scope.encryptPassword = function () {
        var shaObj = new jsSHA("SHA-512", "TEXT");
        shaObj.update($scope.inputPassword);  

        $scope.inputPassword = shaObj.getHash("HEX");
    }
    
    $http.post('/user/valid').then(function(res) {
        if(res.data=="new") {
            $scope.invalid = false;
        }
        else {
            $scope.invalid = true;
        }
    });
});
        
        