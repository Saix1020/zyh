'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('MyCtrl1', function($scope, $http, $cookies, $location, $routeParams) {
        $scope.products = [];
        var currentLocation = $location.path()
        if(currentLocation == '/view1'){
            $http.get('/users/markets')
                .success(function(markets){
                    $scope.markets = [];
                    $('#market-nav').empty();

                    $('#market-nav')
                        .append('<li id="market-' + 'all' + '" class="active"><a href="/#' + currentLocation
                        + '"><h4>' + '所有交易所' + '</h4></a></li>');

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

                        $('#market-nav')
                            .append('<li id="market-' + markets[key].id + '"><a href="/#' + currentLocation
                            + '/' + markets[key].id + '"><h4>' + key + '</h4></a></li>');

                    }

                });
        }
        else {

            var lis = $('#market-nav').children();
            if(lis.length == 0){
                $location.path('/#/view1');
                return;
            }
            lis.removeClass('active');

            var market = $routeParams['market'];

            $('#market-'+market).addClass('active');

            $http.get('/users/market/' + market)
                .success(function(markets){
                    $scope.markets = [];
                    for(var key in markets) {
                        $scope.markets.push({
                            name: key,
                            config: markets[key]
                        });
                        markets[key].users_info = [];
                        markets[key].users = markets[key].users || [];
                        markets[key].users.forEach(function (user) {
                            markets[key].users_info.push({
                                name: user,
                                password: markets[key].password,
                                token: $cookies.get('' + markets[key].id + '.' + user)
                            })
                        })
                    }
                });

        }

        $scope.login = function(market_config, user_info){
            var target = event.target;
            target.disabled = true;
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
                    target.disabled = false;
                })
                .catch(function(e){
                    console.log(user_info.name + ' 登录失败');
                    target.disabled = false;
                })
        };

        $scope.query =  function(market_config, user_info) {
            var target = event.target;

            target.disabled = true;

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
                            if(market_config.products.length == 0){
                                target.disabled = false;
                                return;
                            }
                            market_config.users_info.forEach(function(userInfo) {
                                userInfo.selected_product = response.product[0].id;
                            });
                            $scope.query_detail(market_config, user_info);

                            //market_config.products.push({
                            //    id : 123456,
                            //    name : 'test'
                            //})
                        }
                        else {
                            console.log(response.error_message + ' 查询失败');
                        }
                        target.disabled = false;

                    })
                    .catch(function(e){
                        console.log(user_info.name + ' 查询失败');
                        target.disabled = false;

                    });
            }

        };

        $scope.query_detail = function(market_config, user_info) {
            var target = event.target;

            target.disabled = true;

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
                        user_info.output = response.error_message;
                    }
                    target.disabled = false;

                })
                .catch(function(e){
                    user_info.output = user_info.name + ' 查询失败';
                    console.log(user_info.name + ' 查询失败');
                    target.disabled = false;

                });
        };

        $scope.order = function(market_config, user_info){
            var target = event.target;

            target.disabled = true;

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
                    target.disabled = false;

                })
                .catch(function(e){
                    user_info.output = '抢购失败';
                    console.log(user_info.name + ' 抢购失败');
                    target.disabled = false;

                });
        };


        $scope.batch_order = function(market_config){
            //event.target.disabled = true;

            market_config.users_info.forEach(function(userInfo){
                if(userInfo.token && userInfo.token.length>0){
                    userInfo.selected_product = userInfo.selected_product || market_config.products[0].id;
                    $scope.order(market_config, userInfo);
                }
            })
        };
        $scope.batch_query = function(market_config){
            //event.target.disabled = true;

            market_config.users_info.forEach(function(userInfo){
                if(userInfo.token && userInfo.token.length>0) {
                    $scope.query(market_config, userInfo);
                }
            })
        };

        $scope.choosed_product = function(product, market_config){

            market_config.products.forEach(function(product){
                var id = product.id;
                $('#product-'+id).css({
                    "border-color": "#DDDDDD",
                        "border-width":"1px",
                        "border-style":"solid"
                });
            });
            $('#product-'+product.id).css({
                "border-color": "#00FF00",
                "border-width":"4px",
                "border-style":"solid"
            });

            market_config.users_info.forEach(function(userInfo) {
                userInfo.selected_product = product.id;
                //$scope.batch_query(market_config);
            });

        }


    })
    .controller('MyCtrl2', ['$scope', function($scope) {

    }]);
