const uuidv4 = require('uuid/v4');
const db = require('./queries');
const fs = require('fs');
var path = require('path');

const addData = (request, response) => {
const uuid = uuidv4(); 
let video_id;
     var fields = JSON.parse(request.body.fields);
     let author_id = fields.user_id;

     console.log(JSON.stringify(request.body))

     db.pool.query(
     	'INSERT INTO fields (title, date, description, author, type, id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *' ,
     	 [fields.title, fields.date, fields.description, fields.user_id, fields.type, uuid])
    .then(results => {
      video_id = results.rows[0].id;
      author_id = results.rows[0].author
      
  }).then(() => {
      return db.pool.query(
        'INSERT INTO video_thumbnails (path, id, author) VALUES ($1, $2, $3) RETURNING *',
        [request.files.file[0].path, video_id, author_id]);
  }).then(results => {
         console.log(results.rows)
  }).then(() => {
      return db.pool.query(
        'INSERT INTO video (path, id, author) VALUES ($1, $2, $3) RETURNING *',
        [request.files.video[0].path, video_id, author_id]);
  }).then(results => {
  	     response.status(200).send({ message: "Success: Added video" });
         console.log(results.rows)
  }).catch(error => console.log(error));

}


const getVideoByID = (request, response) => {
	const id = request.params.id;
	let fieldRows, videoRows, video_thumbnails, all;

	db.pool.query('SELECT * FROM fields WHERE id = $1', [id])
    .then( results => {
        fieldRows = results.rows;
        console.log(fieldRows);
        return db.pool.query('SELECT * FROM video WHERE id = $1', [id]);
    })
    .then( results => {
        videoRows = results.rows;
        return db.pool.query('SELECT * FROM video_thumbnails WHERE id = $1', [id]);
    } )
    .then((results) => {
       video_thumbnails = results.rows;
       all = fieldRows.concat(videoRows, video_thumbnails);
       response.status(200).json(all);
       console.log("Got Video By id")
    } ).catch(error => console.log(error));

}


const updateVideoByID = (request, response) => {
  const id = request.params.id;
  var fields = JSON.parse(request.body.fields);
  var thumbnail = request.files.file[0];
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
       return db.pool.query('SELECT * FROM video_thumbnails WHERE id = $1', 
       [id])
      }).then((result) => {
      	    console.log("result path " + result.rows[0].path)
         	fs.unlinkSync(path.join(__dirname, result.rows[0].path))
         	db.pool.query(
           'UPDATE video_thumbnails SET path = $1 WHERE id = $2', 
           [thumbnail.path, id])
            response.status(200).send({ message: "Success: PUT request successful" });
         }).catch((err) => {
     	console.log(`Error: ${err}`)
     })
}

const videoByArtistID = (request, response) => {
    const id = request.params.id;
    db.pool.query('SELECT * FROM video_thumbnails JOIN fields ON video_thumbnails.id = fields.id WHERE video_thumbnails.author = $1 ORDER BY time_added DESC', [id])
    .then((results) => {
     response.status(200).json(results.rows)
    }).catch(error => console.log("GET video by artist ID" + error));
}


const deleteVideo = (request, response) => {
  const id = request.params.id;
  console.log("id" + id)

   db.pool.query(
   	'DELETE FROM fields WHERE id = $1', 
   	[id])
   .then(() => {
   	return  db.pool.query(
   	'SELECT * FROM video WHERE id = $1', 
   	[id])
   }).then((results) => {
   	console.log("video results" + JSON.stringify(results))
   	fs.unlinkSync(path.join(__dirname, results.rows[0].path))
   	db.pool.query(
   	'DELETE FROM video WHERE id = $1', 
   	[id])
   }).then(() => {
   	return db.pool.query(
   	'SELECT * FROM video_thumbnails WHERE id = $1', 
   	[id])
   }).then((results) => {
   	console.log("video results" + JSON.stringify(results))
   	fs.unlinkSync(path.join(__dirname, results.rows[0].path))
   	db.pool.query(
   	'DELETE FROM video_thumbnails WHERE id = $1', 
   	[id])
   }).then(() => {
   	response.status(200).send({ message: "Delete successful" });
   }).catch(error => console.log(error));
}

const getAllVideos = (request, response) => {
	let type = "video"

	db.pool.query('SELECT * FROM fields JOIN video_thumbnails ON fields.id = video_thumbnails.id WHERE type = $1 ORDER BY time_added DESC',
		[type])

    .then(results => {
      response.status(200).json(results.rows)
      console.log('+SELECT * FROM albums and file INNER JOIN by id')
    }).catch(error => console.log(error));
}

const getVideoPathByID = (request, response) => {
    const id = request.params.id;

	db.pool.query('SELECT path FROM video WHERE id = $1',
		[id])

    .then(results => {
      response.status(200).json(results.rows)
      console.log('+SELECT * FROM albums and file INNER JOIN by id')
    }).catch(error => console.log(error));
}


module.exports = {
  addData,
  getVideoByID,
  updateVideoByID,
  deleteVideo,
  videoByArtistID,
  getAllVideos,
  getVideoPathByID
}