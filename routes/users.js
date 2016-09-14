var express = require('express');
var router = express.Router();
var ZYH = require('../bin/zyh');
//var markets = require('../bin/markets');

var fs = require('fs');
var markets = JSON.parse(fs.readFileSync('../bin/serverinfo.json'));
//fs.writeFileSync('./output.json',JSON.stringify({a:1,b:2}));
//var JsonObj=JSON.parse(fs.readFileSync('./output.json'));



var pincodes = [
    //'E7D9BA98589D654C799D237B288C4D6E9187065395458459523', // QQ 16832251
    //'ozGwruLoMDDdbk7RMS65lMw2TRA07140812755492777474', //wechat 16852072426
    //'saix7207009849723463628', // phone 18652072426
    '9EA194A135439EFB4D36CD979E3FFDB49187752731198561416', // QQ 3139880238 asb#1234
    '97292065AF327B32AAB12BD700A15C069188880142645998213', //  QQ 2983099879 asb#1234
    '98CE67FFC71C4288C536059F7A9033D89189663772737727187', // QQ 3469055318 asb#1234
    'AAA9C6B234520D8C1E385DBCECA9B3669190506346452764315', // QQ 210966010 asb#1234
];


/* GET users listing. */
router.get('/', function(req, res, next) {

});

router.get('/pincodes', function(req, res, next){
  res.json(pincodes);
});

router.get('/markets', function(req, res, next){
  res.json(markets);
});

router.get('/market/:market', function(req, res, next){
  //res.json(markets);
  var market_id = req.params['market'];
  var return_markets = {};
  for(var key in markets){
    if (markets[key].id == market_id){
      return_markets[key] = markets[key];
    }
  }
  res.json(return_markets);

});

router.post('/market/:market/add_users', function(req, res, next){

    var users = req.body.users || [];
    var password = req.body.password;
    var market_id = req.params['market'];

    var changed = false;
    for(var key in markets){
        if (markets[key].id == market_id){
            markets[key].users = users; // markets[key].users || [];
            markets[key].password = password;
            changed = true;
            break;
        }
    }

    if(changed){
        fs.writeFileSync('../bin/serverinfo.json',JSON.stringify(markets));
    }

    res.json();
});

//function zyh(pincode, hostname, user, password, SI)

router.post('/login', function(req, res, next){
  var market = req.body.market || {};
  var user = req.body.user || {};
  var zyh = new ZYH(market, user);
  zyh.startDeviceInfo()
      .then(zyh.checkpin)
      .then(function(session){
        zyh.session = session;
        return zyh.encryptstr();
      })
      .then(function(encryption){
        zyh.encryption = encryption;
      })
      .then(zyh.login)
      .then(function(SI){
        res.json({
          return_code : 0,
          token : SI
        })
      })
      .catch(function(error){
        //if(error.MEBS.length>0){
          error.MEBS_MOBILE = error.MEBS_MOBILE || error.MEBS;
        //}
        error.MEBS_MOBILE.REP[0].RESULT[0].MESSAGE = error.MEBS_MOBILE.REP[0].RESULT[0].MESSAGE || [];

        res.json({
          return_code : error.MEBS_MOBILE.REP[0].RESULT[0].RETCODE[0],
          error_message : error.MEBS_MOBILE.REP[0].RESULT[0].MESSAGE
        })
      })
});


router.post('/query', function(req, res, next) {
  var market = req.body.market || {};
  var user = req.body.user || {};
  var zyh = new ZYH(market, user);
  zyh.issue_commodity()
      .then(function(resultList){
        var newRsultList = [];
        resultList = resultList || [];
        resultList.forEach(function(result){
          result.REC = result.REC || [];
          result.REC[0].BR = result.REC[0].BR || [];
          result.REC[0].CO_I = result.REC[0].CO_I || [];
          result.REC[0].CO_N = result.REC[0].CO_N || [];
          result.REC[0].E_D = result.REC[0].E_D || [];
          result.REC[0].S_D = result.REC[0].S_D || [];
          result.REC[0].PRC = result.REC[0].PRC || [];
          result.REC[0].QTY = result.REC[0].QTY || [];

          var product = {
            BR : result.REC[0].BR[0],
            id : result.REC[0].CO_I[0],
            name : result.REC[0].CO_N[0],
            price : result.REC[0].PRC[0],
            quantity : result.REC[0].QTY[0]
          };
          newRsultList.push(product)
        });

        res.json({
          return_code : 0,
          product : newRsultList
        })
      })
      .catch(function(error){
        error.MEBS_MOBILE.REP[0].RESULT[0].MESSAGE = error.MEBS_MOBILE.REP[0].RESULT[0].MESSAGE || [];
        res.json({
          return_code : -1,
          error_message : error.MEBS_MOBILE.REP[0].RESULT[0].MESSAGE[0]
        })
      })
});

router.post('/detail_query', function(req, res, next) {
  var market = req.body.market || {};
  var user = req.body.user || {};
  var zyh = new ZYH(market, user);
  zyh.issue_commodity_detail(user.selected_product)
      .then(function(result){
        result.MAX_CA = result.MAX_CA || [];
        var MAX_CA = result.MAX_CA[0];
        res.json({
          return_code : 0,
          max : parseInt(MAX_CA)
        })
      })
      .catch(function(error){
        error.MEBS_MOBILE.REP[0].RESULT[0].MESSAGE = error.MEBS_MOBILE.REP[0].RESULT[0].MESSAGE || [];
        res.json({
          return_code : -1,
          error_message : error.MEBS_MOBILE.REP[0].RESULT[0].MESSAGE[0]
        })
      });
});


router.post('/order', function(req, res, next) {
  var market = req.body.market || {};
  var user = req.body.user || {};

  var selected_product = user.selected_product;
  var product_amount = user.product_amount;

  var zyh = new ZYH(market, user);

  zyh.issue_order(selected_product, product_amount)
      .then(function(result){
        res.json({
          return_code : 0,
        })
      })
      .catch(function(error){
        error.MEBS_MOBILE.REP[0].RESULT[0].MESSAGE = error.MEBS_MOBILE.REP[0].RESULT[0].MESSAGE || [];
        res.json({
          return_code : -1,
          error_message : error.MEBS_MOBILE.REP[0].RESULT[0].MESSAGE[0]
        })
      });

})




module.exports = router;
