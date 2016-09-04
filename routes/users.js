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
  }
};

/* GET users listing. */
router.get('/', function(req, res, next) {
  //res.send('respond with a resource');
  var users = [
    //{
    //  name : '0088990076213',
    //  password : ''
    //},
    //{
    //  name : '0088304582657',
    //  password : ''
    //},
    //{
    //  name : '0088557296584',
    //  password : ''
    //},
    //{
    //  name : '0088698181154',
    //  password : ''
    //},
    //{
    //  name : '0088842559225',
    //  password : ''
    //},
    //{
    //  name : '9011709051601',
    //  password : ''
    //},
    //{
    //  name : '0088290264739',
    //  password : ''
    //},
    //{
    //  name : '0088983279301',
    //  password : ''
    //},
    //{
    //  name : '0088197823453',
    //  password : ''
    //},
    //{
    //  name : '0088595120096',
    //  password : ''
    //},
    //{
    //  name : '0088099379526',
    //  password : ''
    //},
    //{
    //  name : '0088172864171',
    //  password : ''
    //},
    //{
    //  name : '0088916037437',
    //  password : ''
    //},
    //{
    //  name : '0088005594596',
    //  password : ''
    //},
    //{
    //  name : '0088624551980',
    //  password : ''
    //},



  ]
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
          result.REC.BR = result.REC.BR || [];
          result.REC.CO_I = result.REC.CO_I || [];
          result.REC.CO_N = result.REC.CO_N || [];
          result.REC.E_D = result.REC.E_D || [];
          result.REC.S_D = result.REC.S_D || [];
          result.REC.PRC = result.REC.PRC || [];
          result.REC.QTY = result.REC.QTY || [];

          var product = {
            BR : result.REC.BR[0],
            id : result.REC.CO_I[0],
            name : result.REC.CO_N[0],
            price : result.REC.PRC[0],
            quantity : result.REC.QTY[0]
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

module.exports = router;
