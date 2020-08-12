const db = require('./queries');

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


const addPostLike = (request, response) => {
    let like = request.body;
    let postLikeRows, notificationRows, all;

    db.pool.query(
        'INSERT INTO post_likes (post_id, user_id, type) VALUES ($1, $2, $3) RETURNING *',
         [like.post_id, like.supporter_id, like.type])
    .then(results => {
        let message = "liked your post"
        postLikeRows = results.rows
      if (like.user_id != like.supporter_id) {
        return db.pool.query(
        'INSERT INTO notifications (supporter_id, supporter_username, supporter_picture, user_id, post_id, message) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
         [like.supporter_id, like.supporter_username, like.supporter_picture, like.user_id, like.post_id, message])
    .then((results)=> {
        notificationRows = results.rows
        all = postLikeRows.concat(notificationRows);
        response.status(200).json(all);
    }).catch((err)=> {
        console.log(err)
     })
     } else {
        response.status(200).json(postLikeRows);
     }
     }).catch((err)=> {
        console.log(err)
     })
}


const deletePostLike = (request, response) => {
    let like = request.body;
    let post_id = request.params.post_id;
    let supporter_id = request.params.supporter_id;


    db.pool.query(
        'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2',
         [post_id, supporter_id])
    .then(results => {
        let message = "liked your post"
        return db.pool.query(
        'DELETE FROM notifications WHERE post_id = $1 AND supporter_id = $2 AND message = $3',
         [post_id, supporter_id, message])
     }).then(()=> {
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