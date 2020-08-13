const db = require('./queries');
var comments = require('./comments');


const getAll = (request, response) => {

	db.pool.query('SELECT * FROM albums JOIN file ON albums.id = file.album_id ORDER BY time_added DESC')
    .then(results => {
      response.status(200).json(results.rows)
    }).catch(error => console.log(error));
}

const getAllByID = (request, response) => {
	const id = request.params.id;
	let someRows, otherRows, all;

	db.pool.query('SELECT * FROM albums JOIN file ON albums.id = file.album_id WHERE id = $1', [id])
    .then( results => {
        someRows = results.rows;
        return db.pool.query('SELECT * FROM songs WHERE album_id = $1 ORDER BY index ASC', [id]);
    } )
    .then( results => {
        otherRows = results.rows;

        all = someRows.concat(otherRows);
    } )
    .then( () => {
       response.status(200).json(all);
    } ).catch(error => console.log(error));

}


const addPostLike = async (request, response) => {
    let like = request.body;
    let postLikeRows, notificationRows, all;
    let album, track, video;
    let songResult, albumResult;
    let message;

    try {
    const insertLikeResult = await db.pool.query(
        'INSERT INTO post_likes (post_id, user_id, type) VALUES ($1, $2, $3) RETURNING *',
         [like.post_id, like.supporter_id, like.type])
         postLikeRows = insertLikeResult.rows
      if (like.user_id != like.supporter_id) {
        if (like.post_type == "album") {
          const songResult = await db.pool.query('SELECT name, album_id FROM songs WHERE id = $1',
          [like.post_id])
          const track = songResult.rows[0].name
          const albumResult = await db.pool.query('SELECT title FROM albums WHERE id = $1',
          [songResult.rows[0].album_id])
          const album = albumResult.rows[0].title

          message = `liked your track "${track}", for album "${album}"`
        } else if (like.post_type == "track") {
          const trackResult = await db.pool.query('SELECT title FROM fields WHERE id = $1',
          [like.post_id])
          const track = trackResult.rows[0].title
          message = `liked your track "${track}"`
        } else if (like.post_type == "video") {
          const videoResult = await db.pool.query('SELECT title FROM fields WHERE id = $1',
          [like.post_id])
          const video = videoResult.rows[0].title
          message = `liked your video "${video}"`
        } 

        const postImageResult = await comments.getPostImage(like.post_id)
        const insertNotifResult = await db.pool.query(
        'INSERT INTO notifications (supporter_id, supporter_username, supporter_picture, user_id, post_id, message, post_image, post_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
         [like.supporter_id, like.supporter_username, like.supporter_picture, like.user_id, like.post_id, message, postImageResult.rows[0].path, like.post_type])
         notificationRows = insertNotifResult.rows
         all = postLikeRows.concat(notificationRows);
         response.status(200).json(all);
      } else {
        response.status(200).json(postLikeRows);
      }
    } catch(err) {
     console.log(err)
    }
}


const deletePostLike = (request, response) => {
    let like = request.body;
    let post_id = request.params.post_id;
    let supporter_id = request.params.supporter_id;


    db.pool.query(
        'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2',
         [post_id, supporter_id])
    .then(results => {
        let video = "video"
        let track = "track"
        let album = "album"
        return db.pool.query(
        'DELETE FROM notifications WHERE post_id = $1 AND supporter_id = $2 AND (post_type = $3 OR post_type = $4 OR post_type = $5)',
         [post_id, supporter_id, video, track, album])
     }).then(()=> {
        console.log("Deleted from notifiations")
        response.status(200).send({ message: "Success: DELETED post like" });
    }).catch((err)=> {
        console.log(err)
     })
}


const getPostLikeByUser = (request, response) => {
    let post_id = request.params.post_id;
    let supporter_id = request.params.supporter_id;
  
  db.pool.query('SELECT * FROM post_likes WHERE post_id = $1 AND user_id = $2',
    [post_id, supporter_id])
    .then(results => {
      response.status(200).json(results.rows)
    }).catch(error => console.log(error));
}

const getLikesByPostID = (request, response) => {
  let post_id = request.params.post_id;
  
  db.pool.query('SELECT * FROM post_likes WHERE post_id = $1',
    [post_id])
    .then(results => {
      response.status(200).json(results.rows)
    }).catch(error => console.log(error));
}





 module.exports = {
 	getAll,
 	getAllByID,
  addPostLike,
  deletePostLike,
  getPostLikeByUser,
  getLikesByPostID
 }