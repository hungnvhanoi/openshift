//  OpenShift sample Node application
const express = require('express');
const fs      = require('fs');
const app     = express();
const eps     = require('ejs');
const morgan  = require('morgan');
const bodyParser = require('body-parser');

Object.assign=require('object-assign')

app.use('/img', express.static('img'));
app.use(bodyParser.urlencoded({ extended: true }));
app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'));
app.get('/favicon.ico',function(req,res){
  res.sendFile(__dirname + '/favicon.ico')
});

app.get('/location.html', function (req, res) {
  res.sendFile(__dirname + '/location.html');
});

app.get('/search.html', function (req, res) {
  res.sendFile(__dirname + '/search.html');
});

app.post('/loadSuggestions', (req, res) => {
  var searchTxt = req.body.description;
  db.collection('locations').find({'description':searchTxt},{_id:0,'description':1}).toArray(function(err, results){
    console.log(results); // output all records
    res.send(results);
});
});

app.post('/loadPlaces', (req, res) => {
  var lat = req.body.lat;
  var lng = req.body.lng;
  db.collection('locations').find({},{_id:0},['lat','lng']).toArray(function(err, results){
    console.log(results); // output all records
    res.send(results);
});
});

app.post('/addPlace', (req, res) => {
  //const note = { lat: req.body.lat,lng: req.body.lng ,description: req.body.name,type: req.body.type };
  const note = { coords:{lat: Number(req.body.lat),lng: Number(req.body.lng)} ,description: req.body.name,iconImage: req.body.type };
  if (!db) {
    initDb(function(err){});
  }
  db.collection('locations').insert(note, (err, result) => {
    if (err) {
      res.send({ 'error': 'An error has occurred' });
    } else {
      res.send(result.ops[0]);
      console.log(req.body);
    }
  });
});

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";
//mongodb://clinicApp:123qwe@ds023463.mlab.com:23463/clinicdb
if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + 'ds023463.mlab.com:23463/clinicdb'],
      mongoPort = process.env[mongoServiceName + 23463],
      mongoDatabase = process.env[mongoServiceName + 'clinicdb'],
      mongoPassword = process.env[mongoServiceName + '123qwe']
      mongoUser = process.env[mongoServiceName + 'clinicApp'];

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
if (!db) {
  initDb(function(err){});
}
 if (db) {
   var col = db.collection('counts');
   // Create a document with request IP and current time of request
   col.insert({ip: req.ip, date: Date.now()});
   col.count(function(err, count){
     res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
   });
 } else {
   res.render('index.html', { pageCountMessage : null});
 }
});

app.get('/pagecount', function (req, res) {
 // try to initialize the db on every request if it's not already
 // initialized.
 if (!db) {
   initDb(function(err){});
 }
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
