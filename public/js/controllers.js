'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('MyCtrl1', function($scope, $http, $cookies) {

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
                  token : $cookies.get('' + markets[key].id + '.' + user)
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
                    var expireDate = new Date();
                    expireDate.setMinutes(expireDate.getMinutes() + 10);
                    $cookies.put('' + market_config.id + '.' + user_info.name, response.token, {'expires': expireDate});
                }
                else {
                  console.log(response.error_message + ' 登录失败');
                }
              })
              .catch(function(e){
                console.log(user_info.name + ' 登录失败');
              })
      };

      $scope.query =  function(market_config, user_info) {
          $http.post('/users/query', JSON.stringify({
              market : market_config,
              user : user_info
          }))
              .success(function (response) {
                  if(response.return_code == 0){

                  }
                  else {
                      console.log(response.error_message + ' 查询失败');
                  }
              })
              .catch(function(e){
                  console.log(user_info.name + ' 查询失败');
              })
      }
  })
  .controller('MyCtrl2', ['$scope', function($scope) {

  }]);
