const db = require('./queries');

const getNoticationsByUser = (request, response) => {
    const id = request.params.id;

    db.pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY time_added DESC', 
        [id])
    .then((results) => {
        response.status(200).json(results.rows)
    }).catch(error => console.log(error));
}

const getPostImageById = (request, response) => {
    const id = request.params.id;

    db.pool.query(
        'SELECT path FROM file WHERE album_id = $1', 
        [id])
    .then((results) => {
    	if (results.rowCount <= 0) {
    	console.log("album results.rowCount <= 0" + results.rowCount)
    	return db.pool.query(
        'SELECT path FROM track_images WHERE id = $1', 
        [id]).then((results) => {
        	if (results.rowCount <= 0) {
        		console.log("track results.rowCount <= 0" + results.rowCount)
        		return db.pool.query(
               'SELECT path FROM video_thumbnails WHERE id = $1', 
                [id]).then((results) => {
                response.status(200).json(results.rows)
               })
        	 } else {
        	 	console.log("track results.rowCount >= 0" + results.rowCount)
        	 	response.status(200).json(results.rows)
        	 }
          
          })

    	} else {
    	  console.log("album results.rowCount >= 0" + results.rowCount)
    	  response.status(200).json(results.rows)
    	}
    }).catch(error => console.log(error));
}

module.exports = {
  getNoticationsByUser,
  getPostImageById
}