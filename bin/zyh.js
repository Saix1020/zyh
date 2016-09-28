/**
 * Created by saix on 16/9/2.
 */


var Promise = require("promise");
var PromiseSeries = require('promise-series');
var xml2js = require("xml2js");
var http = require("http");
var jsonxml = require('jsontoxml');
var iconv = require('iconv-lite');
var uuid = require('node-uuid');
var uuid_list = require('../bin/uuid_list');
uuid_list = uuid_list || [];
var uuid_index = 0;
var uuid_length = uuid_list.length;
var user_agent = "宗易汇/2.0.6.1 CFNetwork/758.4.3 Darwin/15.5.0";

var markets = {
    '安贵' : {
        id : 89,
        ip : '180.168.67.10',
        port : 15930,
        path : '/Issue4ariesMobileServer/communicateServlet'
    }
};

function zyh(/*pincode, hostname, user, password, SI*/market, user)
{
    market = market || {};
    user = user || {};
    this.pincode = market.pin;
    this.deviceId = 'i' + uuid_list[(uuid_index++)%uuid_length];
    //this.hostname = hostname;
    this.user = user.name;
    this.password = user.password;
    this.marketId = market.id;//markets[hostname].id;
    this.marketIp = market.ip;//markets[hostname].ip;
    this.marketPort = market.port;//markets[hostname].port;
    this.marketPath = market.path;//markets[hostname].path;

    this.session = '';
    this.encryption = '';
    this.SI = user.token;

    function formatResult(result)
    {
        result.MEBS = result.MEBS || {};
        result.MEBS.REP = result.MEBS.REP || [];
        result.MEBS.REP[0].RESULT = result.MEBS.REP[0].RESULT || [];
        result.MEBS.REP[0].RESULT[0].RETCODE = result.MEBS.REP[0].RESULT[0].RETCODE || [];
    }

    function getReturnCode(result)
    {
        formatResult(result);
        var returnCode = result.MEBS.REP[0].RESULT[0].RETCODE[0];

        return '' + returnCode;
    }

    function formatMobileResult(result){
        result.MEBS_MOBILE = result.MEBS_MOBILE || {};
        result.MEBS_MOBILE.REP = result.MEBS_MOBILE.REP || [];
        result.MEBS_MOBILE.REP[0].RESULT = result.MEBS_MOBILE.REP[0].RESULT || [];
        result.MEBS_MOBILE.REP[0].RESULT[0].RETCODE = result.MEBS_MOBILE.REP[0].RESULT[0].RETCODE || [];

    }
    function getMobileReturnCode(result)
    {
        formatMobileResult(result);
        var returnCode = result.MEBS_MOBILE.REP[0].RESULT[0].RETCODE[0];

        return '' + returnCode;
    }


    function MEBSHttpRequest(bodyString, resultCheck){

        resultCheck = resultCheck || function(result, resolve, reject){
                var returnCode = getReturnCode(result);
                if(returnCode.indexOf('-') == 0){
                    reject(result);
                }
                else {
                    resolve(returnCode);
                }
            };

        var headers = {
            'Content-Type': 'text/xml',
            'Content-Length': bodyString.length,
            'User-Agent' : user_agent
        };
        var options = {
            host: 'm.zongyihui.cn',
            port: 30200,
            path: '/nuclear/communicateServlet',
            method: 'POST',
            headers: headers
        };

        return new Promise(function(resolve, reject){
            var req = http.request(options, function(res) {

                //res.setEncoding('utf-8');
                var responseString = '';
                var chunks = [];

                res.on('data', function (data) {
                    responseString += data;
                    chunks.push(data);
                });

                res.on('end', function () {
                    //console.log(iconv.decode(responseString, 'gbk'));
                    var decodedBody = iconv.decode(Buffer.concat(chunks), 'gbk');
                    console.log(decodedBody);

                    xml2js.parseString(decodedBody, function (err, result) {
                        formatResult(result);
                        resultCheck(result, resolve, reject);
                    });
                });
            });
            req.on('error', function(e) {
                console.log('-----error-------',e);
                reject(e);
            });
            console.log(bodyString);
            req.write(bodyString);
            req.end();
        });
    }

    this.weixinlogon = function(code){
        var xml = jsonxml({
            MEBS_MOBILE:[
                { name : 'REQ', attrs:{name:'weixinlogon'}, children:[
                    {name : 'DEVICEID', text : 'iBD2F32C5-BBFD-4F7D-A465-51ACA0C5A7DC'},
                    {name : 'CODE', text : code},
                    {name : 'MARKETID', text : '-1'},
                ]}
            ]
        });
        return MEBSHttpRequest(xml);

    }

    this.startDeviceInfo = function(){
        var xml = jsonxml({
            MEBS_MOBILE:[
                { name : 'REQ', attrs:{name:'startdeviceinfo'}, children:[
                    {name : 'DEVICEID', text : this.deviceId},
                    {name : 'DEVICETYPE', text : '1'},
                    {name : 'MARKETID', text : '-1'},
                    {name : 'MODEL', text : 'iPhone 6'},
                    {name : 'BRAND', text : 'iPhone'},
                    {name : 'NETWORKTYPE', text : 'WiFi'},
                    {name : 'NETPROVIDER', text : 'CMCC'},
                    {name : 'TOKEN', text : 'd488014c06b11e578321b9d6f3bbd0d16d5e675ca6068d140ce89dfe67cd27e4'},
                    {name : 'PINSCODE', text : this.pincode}
                ]}
            ]
        });

        return MEBSHttpRequest(xml);
    }.bind(this);

    this.checkpin = function(){
        var xml = jsonxml({
            MEBS_MOBILE:[
                { name : 'REQ', attrs:{name:'checkpins'}, children:[
                    {name : 'PINSCODE', text : this.pincode},
                    {name : 'DEVICEID', text : this.deviceId}
                ]}
            ]
        });

        return MEBSHttpRequest(xml);
    }.bind(this);

    this.encryptstr = function(){
        var xml = jsonxml({
            MEBS_MOBILE:[
                { name : 'REQ', attrs:{name:'encryptstr'}, children:[
                    {name : 'PINSCODE', text : this.pincode},
                    {name : 'SESSIONID', text : this.session},
                    {name : 'MARKETID', text : this.marketId},
                    {name : 'TRADERID', text : this.user},
                    {name : 'PASSWORD', text : this.password}
                ]}
            ]
        });
        return MEBSHttpRequest(xml, function(result, resolve, reject){
            var returnCode = getReturnCode(result);
            if(returnCode.indexOf('-') == 0){
                reject(result);
            }
            else {
                result.MEBS.REP[0].RESULT[0].ENCRYPTION = result.MEBS.REP[0].RESULT[0].ENCRYPTION || [];
                var ENCRYPTION = result.MEBS.REP[0].RESULT[0].ENCRYPTION[0];
                if(ENCRYPTION.length > 0){
                    resolve(ENCRYPTION);
                }
                else {
                    reject(result);
                }
            }
        });
    };


    function MEBSMOBILEHttpRequest(bodyString, resultCheck){

        resultCheck = resultCheck || function(result, resolve, reject){
                var returnCode = getMobileReturnCode(result);
                if(returnCode.indexOf('-') == 0){
                    reject(result);
                }
                else {
                    resolve(returnCode);
                }
            };

        var headers = {
            'Content-Type': 'text/xml',
            'Content-Length': bodyString.length,
            'User-Agent' : user_agent
        };
        var options = {
            host: this.marketIp,
            port: this.marketPort,
            path: this.marketPath,
            method: 'POST',
            headers: headers
        };

        return new Promise(function(resolve, reject){
            var req = http.request(options, function(res) {
                //res.setEncoding('utf-8');
                var responseString = '';
                var chunks = [];

                res.on('data', function (data) {
                    responseString += data;
                    chunks.push(data);
                });

                res.on('end', function () {
                    var decodedBody = iconv.decode(Buffer.concat(chunks), 'gbk');
                    console.log(decodedBody);
                    xml2js.parseString(decodedBody, function (err, result) {
                        formatMobileResult(result);
                        resultCheck(result, resolve, reject);
                    });
                });
            });
            req.on('error', function(e) {
                console.log('-----error-------',e);
                reject(e);
            });
            console.log(bodyString);
            req.write(bodyString);
            req.end();
        });
    }

    this.login = function(){
        var xml = jsonxml({
            MEBS_MOBILE:[
                { name : 'REQ', attrs:{name:'user_login'}, children:[
                    {name : 'U', text : this.user},
                    {name : 'PASSWORD', text : this.password},
                    {name : 'IC', text : this.encryption},
                    {name : 'RANDOM_KEY', text:''}
                ]}
            ]
        });
        return MEBSMOBILEHttpRequest.call(this, xml);
    }.bind(this);

    this.issue_commodity = function(SI){
        this.SI = SI || this.SI;
        var xml = jsonxml({
            MEBS_MOBILE:[
                { name : 'REQ', attrs:{name:'issue_commodity'}, children:[
                    {name : 'U', text : this.user},
                    {name : 'CI', text : ''},
                    {name : 'S_I', text : this.SI}
                ]}
            ]
        });

        return MEBSMOBILEHttpRequest.call(this, xml, function(result, resolve, reject){
            formatMobileResult(result);
            var returnCode = getMobileReturnCode(result);
            if(returnCode.indexOf('-') == 0){
                reject(result);
            }
            else {
                result.MEBS_MOBILE.REP[0].RESULTLIST = result.MEBS_MOBILE.REP[0].RESULTLIST || [];
                var resultLists = result.MEBS_MOBILE.REP[0].RESULTLIST;
                resolve(resultLists);
            }
        });
    }.bind(this);

    this.issue_commodity_detail = function(productId){
        var xml = jsonxml({
            MEBS_MOBILE:[
                { name : 'REQ', attrs:{name:'issue_commodity_detail'}, children:[
                    {name : 'U', text : this.user},
                    {name : 'C_I', text : productId},
                    {name : 'S_I', text : this.SI}
                ]}
            ]
        });

        return MEBSMOBILEHttpRequest.call(this, xml, function(result, resolve, reject){
            var returnCode = getMobileReturnCode(result);
            if(returnCode.indexOf('-') == 0){
                reject(result);
            }
            else {
                resolve(result.MEBS_MOBILE.REP[0].RESULT[0]);
            }
        });
    };

    this.issue_order = function(productId, productAmount){
        var xml = jsonxml({
            MEBS_MOBILE:[
                { name : 'REQ', attrs:{name:'issue_order'}, children:[
                    {name : 'U', text : this.user},
                    {name : 'C_I', text : productId},
                    {name : 'I_QTY', text : productAmount},
                    {name : 'S_I', text : this.SI}
                ]}
            ]
        });

        return MEBSMOBILEHttpRequest.call(this, xml);
    }.bind(this);


    this.allmarket = function(pin, session) {
        pin = pin || this.pincode;
        session = session || this.session;

        var xml = jsonxml({
            MEBS_MOBILE:[
                { name : 'REQ', attrs:{name:'allmarket'}, children:[
                    {name : 'PINSCODE', text : pin},
                    {name : 'SESSIONID', text : session},
                    {name : 'MARKETID', text : -1}
                ]}
            ]
        });

        return MEBSHttpRequest(xml, function(result, resolve, reject) {
            var returnCode = getReturnCode(result);
            if (returnCode.indexOf('-') == 0) {
                reject(result);
            }
            else {
                result.MEBS.REP[0].RESULTLIST = result.MEBS.REP[0].RESULTLIST || [];
                result.MEBS.REP[0].RESULTLIST[0].REC = result.MEBS.REP[0].RESULTLIST[0].REC || [];
                var markets = result.MEBS.REP[0].RESULTLIST[0].REC;
                resolve(markets);
            }
        });

    }.bind(this);

    this.tradeserverinfo = function(pin, session, marketId, marketName) {
        pin = pin || this.pincode;
        session = session || this.session;

        var xml = jsonxml({
            MEBS_MOBILE:[
                { name : 'REQ', attrs:{name:'tradeserverinfo'}, children:[
                    {name : 'PINSCODE', text : pin},
                    {name : 'SESSIONID', text : session},
                    {name : 'MARKETID', text : marketId},
                    {name : 'TRADEMODELID', text : 1}
                ]}
            ]
        });

        return MEBSHttpRequest(xml, function(result, resolve, reject) {
            var returnCode = getReturnCode(result);
            if (returnCode.indexOf('-') == 0) {
                resolve(null);
            }
            else {
                result.MEBS.REP[0].RESULTLIST = result.MEBS.REP[0].RESULTLIST || [];
                result.MEBS.REP[0].RESULTLIST[0].REC = result.MEBS.REP[0].RESULTLIST[0].REC || [];
                var markets = result.MEBS.REP[0].RESULTLIST[0].REC;
                resolve(markets);
            }
        });
    }

}

//var pincode = 'ozGwruLoMDDdbk7RMS65lMw2TRA07140812755492777474';
//var hostname = '安贵';
//var user = '0088099379526';
//var password = 'clj831011';
//
//var zyh = new zyh(pincode, hostname, user, password);
//zyh.checkpin().then(function(session){
//    zyh.session = session;
//    return zyh.encryptstr();
//})
//    .then(function(encryption){
//        zyh.encryption = encryption;
//    })
//    .then(zyh.login)
//    .then(zyh.issue_commodity)
//    .catch(function(e){
//        console.log(e);
//    });

module.exports = zyh;


//var fs = require('fs');
//var path = require('path');
//var zyh = new zyh();
//var series = new PromiseSeries();
//var output = '';
//
//zyh.allmarket('saix7207009849723463628', '9125488089198004672')
//    .then(function(markets){
//        markets.forEach(function(market, index){
//
//            market = market || {};
//
//            var id = market.ID;
//            id = id || [];
//            id = id[0];
//
//            var name = market.NAME;
//            name = name || [];
//            name = name[0];
//
//            var isShow = market.ISSHOW;
//            isShow = isShow || [];
//            isShow = isShow[0];
//
//            console.log('Id: ' + id + ' Name: ' + name + ' IsShow: ' + isShow);
//            console.log(['ID', 'NAME', 'URL'].join('\t'));
//            if(isShow === 'Y'){
//                series.add(function () {
//                    return zyh.tradeserverinfo('saix7207009849723463628', '9125488089198004672', id)
//                        .then(function(servers){
//                            servers = servers || [];
//                            var server = servers[0];
//                            server = server || {};
//                            var url = server.TRADEURL;
//                            url = url || [];
//                            url = url[0];
//                            console.log([id, name, url].join('\t'));
//                            output += [id, name, url].join('\t') + '\n';
//                        });
//                });
//            }
//
//
//
//        });
//        series.run().then(function(){
//            console.log(output);
//        });
//    });


//zyh.tradeserverinfo('saix7207009849723463628', '9122363133991593542', '89')
//.then(function(servers){
//        servers = servers || [];
//        var server = servers[0];
//        server = server || {};
//        var url = server.TRADEURL;
//        url = url || [];
//        url = url[0];
//        console.log('tradeurl: ' + url);
//    });



