const db = require('./queries');

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

module.exports = {
   getArtistByID,
   addFollower,
   getFollowingByUserId,
   getFollowedByFollowerID,
   deleteFollowing
}