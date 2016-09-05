'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('MyCtrl1', function($scope, $http, $cookies) {

      //$scope.users = [];
        $scope.products = [];

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
                    expireDate.setMinutes(expireDate.getMinutes() + 120);
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
          market_config.products = market_config.products || [];

          if(market_config.products.length>0){
              $scope.query_detail(market_config, user_info);
          }
          else {
              $http.post('/users/query', JSON.stringify({
                  market : market_config,
                  user : user_info
              }))
                  .success(function (response) {
                      if(response.return_code == 0){
                          market_config.products = response.product || [];
                          market_config.users_info.forEach(function(userInfo) {
                              userInfo.selected_product = response.product[0].id;
                          });
                          $scope.query_detail(market_config, user_info);
                      }
                      else {
                          console.log(response.error_message + ' 查询失败');
                      }
                  })
                  .catch(function(e){
                      console.log(user_info.name + ' 查询失败');
                  });
          }

      };

       $scope.query_detail = function(market_config, user_info) {
           $http.post('/users/detail_query', JSON.stringify({
               market : market_config,
               user : user_info
           }))
               .success(function (response) {
                   if(response.return_code == 0){
                       user_info.product_amount = response.max;
                   }
                   else {
                       console.log(response.error_message + ' 查询失败');
                   }
               })
               .catch(function(e){
                   console.log(user_info.name + ' 查询失败');
               });
       };

        $scope.order = function(market_config, user_info){
            $http.post('/users/order', JSON.stringify({
                market : market_config,
                user : user_info
            }))
                .success(function (response) {
                    if(response.return_code == 0){

                        user_info.output = '抢购成功';
                    }
                    else {
                        user_info.output = '抢购失败: ' + response.error_message;
                        console.log(response.error_message + ' 抢购失败');
                    }
                })
                .catch(function(e){
                    user_info.output = '抢购失败';
                    console.log(user_info.name + ' 抢购失败');
                });
        };


        $scope.batch_order = function(market_config){
            market_config.users_info.forEach(function(userInfo){
                if(userInfo.token && userInfo.token.length>0){
                    userInfo.selected_product = userInfo.selected_product || market_config.products[0].id;
                    $scope.order(market_config, userInfo);
                }
            })
        };
        $scope.batch_query = function(market_config){
            market_config.users_info.forEach(function(userInfo){
                if(userInfo.token && userInfo.token.length>0) {
                    $scope.query(market_config, userInfo);
                }
            })
        };
    })
  .controller('MyCtrl2', ['$scope', function($scope) {

  }]);
