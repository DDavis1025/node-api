const db = require('./queries');

const getNoticationsByUser = async (request, response) => {
    const id = request.params.id;
     
    try {
    let notificationResults = await db.pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY time_added DESC', 
        [id])
        response.status(200).json(notificationResults.rows)
    } catch(err) {
      console.log(err)
    }
}

const getNewNoticationsByUser = async (request, response) => {
    const id = request.params.id;
     
    try {
    let newNotificationsResult = await db.pool.query(
        'SELECT new FROM notifications WHERE user_id = $1 AND new IS NOT NULL', 
        [id])
        await response.status(200).json(newNotificationsResult.rows)
         db.pool.query(
         'UPDATE notifications SET new = $1 WHERE user_id = $2',
         [null, id])
    } catch(err) {
      console.log(err)
    }
}



const getPostImageById = (request, response) => {
    const id = request.params.id;

    db.pool.query(
       'SELECT album_id FROM songs WHERE id = $1', 
       [id])
     .then((results) => {
    	if (results.rowCount <= 0) {
    	return db.pool.query(
        'SELECT path FROM track_images WHERE id = $1', 
        [id]).then((results) => {
        	if (results.rowCount <= 0) {
        		return db.pool.query(
               'SELECT path FROM video_thumbnails WHERE id = $1', 
                [id]).then((results) => {
                let type = {"type": "video"}
                results.rows.push(type)
                response.status(200).json(results.rows)
               })
        	 } else {
                let type = {"type":"track"}
                results.rows.push(type)
        	 	response.status(200).json(results.rows)
        	 }
          
          })

    	} else {
    	  let album_id = results.rows[0].album_id
          db.pool.query(
          'SELECT path FROM file WHERE album_id = $1', 
          [album_id]).then((results)=> {
          	let type = {"type":"album"}
          	results.rows.push(type)
          	response.status(200).json(results.rows)
          })
    	}
    }).catch(error => console.log(error));
}


const getAlbumSongData = (request, response) => {
    const id = request.params.id;
    let songRows, albumRows, all;

    db.pool.query(
       'SELECT * FROM songs WHERE id = $1', 
       [id])
     .then((results) => {
     songsRows = results.rows
     let album_id = results.rows[0].album_id
     return db.pool.query('SELECT * FROM albums JOIN file ON albums.id = file.album_id WHERE id = $1', 
     [album_id])
     }).then(results => {
     albumRows = results.rows
     all = songsRows.concat(albumRows);
     response.status(200).json(all);
    }).catch(error => console.log(error));
}

const getSubCommentNotificationByIDs = (request, response) => { 
    let id = request.params.id;
    let second_id = request.params.second_id;
    let rows, secondRows, all;

    console.log("handler hit")

    db.pool.query(
        'INSERT INTO notificationid (id, second_id) VALUES ($1, $2) RETURNING *',
        [id, second_id])
    .then(()=> {
    return db.pool.query(
        'SELECT * FROM sub_comments WHERE id = $1',
        [id])
    }).then((results) => {
        rows = results.rows;
        return db.pool.query (
          'SELECT * FROM sub_comments WHERE id = $1',
          [second_id])
    }).then((results) => {
    	secondRows = results.rows;
    	all = rows.concat(secondRows);
        response.status(200).json(all);
      }).catch((err)=> {
        console.log(err)
     })
}

const getSubCommentNotificationByID = (request, response) => { 
    let id = request.params.id;

    db.pool.query(
        'SELECT * FROM sub_comments WHERE id = $1',
        [id])
    .then((results)=> {
        response.status(200).json(results.rows);

    }).catch((err)=> {
        console.log(err)
     })
}

const getParentSubCommentAndReply = (request, response) => { 
    let reply_id = request.params.reply_id;
    let parent_subComment_id = request.params.parent_subID;

    let firstRows, secondRows, all;

    db.pool.query (
        'SELECT * FROM sub_comments WHERE id = $1',
        [reply_id])
    .then((results)=> {
    	firstRows = results.rows
    	return db.pool.query(
        'SELECT * FROM sub_comments WHERE id = $1',
        [parent_subComment_id])
    }).then((results)=> {
        secondRows = results.rows
        all = firstRows.concat(secondRows);
        response.status(200).json(all);
    }).catch((err)=> {
        console.log(err)
    })
}


const getPostById = (request, response) => {
    const id = request.params.id;

    db.pool.query(
       'SELECT * FROM songs WHERE id = $1', 
       [id])
     .then((results) => {
    	if (results.rowCount <= 0) {
    	return db.pool.query(
        'SELECT * FROM fields WHERE id = $1', 
        [id])
        .then((results) => {
            response.status(200).json(results.rows)
        }).catch(error => console.log(error));
 
     	} else {
        let id = results.rows[0].album_id
     	db.pool.query(
        'SELECT title FROM albums WHERE id = $1', 
        [id])
        .then((result) => {
        	let all = results.rows.concat(result.rows);
            response.status(200).json(all)
        })
     }
    }).catch(error => console.log(error));
}





module.exports = {
  getNoticationsByUser,
  getPostImageById,
  getAlbumSongData,
  getSubCommentNotificationByIDs,
  getSubCommentNotificationByID,
  getParentSubCommentAndReply,
  getPostById,
  getNewNoticationsByUser
}