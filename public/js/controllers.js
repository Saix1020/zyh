'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('MyCtrl1', function($scope, $http, $cookies, $location, $routeParams, $q) {

        $scope.pincodes = [
            'E7D9BA98589D654C799D237B288C4D6E9187065395458459523', // QQ 16832251
            'ozGwruLoMDDdbk7RMS65lMw2TRA07140812755492777474', //wechat 16852072426
            'saix7207009849723463628', // phone 18652072426
            '9EA194A135439EFB4D36CD979E3FFDB49187752731198561416', // QQ 3139880238 asb#1234
            '97292065AF327B32AAB12BD700A15C069188880142645998213', //  QQ 2983099879 asb#1234
            '98CE67FFC71C4288C536059F7A9033D89189663772737727187', // QQ 3469055318 asb#1234
            'AAA9C6B234520D8C1E385DBCECA9B3669190506346452764315', // QQ 210966010 asb#1234
        ];





        $scope.products = [];
        var currentLocation = $location.path();

        function get_navigations(){
            var deferred = $q.defer();
            $http.get('/users/markets')
                .success(function(markets){
                    $('#market-nav').empty();

                    $('#market-nav')
                        .append('<li id="market-' + 'all' + '"><a href="/#' + '/view1'
                        + '"><h4>' + '所有交易所' + '</h4></a></li>');

                    for(var key in markets) {
                        if(markets[key].users.length == 0){
                            continue;
                        }


                        $('#market-nav')
                            .append('<li id="market-' + markets[key].id + '"><a href="/#' + '/view1'
                            + '/' + markets[key].id + '"><h4>' + key + '</h4></a></li>');
                    }
                    deferred.resolve(markets);
                })
                .catch(function(e){
                    deferred.reject(e);
                });

            return deferred.promise;
        }



        if(currentLocation == '/view1'){
            $http.get('/users/markets')
                .success(function(markets){
                    $scope.markets = [];
                    $('#market-nav').empty();

                    $('#market-nav')
                        .append('<li id="market-' + 'all' + '" class="active"><a href="/#' + currentLocation
                        + '"><h4>' + '所有交易所' + '</h4></a></li>');

                    for(var key in markets){


                        if(markets[key].users.length == 0){
                            continue;
                        }

                        markets[key].pincode = markets[key].pin
                            || $scope.pincodes[parseInt(Math.random()*1000%$scope.pincodes.length)];


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
            var market = $routeParams['market'];

            get_navigations().then(function(){
                var lis = $('#market-nav').children();
                //if(lis.length == 0){
                //    $location.path('/#/view1');
                //    return;
                //}
                lis.removeClass('active');


                $('#market-'+market).addClass('active');

                $http.get('/users/market/' + market)
                    .success(function(markets){
                        $scope.markets = [];
                        for(var key in markets) {
                            markets[key].pincode = markets[key].pin
                                ||  $scope.pincodes[parseInt(Math.random()*1000%$scope.pincodes.length)];
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
            })




        }

        $scope.login = function(market_config, user_info){
            var target = event.target;
            target.disabled = true;
            user_info.output = '';

            market_config.pin = market_config.pincode || market_config.pin;

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
                        user_info.output = '登录成功';
                    }
                    else {
                        console.log(response.error_message[0] + ' 登录失败');
                        user_info.output = response.error_message[0]
                            + (response.return_code == -1?'! 请切换 Pin' : '');
                        //alert(response.error_message[0]
                        //+ (response.return_code == -1?'! 请切换 Pin' : ''));
                    }
                    target.disabled = false;
                })
                .catch(function(e){
                    console.log(user_info.name + ' 登录失败');
                    target.disabled = false;
                })
        };

        $scope.query =  function(market_config, user_info, no_alert) {
            var target = event.target;
            user_info.output = '';

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
                            //if(!no_alert){

                            user_info.output = ' 查询失败:' + response.error_message;
                                //alert(response.error_message+ ' 查询失败');

                            //}
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
            user_info.output = '';

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

        $scope.order = function(market_config, user_info, no_alert){
            var target = event.target;
            user_info.output = '';

            target.disabled = true;
            user_info.product_amount = user_info.product_amount || 0;
            if(parseInt(user_info.product_amount) == 0 || parseInt(user_info.product_amount)==NaN){
                user_info.output = '请输入正确的抢购数量';
                target.disabled = false;

                return;
            }

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
                        user_info.output = ' 抢购失败:' + response.error_message;

                        //if(!no_alert){
                        //    alert(response.error_message+ ' 抢购失败');
                        //
                        //}

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
                    $scope.order(market_config, userInfo, true);
                }
            })
        };
        $scope.batch_query = function(market_config){
            //event.target.disabled = true;

            market_config.users_info.forEach(function(userInfo){
                if(userInfo.token && userInfo.token.length>0) {
                    $scope.query(market_config, userInfo, true);
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

    }])
    .controller('AllMarketCtl', function($scope, $http) {
        $scope.markets = [];
        $http.get('/users/markets')
            .success(function (markets) {
                for(var key in markets) {
                    markets[key].new_users = markets[key].users || [];
                    markets[key].new_password = markets[key].password || [];
                    markets[key].new_users = markets[key].new_users.join('\n');
                    $scope.markets.push({
                        name: key,
                        config: markets[key]
                    });
                }
            });


        $scope.save = function(market){
            //$http()
        }
    });
