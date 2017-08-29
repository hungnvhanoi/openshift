//  OpenShift sample Node application
var express = require('express'),
    fs      = require('fs'),
    app     = express(),
    eps     = require('ejs'),
    morgan  = require('morgan'),
    bodyParser = require('body-parser');

Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

app.use('/img', express.static('img'));
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/favicon.ico',function(req,res){
  res.sendFile(__dirname + '/favicon.ico')
});
app.get('/search', function (req, res) {
  res.sendFile(__dirname + '/search.html');
});
app.get('/create', function (req, res) {
  res.sendFile(__dirname + '/create.html');
});
app.get('/location', function (req, res) {
  res.sendFile(__dirname + '/location.html');
});
app.get('/result', function (req, res) {
  res.sendFile(__dirname + '/result.html');
});

function remSign(txt){
  var original = txt.trim().toLowerCase();
  var noA = original.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a");
  var noE = noA.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e");
  var noI = noE.replace(/ì|í|ị|ỉ|ĩ/g,"i");
  var noO = noI.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o");
  var noU = noO.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u");
  var noY = noU.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y");
  var noD = noY.replace(/đ/g,"d")
  return noD;
}
function remSpace(txt){
  var original = txt.trim().toLowerCase();
  var noSpace = original.replace(/\s/g,"-");
  return noSpace;
}

function processSearch(fid,name,city,district,street,mayor,sickness,doctor,rating){
  var processed = {
      '_id':fid,
      'keywords':[
        name,
        city,
        district,
        street,
        mayor,
        sickness,
        doctor,
        remSign(name),
        remSign(city),
        remSign(district),
        remSign(street),
        remSign(mayor),
        remSign(sickness),
        remSign(doctor)
      ],
      'rating':rating,
      'searchRating':0,
      'url': '/'+remSpace(remSign(name)) + '-'+fid
    }
  //onsole.log(processed);
  return processed;
}

app.post('/loadSuggestions', (req, res) => {
  var searchTxt = req.body.description;
  db.collection('searchIndex').find({'keywords':searchTxt},{_id:0,'keywords':1,'url':1}).toArray(function(err, results){
    console.log(results); // output all records
    res.send(results);
});
});

app.post('/loadPlaces', (req, res) => {
  var lat = req.body.lat;
  var lng = req.body.lng;
  db.collection('locations').find({},{_id:0}).toArray(function(err, results){
    //console.log(results);
    res.send(results);
});
});

var firstMethod = function(req,res,tata) {
   var promise = new Promise(function(resolve, reject){
     db.collection('locations').insert(tata, (err, result) => {
       if (err) {
         res.send({ 'error': 'An error has occurred' });
       } else {
         res.send(result.ops[0]);
         keywords = processSearch(result.ops[0]._id,
           req.body.name,
           req.body.city,
           req.body.district,
           req.body.street,
           req.body.mayor,
           req.body.sickness,
           req.body.doctor,
           req.body.rating);
           //console.log(keywords);
           resolve(keywords);
       }
     });
        //  console.log('first method completed');
        //  resolve({data: '123'});
   });
   return promise;
};

var secondMethod = function(someStuff) {
   var promise = new Promise(function(resolve, reject){
     db.collection('searchIndex').insert(someStuff, (err, result) => {
       if (err) {
         //res.send({ 'error': 'An error has occurred' });
         console.log('error');
       } else {
        //  res.send(result.ops[0]);
         console.log('ok');
       }
     });
   });
   return promise;
};

app.post('/addPlace', (req, res) => {
  //const note = { lat: req.body.lat,lng: req.body.lng ,description: req.body.name,type: req.body.type };
  var keywords;
  var poi = { coords:{
    lat: Number(req.body.lat),
    lng: Number(req.body.lng)},
    name: req.body.name,
    iconImage: req.body.type,
    city: req.body.city,
    district: req.body.district,
    street: req.body.street,
    mayor: req.body.mayor,
    sickness: req.body.sickness,
    phone: req.body.phone,
    price: req.body.price,
    doctor: req.body.doctor,
    overtime: req.body.overtime,
    rating: req.body.rating
  };
  if (!db) {
    initDb(function(err){});
  }
  firstMethod(req,res,poi).then(secondMethod);
});

// app.post('/loadSuggestions', (req, res) => {
//   var searchTxt = req.body.description;
//   db.collection('locations').find({'description':searchTxt},{_id:0,'description':1}).toArray(function(err, results){
//     console.log(results); // output all records
//     res.send(results);
//   });
// });
//
// app.post('/loadPlaces', (req, res) => {
//   var lat = req.body.lat;
//   var lng = req.body.lng;
//   db.collection('locations').find({},{_id:0}).toArray(function(err, results){
//     console.log(results); // output all records
//     res.send(results);
//   });
// });
//
// app.post('/addPlace', (req, res) => {
//   //const note = { lat: req.body.lat,lng: req.body.lng ,description: req.body.name,type: req.body.type };
//   const poi = { coords:{
//     lat: Number(req.body.lat),
//     lng: Number(req.body.lng)},
//     name: req.body.name,
//     iconImage: req.body.type,
//     city: req.body.city,
//     district: req.body.district,
//     street: req.body.street,
//     mayor: req.body.mayor,
//     sickness: req.body.sickness,
//     phone: req.body.phone,
//     price: req.body.price,
//     doctor: req.body.doctor,
//     overtime: req.body.overtime,
//     rating: req.body.rating
//   };
//   if (!db) {
//     initDb(function(err){});
//   }
//   db.collection('locations').insert(poi, (err, result) => {
//     if (err) {
//       res.send({ 'error': 'An error has occurred' });
//     } else {
//       res.send(result.ops[0]);
//       console.log(req.body);
//     }
//   });
// });

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  // if (!db) {
  //   initDb(function(err){});
  // }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    //col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      //res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
      res.render('index.html', { pageCountMessage : null});
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  // if (!db) {
  //   initDb(function(err){});
  // }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
