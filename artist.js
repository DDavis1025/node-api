const db = require('./queries');
const fs = require('fs');
var path = require('path');

const getArtistByID = (request, response) => {
	const id = request.params.id;
    db.pool.query('SELECT * FROM albums JOIN file ON albums.id = file.album_id WHERE author = $1', [id])
    .then(results => {
      response.status(200).json(results.rows)
      console.log('+ SELECT for artists')
    }).catch(error => console.log(error));
}

const addFollower = (request, response) => {
    db.pool.query('INSERT INTO user_followers (user_id, follower_id) VALUES ($1, $2) RETURNING *' , [request.body.user_id, request.body.follower_id])
    .then(results => {
      console.log(`results.rows ${JSON.stringify(results.rows)}`)
      console.log(`request.body ${JSON.stringify(request.body)}`)
      response.status(200).send({ message: `Success: Added Follower ${JSON.stringify(results.rows)}`});
    }).catch(error => console.log(error));

}

const getFollowingByUserId = (request, response) => {
	const id = request.params.id;

	db.pool.query('SELECT user_id FROM user_followers WHERE follower_id = $1', [id])
    .then(results => {
      response.status(200).json(results.rows)
      console.log(`SELECT user_id FROM user_followers WHERE follower_id = ${id}`)
    }).catch(error => console.log(error));
}

const getFollowedByFollowerID = (request, response) => {
	const id = request.params.id;

	db.pool.query('SELECT follower_id FROM user_followers WHERE user_id = $1', [id])
    .then(results => {
      response.status(200).json(results.rows)
      console.log(`SELECT follower_id FROM user_followers WHERE user_id = ${id}`)
    }).catch(error => console.log(error));
}

const deleteFollowing = (request, response) => {
  const id = request.params.id;
  
  db.pool.query('DELETE FROM user_followers WHERE user_id = $1', [id])
 .then((result) => {
 response.status(200).send({ message: `DELETED following with id ${id}` });
    
 }).catch((err)=>{console.log(err)})
}

const uploadImage = (request, response) => {
    const { user_id } = request.body;
    console.log("request.body" + JSON.stringify(request.body))
    console.log("request.file" + JSON.stringify(request.files))
    db.pool.query(
        'INSERT INTO user_images (user_id, image_name, type, size, path) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [user_id, request.files.filename, request.files.mimetype, request.files.size, request.files.path])
      .then((res) => {
        response.status(200).send({ message: "Success: Uploaded Image" });
        console.log(`Success: Uploaded User Image + ${res.rows}`)

      }).catch(error => console.log(error));
    
}



const upsertUserImage = (request, response) => {
    const { user_id } = request.body;
    console.log("request.body" + JSON.stringify(request.body))
    console.log("request.file" + JSON.stringify(request.files))
    console.log("request.file" + JSON.stringify(request.files.file[0].path))
    let picture_path = request.files.file[0].path

    db.pool.query('SELECT * FROM user_images WHERE user_id = $1', 
    [user_id])
    .then((res) => {
        if (res.rowCount > 0) {
          console.log("res.rows" + JSON.stringify(res.rows))
          console.log("request.file.path" + JSON.stringify(request.files.path))
          Promise.resolve().then(()=> {
          let picture_path = res.rows[0].path
          fs.unlinkSync(path.join(__dirname, picture_path))
          }).then(()=> {
          db.pool.query('UPDATE user_images SET user_id = $1, image_name = $2, type = $3, size = $4, path = $5 WHERE user_id = $1', 
          [user_id, request.files.file[0].filename, request.files.file[0].mimetype, request.files.file[0].size, request.files.file[0].path])
          .then((res) => {
          response.status(200).send({ message: "Success: Updated Image" });
          console.log(`Success: Updated User Image + ${res.rows}`)
       }).catch(error => console.log(error));
       })
        } else {
            db.pool.query(
            'INSERT INTO user_images (user_id, image_name, type, size, path) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user_id, request.files.file[0].filename, request.files.file[0].mimetype, request.files.file[0].size, request.files.file[0].path])
            .then((res) => {
            response.status(200).send({ message: "Success: Added Image" });
            console.log("Success: Added User Image" + JSON.stringify(request.body))
          }).catch(error => console.log(error));
      }
    }).catch(error => console.log(error));
    
}


const getUserImageByID = (request, response) => {
  const id = request.params.id;
    db.pool.query('SELECT * FROM user_images WHERE user_id = $1', [id])
    .then(results => {
      response.status(200).json(results.rows)
      console.log('Got user image path by id')
    }).catch(error => console.log(error));
}

module.exports = {
   getArtistByID,
   addFollower,
   getFollowingByUserId,
   getFollowedByFollowerID,
   uploadImage,
   upsertUserImage,
   getUserImageByID,
   deleteFollowing
}