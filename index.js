const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const db = require('./queries');
const album = require('./albums');
const image = require('./image-upload');
const apiCall = require('./test');
const artist = require('./artist')
const query = require('./query');
const cors = require('cors');
const port = 8000;
var multer = require('multer');


var storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'public')
	}, 
	filename: (req, file, cb) => {
		cb(null, Date.now() + '-' +file.originalname)
	}
})


var upload = multer({ storage: storage }).fields([{
           name: 'file', maxCount: 1
         }, {
           name: 'songs', maxCount: 30
         }]);

app.use(bodyParser.urlencoded({extended: true}));

app.use('/public', express.static('public'));


app.use(bodyParser.json())

app.use(cors());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
})


//SONGS ROUTES
app.get('/songs', db.getSongs)
// app.get('/albums/:album_id/songs', db.getSongsByAlbumId)
app.get('/songs/:id', db.getSongById);
// app.post('/albums/:id/songs', db.addSong)
// app.put('/songs/:id', db.updateSong)
// app.post('/albums/:id/songs', db.upsertSong)
// app.put('/songs/:id', db.upsertSong)
// app.delete('/albums/:album_id/songs/', db.deleteSong)

//ALBUMS ROUTES
// app.get('/albums', album.getAlbums)
app.get('/albums', query.getAll);
app.get('/albums/:id', query.getAllByID);
app.get('/artist/:id', artist.getArtistByID);
app.get('/artist/:id', artist.getArtistByID);
app.get('/following/:id', artist.getFollowingByUserId);
app.get('/follows/:id', artist.getFollowedByFollowerID);
app.post('/follower', artist.addFollower);
// app.get('/albums/:id/songs', apiCall.selectSongs);
// app.post('/albums/', apiCall.addData);
app.post('/albums/:id', upload, apiCall.upsertAlbum)
app.put('/albums/:id', upload, apiCall.upsertAlbum)
// app.delete('/albums/:id', album.deleteAlbum)

// app.get('/albums/:id/images', image.getImageByAlbumId)
app.post('/albums', upload, apiCall.addData);
// app.post('/upload', image.upsertImage);

// app.put('/albums', apiCall.addData);
app.delete('/albums/:id/songs', apiCall.deleteSongs);
app.delete('/albums/:id/', apiCall.deleteAll);
app.delete('/following/:id', artist.deleteFollowing);






app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})


module.exports = {
  express,
  app,
}