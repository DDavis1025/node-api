const uuidv4 = require('uuid/v4');
const db = require('./queries');
const fs = require('fs');
var path = require('path');

const addData = (request, response) => {
const uuid = uuidv4(); 
let track_id;
     var fields = JSON.parse(request.body.fields);
     let author_id = fields.user_id;

     console.log(JSON.stringify(request.body))

     db.pool.query(
     	'INSERT INTO fields (title, date, description, author, type, id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *' ,
     	 [fields.title, fields.date, fields.description, fields.user_id, fields.type, uuid])
    .then(results => {
      track_id = results.rows[0].id;
      
  }).then(() => {
      return db.pool.query(
        'INSERT INTO track (path, id, author) VALUES ($1, $2, $3) RETURNING *',
        [request.files.track[0].path, track_id, author_id]);
  }).then(results => {
         console.log(results.rows)
  }).then(() => {
      return db.pool.query(
        'INSERT INTO track_images (path, id, author) VALUES ($1, $2, $3) RETURNING *',
        [request.files.file[0].path, track_id, author_id]);
  }).then(results => {
  	     response.status(200).send({ message: "Success: Added track" });
         console.log(results.rows)
  }).catch(error => console.log(error));

}


const getTrackByID = (request, response) => {
  const id = request.params.id;
  let fieldRows, trackRows, track_images, all;

  db.pool.query('SELECT * FROM fields WHERE id = $1', [id])
    .then( results => {
        fieldRows = results.rows;
        console.log(fieldRows);
        return db.pool.query('SELECT * FROM track WHERE id = $1', [id]);
    })
    .then( results => {
        trackRows = results.rows;
        return db.pool.query('SELECT * FROM track_images WHERE id = $1', [id]);
    })
    .then((results) => {
       track_images = results.rows;
       all = fieldRows.concat(trackRows, track_images);
       response.status(200).json(all);
       console.log("Got Track By id")
    }).catch(error => console.log(error));

}


const updateTrackByID = (request, response) => {
  const id = request.params.id;
  var fields = JSON.parse(request.body.fields);
  var image = request.files.file[0];
  db.pool.query('SELECT * FROM fields WHERE title = $1 AND date = $2 AND description = $3 AND id = $4', 
    [fields.title, fields.date, fields.description, id])
     .then((result)=> {
        if (result.rowCount > 0){
           console.log("fields result.rowCount > 0")
         } else {
           console.log("update fields")
           db.pool.query(
          'UPDATE fields SET title = $1, date = $2, description = $3 WHERE id = $4', 
           [fields.title, fields.date, fields.description, id])
         }
     }).then(() => {
       return db.pool.query('SELECT * FROM track_images WHERE id = $1', 
       [id])
      }).then((result) => {
          console.log("result path " + result.rows[0].path)
          fs.unlinkSync(path.join(__dirname, result.rows[0].path))
          db.pool.query(
           'UPDATE track_images SET path = $1 WHERE id = $2', 
            [image.path, id])
            response.status(200).send({ message: "Success: PUT request successful" });
         }).catch((err) => {
      console.log(`Error: ${err}`)
     })
}

const trackByArtistID = (request, response) => {
    const id = request.params.id;
    db.pool.query('SELECT * FROM track_images JOIN fields ON track_images.id = fields.id WHERE track_images.author = $1 ORDER BY time_added DESC', [id])
    .then((results) => {
     response.status(200).json(results.rows)
    }).catch(error => console.log("GET video by artist ID" + error));
}

const deleteTrack = (request, response) => {
  const id = request.params.id;

   db.pool.query(
    'DELETE FROM fields WHERE id = $1', 
    [id])
   .then(() => {
    return  db.pool.query(
    'SELECT * FROM track WHERE id = $1', 
    [id])
   }).then((results) => {
    fs.unlinkSync(path.join(__dirname, results.rows[0].path))
    db.pool.query(
    'DELETE FROM track WHERE id = $1', 
    [id])
   }).then(() => {
    return db.pool.query(
    'SELECT * FROM track_images WHERE id = $1', 
    [id])
   }).then((results) => {
    fs.unlinkSync(path.join(__dirname, results.rows[0].path))
    db.pool.query(
    'DELETE FROM track_images WHERE id = $1', 
    [id])
   }).then(() => {
    response.status(200).send({ message: "Delete successful" });
   }).catch(error => console.log(error));
}


const getAllTracks = (request, response) => {
  let type = "track"

  db.pool.query('SELECT * FROM fields JOIN track_images ON fields.id = track_images.id WHERE type = $1 ORDER BY time_added DESC',
    [type])

    .then(results => {
      response.status(200).json(results.rows)
      console.log('+SELECT * FROM albums and file INNER JOIN by id')
    }).catch(error => console.log(error));
}


const trackPathAndImageByID = (request, response) => {
    const id = request.params.id;
    let trackPathRows, trackImagesRows, all;

  db.pool.query('SELECT path FROM track WHERE id = $1',
    [id])
  .then((result)=> {
    trackPathRows = result.rows
    return db.pool.query('SELECT path FROM track_images WHERE id = $1',
    [id])
  }).then((result)=> {
    trackImagesRows = result.rows
  }).then(() => {
      all = trackPathRows.concat(trackImagesRows);
      response.status(200).json(all);
    }).catch(error => console.log(error));
}




module.exports = {
  addData,
  getTrackByID,
  updateTrackByID,
  deleteTrack,
  trackByArtistID,
  getAllTracks,
  trackPathAndImageByID
}