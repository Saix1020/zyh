'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('MyCtrl1', function($scope, $http) {

      //$scope.users = [];

      $http.get('/users/markets')
          .success(function(markets){
            $scope.markets = [];
            for(var key in markets){
              $scope.markets.push({
                name : key,
                config : markets[key]
              });
              markets[key].users_info = [];
              markets[key].users = markets[key].users || [];
              markets[key].users.forEach(function(user){
                markets[key].users_info.push({
                  name : user,
                  password : markets[key].password,
                  token : ''
                })
              })
            }

          });

      $scope.login = function(market_config, user_info){
          $http.post('/users/login', JSON.stringify({
            market : market_config,
            user : user_info
          }))
              .success(function (response) {
                if(response.return_code == 0){
                  user_info.token = response.token;
                }
                else {
                  console.log(response.error_message + ' 登录失败');
                }
              })
              .catch(function(e){
                console.log(user_info.name + ' 登录失败');
              })
      }
  })
  .controller('MyCtrl2', ['$scope', function($scope) {

  }]);
