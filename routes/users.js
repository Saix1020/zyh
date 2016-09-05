var express = require('express');
var router = express.Router();
var ZYH = require('../bin/zyh');
var markets = {
  '安贵' : {
    id : 89,
    ip : '180.168.67.10',
    port : 15930,
    path : '/Issue4ariesMobileServer/communicateServlet',
    pin : 'ozGwruLoMDDdbk7RMS65lMw2TRA07140812755492777474',
    users : [
      '0088990076213',
      '0088304582657',
      '0088557296584',
      '0088698181154',
      '0088842559225',
      '9011709051601',
      '0088290264739',
      '0088983279301',
      '0088197823453',
      '0088595120096',
      '0088099379526',
      '0088172864171',
      '0088916037437',
      '0088005594596',
      '0088624551980'
    ],
    password : 'clj831011'
  },
  '河北邮币卡' : {
    id : 87,
    ip : '123.59.182.105',
    port : 16855,
    path : '/Issue4ariesMobileServer/communicateServlet',
    pin : 'saix7207009849723463628',
    users : [
      '1707903339',
      '1707903341',
      '1707903342',
      '1707903343',
      '1707903344',
      '1707903345'
    ],
    password : 'clj831011'
  }
};

/* GET users listing. */
router.get('/', function(req, res, next) {

});

router.get('/markets', function(req, res, next){
  res.json(markets);
});

//function zyh(pincode, hostname, user, password, SI)

router.post('/login', function(req, res, next){
  var market = req.body.market || {};
  var user = req.body.user || {};
  var zyh = new ZYH(market, user);
  zyh.checkpin()
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
        res.json({
          return_code : -1,
          error_message : error
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
        res.json({
          return_code : -1,
          error_message : error
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
        res.json({
          return_code : -1,
          error_message : error
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
        res.json({
          return_code : -1,
          error_message : error.MEBS_MOBILE.REP[0].RESULT[0].MESSAGE[0]
        })
      });

})

module.exports = router;
