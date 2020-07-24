const uuidv4 = require('uuid/v4');
const db = require('./queries');
const fs = require('fs');
var path = require('path');

const addData = (request, response) => {
	const uuid = uuidv4();
	let comments = request.body;

    db.pool.query(
     	'INSERT INTO comments (id, post_id, username, user_picture, user_id, text) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
     	 [uuid, comments.post_id, comments.username, comments.user_picture, comments.user_id, comments.text])
    .then(results => {
         console.log("Got Comment")
         console.log(results.rows)
         response.status(200).json(results.rows)
     }).catch((err)=> {
     	console.log(err)
     })
}

const addSubComment = (request, response) => {
    const uuid = uuidv4();
    let comments = request.body;
    let comment_id;
    let subCommentRows, notificationRows, all;

    console.log(comments);

    db.pool.query(
        'INSERT INTO sub_comments (id, post_id, username, user_picture, user_id, text, parent_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
         [uuid, comments.post_id, comments.username, comments.user_picture, comments.user_id, comments.text, comments.parent_id])
    .then((results) => {
         subCommentRows = results.rows
         comment_id = results.rows[0].id;
         let message = `replied to your comment:`
         return db.pool.query(
        'INSERT INTO notifications (comment_id, post_id, supporter_id, message, parent_commentid, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
         [comment_id, comments.post_id, comments.user_id, message, comments.parent_id, comments.comment_userID])
     }).then((results)=> {
        notificationRows = results.rows
        all = subCommentRows.concat(notificationRows);
        response.status(200).json(all);
     }).catch((err) => {
        console.log(err)
     })
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

    console.log(`offset ${offset}`)

    db.pool.query(
        'SELECT * FROM sub_comments WHERE parent_id = $1 ORDER BY time_added DESC OFFSET $2 LIMIT 3',
        [id, offset])
    .then((results) => {
        console.log("Got Sub Comments GET")
        response.status(200).json(results.rows)
    })
}

const addCommentLike = (request, response) => {
    let like = request.body;
    let commentLikeRows, notificationRows, all;

    db.pool.query(
        'INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2) RETURNING *',
         [like.comment_id, like.user_id])
    .then(results => {
        let message = "liked your comment"
        commentLikeRows = results.rows
        return db.pool.query(
        'INSERT INTO notifications (parent_commentid, supporter_id, user_id, post_id, message) VALUES ($1, $2, $3, $4, $5) RETURNING *',
         [like.comment_id, like.user_id, like.comment_userID, like.post_id, message])
     }).then((results)=> {
        notificationRows = results.rows
        all = commentLikeRows.concat(notificationRows);
        response.status(200).json(all);
     }).catch((err)=> {
        console.log(err)
     })
}

const deleteCommentLike = (request, response) => {
    let like = request.body;
    let comment_id = request.params.comment_id;
    let user_id = request.params.user_id;

    db.pool.query(
        'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
         [comment_id, user_id])
    .then(results => {
         response.status(200).send({ message: "Success: DELETED comment like" });
     }).catch((err)=> {
        console.log(err)
     })
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
    .then(results => {
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
    .then(results => {
         response.status(200).send({ message: "Success: DELETED sub comment" });
     }).catch((err)=> {
        console.log(err)
     })
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
  
}