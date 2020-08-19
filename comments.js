const uuidv4 = require('uuid/v4');
const db = require('./queries');
const fs = require('fs');
var path = require('path');

const addData = async (request, response) => {
	const uuid = uuidv4();
	let comments = request.body;
    let mainCommentRows, notificationRows, all;

    try {
    const insertCommentResults = await db.pool.query(
     	'INSERT INTO comments (id, post_id, username, user_picture, user_id, text) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
     	 [uuid, comments.post_id, comments.username, comments.user_picture, comments.user_id, comments.text])
         let comment_id = insertCommentResults.rows[0].id
         mainCommentRows = insertCommentResults.rows
         let message = `commented on your post: ${comments.text}`
      if (comments.user_id != comments.post_user_id) {
         let postImageResults = await getPostImage(comments.post_id)
         let insertNotificationsResults = await db.pool.query(
        'INSERT INTO notifications (comment_id, post_id, supporter_id, supporter_username, supporter_picture, message, user_id, post_image, post_type, new) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
         [comment_id, comments.post_id, comments.user_id, comments.username, comments.user_picture, message, comments.post_user_id, postImageResults.rows[1].path, postImageResults.rows[0].type, true])

          notificationRows = insertNotificationsResults.rows
          all = mainCommentRows.concat(notificationRows);
          response.status(200).json(all);

     } else {
       response.status(200).json(mainCommentRows);
    }
 } catch(err) {
    console.log(err)
}

}


const addSubComment = async (request, response) => {
    const uuid = uuidv4();
    let comments = request.body;
    let comment_id;
    let post_image;
    let subCommentRows, notificationRows, all;

    try {
    const results = await db.pool.query(
        'INSERT INTO sub_comments (id, post_id, username, user_picture, user_id, text, parent_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
         [uuid, comments.post_id, comments.username, comments.user_picture, comments.user_id, comments.text, comments.parent_id])
         subCommentRows = results.rows
         comment_id = results.rows[0].id;
         let message = `replied to your comment: ${comments.text}`
      if (comments.user_id != comments.comment_userID) {
       if (comments.parent_id != null && comments.parentsubcommentid == null) {
        //ADD post_image//
        const imageResults = await getPostImage(comments.post_id)
        const commentTextResults = await db.pool.query(
        'SELECT text FROM comments WHERE id = $1 ORDER BY time_added DESC',
        [comments.parent_id])
        const insertResults = await db.pool.query(
        'INSERT INTO notifications (comment_id, post_id, supporter_id, supporter_username, supporter_picture, message, parent_commentid, user_id, tableview_index, parentsubcommentid, parent_comment, post_image, post_type, new) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
        [comment_id, comments.post_id, comments.user_id, comments.username, comments.user_picture, message, comments.parent_id, comments.comment_userID, comments.tableview_index, comments.parentsubcommentid, commentTextResults.rows[0].text, imageResults.rows[1].path, imageResults.rows[0].type, true])
        notificationRows = insertResults.rows
        all = subCommentRows.concat(notificationRows);
        response.status(200).json(all);    
     } else if (comments.parentsubcommentid) {
        const imageResults = await getPostImage(comments.post_id, post_image)
        const commentTextResults = await db.pool.query(
         'SELECT text FROM sub_comments WHERE id = $1 ORDER BY time_added DESC',
         [comments.parentsubcommentid])
        const insertResults = await db.pool.query (
            'INSERT INTO notifications (comment_id, post_id, supporter_id, supporter_username, supporter_picture, message, parent_commentid, user_id, tableview_index, parentsubcommentid, parent_comment, post_image, post_type, new) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
             [comment_id, comments.post_id, comments.user_id, comments.username, comments.user_picture, message, comments.parent_id, comments.comment_userID, comments.tableview_index, comments.parentsubcommentid, commentTextResults.rows[0].text, imageResults.rows[1].path, imageResults.rows[0].type, true])
             notificationRows = insertResults.rows
             all = subCommentRows.concat(notificationRows);
             response.status(200).json(all);
      }
 } else {
    response.status(200).json(subCommentRows);
 }
} catch (err) {
    console.log(err)
}
}

const getCommentsByMediaId = (request, response) => {
    let id = request.params.id

    db.pool.query(
        'SELECT * FROM comments WHERE post_id = $1 ORDER BY time_added DESC',
        [id])
    .then((results) => {
        console.log("Got Comments GET")
        response.status(200).json(results.rows)
    }).catch((err) => console.log(err))
}


const getSubCommentsByParentId = (request, response) => {
    let id = request.params.id;
    let offset = request.query.offset;
    
    db.pool.query(
        'SELECT * FROM sub_comments WHERE parent_id = $1 ORDER BY time_added DESC OFFSET $2 LIMIT 3',
        [id, offset])
    .then((results) => {
        console.log("Got Sub Comments GET")
        response.status(200).json(results.rows)
    }).catch((err)=> {
        console.log(err)
    })
}

const addCommentLike = async (request, response) => {
    let like = request.body;
    let commentRows, commentLikeRows, notificationRows, all;

    try {
    let insertLikesResult = await db.pool.query(
        'INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2) RETURNING *',
         [like.comment_id, like.user_id])
        let message = "liked your comment"
        commentLikeRows = insertLikesResult.rows

    let selectLikesCommentsResult = await db.pool.query(
        'SELECT likes FROM comments WHERE id = $1',
         [like.comment_id])
    let likes = selectLikesCommentsResult.rows[0].likes + 1
    let updateLikesCommentsResult = await db.pool.query(
        'UPDATE comments SET likes = $1 WHERE id = $2',
         [likes, like.comment_id])
        commentRows = updateLikesCommentsResult.rows
      if (like.user_id != like.comment_userID) {
        let postImageResults = await getPostImage(like.post_id)
        let commentTextResult = await db.pool.query(
        'SELECT text FROM comments WHERE id = $1',
        [like.comment_id]) 
        if (commentTextResult.rowCount > 0) {
         const insertNotifResult = await db.pool.query(
        'INSERT INTO notifications (comment_id, parent_commentid, supporter_id, supporter_username, supporter_picture, user_id, post_id, message, parent_comment, post_image, post_type, new) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
         [like.comment_id, like.parent_id, like.user_id, like.username, like.user_picture, like.comment_userID, like.post_id, message, commentTextResult.rows[0].text, postImageResults.rows[1].path, postImageResults.rows[0].type, true])
        notificationRows = insertNotifResult.rows
        all = commentLikeRows.concat(notificationRows);
        response.status(200).json(all);
       } else {
        const subCommentTextResult = await db.pool.query(
        'SELECT text FROM sub_comments WHERE id = $1',
        [like.comment_id]) 
         const insertNotifResult = await db.pool.query(
        'INSERT INTO notifications (comment_id, parent_commentid, supporter_id, supporter_username, supporter_picture, user_id, post_id, message, parent_comment, post_image, post_type, new) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
         [like.comment_id, like.parent_id, like.user_id, like.username, like.user_picture, like.comment_userID, like.post_id, message, subCommentTextResult.rows[0].text, postImageResults.rows[1].path, postImageResults.rows[0].type, true])
        notificationRows = insertNotifResult.rows
        all = commentLikeRows.concat(notificationRows, commentRows);
        response.status(200).json(all);
       }
     } else {
        all = commentLikeRows.concat(commentRows);
        response.status(200).json(all);
     }
 } catch(err) {
    console.log(err)
 }
}

const deleteCommentLike = async (request, response) => {
    let like = request.body;
    let comment_id = request.params.comment_id;
    let user_id = request.params.user_id;

    console.log("comment_id" + comment_id + "user_id" + user_id)
    try {
         await db.pool.query(
        'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
         [comment_id, user_id])

         let selectLikesCommentsResult = await db.pool.query(
        'SELECT likes FROM comments WHERE id = $1',
         [comment_id])
         let likes = selectLikesCommentsResult.rows[0].likes - 1
         if (selectLikesCommentsResult.rows[0].likes > 0) {
         await db.pool.query(
        'UPDATE comments SET likes = $1 WHERE id = $2',
         [likes, comment_id])
         }


        let message = "liked your comment"
        await db.pool.query(
        'DELETE FROM notifications WHERE comment_id = $1 AND supporter_id = $2 AND message = $3',
         [comment_id, user_id, message])
        
        response.status(200).send({ message: "Success: DELETED comment like" });
    } catch(err) {
        console.log(err)
    }
}

const getCommentLikesByCommentID = (request, response) => {
    let id = request.params.id;

    db.pool.query(
        'SELECT user_id FROM comment_likes WHERE comment_id = $1 ',
        [id])
    .then((results) => {
        response.status(200).json(results.rows)
    }).catch((err) => {
        console.log(err)
    })
}


const getCommentLikesByUserID = (request, response) => {
    let comment_id = request.params.comment_id;
    let user_id = request.params.user_id;

    db.pool.query(
        'SELECT * FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
        [comment_id, user_id])
    .then((results) => {
        response.status(200).json(results.rows)
    }).catch((err) => {
        console.log(err)
    })
}

const getCommentLikes = async (request, response) => {
    let comment_id = request.params.comment_id;

    try {
    let commentLikesResult = await db.pool.query(
        'SELECT likes FROM comments WHERE id = $1',
        [comment_id])
        response.status(200).json(commentLikesResult.rows)
    } catch(err) {
        console.log(err)
    }
}


const updateSubCommentIsLiked = (request, response) => {
    let { isLiked } = request.body;
    let subComment_id = request.params.id;

    db.pool.query(
        'SELECT isLiked FROM sub_comments WHERE id = $1', 
        [subComment_id])
    .then((results) => {
        if (results.rowCount > 0) {
          db.pool.query(
          'UPDATE sub_comments SET isLiked = $1 WHERE id = $2', 
           [isLiked, subComment_id])
          .then((results) => {
           console.log(`UPDATE subComment like ${results.rows}`)
           response.status(200).json(results.rows)
       }).catch((err) => {
        console.log(err)
       })
       } else {
            db.pool.query(
            'INSERT INTO sub_comments isLiked VALUES $1 WHERE id = $2 RETURNING *' ,
            [isLiked, subComment_id])
            .then((results) => {
            console.log(`INSERT subComment like ${results.rows}`)
            response.status(200).json(results.rows)
            }).catch((err) => {
            console.log(err)
       })
     }
     }).catch((err) => {
        console.log(err)
    })
}

const addedComment = (request, response) => {
    let id = request.params.id;
    let user_id = request.params.user_id

    db.pool.query(
        'SELECT * FROM sub_comments WHERE parent_id = $1 AND user_id = $2 ORDER BY time_added DESC OFFSET 0 LIMIT 1',
        [id, user_id])
    .then((results) => {
        console.log("Got Sub Comment")
        response.status(200).json(results.rows)
    })
}

const getCommentsByUser = (request, response) => {
    let id = request.params.id;
    let user_id = request.params.user_id;

    db.pool.query(
        'SELECT * FROM comments WHERE id = $1 AND user_id = $2',
        [id, user_id])
    .then((results) => {
        console.log("Got Comment By User")
        response.status(200).json(results.rows)
    })
}


const deleteComment = (request, response) => {
    let comment_id = request.params.comment_id;
    let user_id = request.params.user_id;

    db.pool.query(
        'DELETE FROM comments WHERE id = $1 AND user_id = $2',
         [comment_id, user_id])
    .then(() => {
        return db.pool.query(
        'DELETE FROM notifications WHERE comment_id = $1 AND supporter_id = $2 AND MESSAGE::text LIKE $3',
        [comment_id, user_id, 'commented%'])
     }).then(() => {
         response.status(200).send({ message: "Success: DELETED comment" });
     }).catch((err)=> {
        console.log(err)
     })
}

const deleteSubComment = (request, response) => {
    let comment_id = request.params.comment_id;
    let user_id = request.params.user_id;

    db.pool.query(
        'DELETE FROM sub_comments WHERE id = $1 AND user_id = $2',
         [comment_id, user_id])
    .then(() => {
        return db.pool.query(
        'DELETE FROM notifications WHERE comment_id = $1 AND supporter_id = $2 AND MESSAGE::text LIKE $3',
         [comment_id, user_id, 'replied%'])
     }).then(()=> {
        response.status(200).send({ message: "Success: DELETED sub comment" });
     }).catch((err)=> {
        console.log(err)
     })
}

const getCommentById = (request, response) => {
    let id = request.params.id;

    db.pool.query(
        'SELECT * FROM comments WHERE id = $1',
        [id])
    .then((results) => {
        if (results.rowCount <= 0) {
         db.pool.query(
          'SELECT * FROM sub_comments WHERE id = $1',
          [id])
         .then((results)=> {
            let subCommentIsParent = {"subCommentIsParent":true}
            results.rows[0] + subCommentIsParent
            response.status(200).json(results.rows)
         })
        } else {
            response.status(200).json(results.rows)
      }
    })
}


const getAuthorByPostId = (request, response) => {
    const id = request.params.id;

    db.pool.query(
       'SELECT album_id FROM songs WHERE id = $1', 
       [id])
     .then((results) => {
        if (results.rowCount <= 0) {
        return db.pool.query(
        'SELECT author FROM video WHERE id = $1', 
        [id])
        .then((results) => {
         if (results.rowCount <= 0) {
         return db.pool.query(
         'SELECT author FROM track WHERE id = $1', 
         [id])
         .then((results)=> {
            response.status(200).json(results.rows)
         }).catch((err)=> {
            console.log(err)
         })
         } else {
           response.status(200).json(results.rows)
         }
        }).catch(error => console.log(error));
        } else {
          let id = results.rows[0].album_id
          db.pool.query(
          'SELECT author FROM albums WHERE id = $1', 
          [id]).then((results) => {
          response.status(200).json(results.rows)
      }).catch((err)=> {
        console.log(err)
      })
     }
    })
}


async function getPostImage(post_id) {
    try {
    const results = await db.pool.query(
       'SELECT album_id FROM songs WHERE id = $1', 
       [post_id])
       
        if (results.rowCount <= 0) {
        const trackResults = await db.pool.query(
        'SELECT path FROM track_images WHERE id = $1', 
        [post_id])
            if (trackResults.rowCount <= 0) {
                let videoResults = await db.pool.query(
               'SELECT path FROM video_thumbnails WHERE id = $1', 
                [post_id])
                videoResults.rows.unshift({"type": "video"})
                return videoResults
             } else {
                trackResults.rows.unshift({"type": "track"})
                return trackResults
             }

        } else {
          let album_id = results.rows[0].album_id
          let albumResults = await db.pool.query(
          'SELECT path FROM file WHERE album_id = $1', 
          [album_id])
          albumResults.rows.unshift({"type": "album"})
           return albumResults
        }
    } catch(err) {
       console.log(err)
    }

}








module.exports = {
  addData,
  addSubComment,
  getCommentsByMediaId,
  getSubCommentsByParentId,
  addCommentLike,
  deleteCommentLike,
  getCommentLikesByCommentID,
  getCommentLikesByUserID,
  updateSubCommentIsLiked,
  addedComment,
  getCommentsByUser,
  deleteComment,
  deleteSubComment,
  getCommentById,
  getAuthorByPostId,
  getPostImage,
  getCommentLikes
}