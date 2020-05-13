const db = require('./queries');

const getImageByAlbumId = (request, response) => {
  const { id }  = request.body;

  db.pool.query('SELECT * FROM file WHERE album_id = $1 ORDER BY album_id ASC', [id], (error, results) => {
    if (error) {
      throw error
    } else {
    response.status(200).json(results.rows)
    console.log("getImageByAlbumId " + JSON.stringify(request.params));
   }
  })
}


// const imageUpload = (req, res) => {
//     var id = parseInt(req.params.id);
//     message: "Error! in image upload."
//      if (!req.file) {
//      	  console.log("No file recieved");
//      	  message = "Error! in image upload."
//      	  console.log("status: danger");
//      	 // res.render({message: message, status:'danger'});
//      } else {
//      	console.log('file recieved');
//      	console.log(req.file);

//      	 var query = db.pool.query('INSERT INTO file (name, type, size, path, album_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (album_id) DO NOTHING RETURNING *', [req.file.filename, req.file.mimetype, req.file.size, req.file.path, id], (err, result) => {
//      	 	console.log('inserted data')
//      	 	if (err) {
//      	 		console.log(err)
//      	 	} else {
//      	 	   console.log('inserted data')
//      	 	   console.log(result)
//      	 }
//      	 });
//      	 message = "Successfully uploaded";
//      	 console.log("status: success");
//      	 // res.render({message: message, status:'success'});
//      }

// }

// const upsertImage = (req, res) => {
// // const id = parseInt(req.params.id);
// // for (var i = 0; i < request.body.length; i++) {
// let insertQuery = {};
// // const object = request.body[i];
// let params = [req.file.filename, req.file.mimetype, req.file.size, req.file.path];
// insertQuery.text = 'INSERT INTO file (name, type, size, path, album_id) VALUES ($1, $2, $3, $4) ON CONFLICT (album_id) DO NOTHING RETURNING *';
// insertQuery.values = params;

// (async () => {
   
//    await db.pool.query ('UPDATE file SET name = $1, type = $2, size = $3, path = $4',
//     [req.file.filename, req.file.mimetype, req.file.size, req.file.path], (err, result) => {
//       try {
//         if (err) throw err;
//         if (result.rowCount > 0) {
//            console.log ('UPDATE upsertImage Rows affected: ', result.rowCount);
//            return;
//          } else if (!req.file) {
//         console.log("No file recieved");
//         message = "Error! in image upload."
//         console.log("status: danger");
//        // res.render({message: message, status:'danger'});
//      } else {
//       console.log('file recieved');
//       console.log(req.file);
//       console.log(req.body)

//        var query = db.pool.query(insertQuery, (err, result) => {
//         console.log('inserted data')
//         if (err) {
//           console.log(err)
//         } else {
//            console.log('INSERT upsertImage Rows affected:', result.rowCount)
//            console.log(result)
//        }
//        });
//        message = "Successfully uploaded";
//        console.log("status: success");
//        // res.render({message: message, status:'success'});
//      }
//        } catch (e){
//          console.log("Error 2")
//          console.log(e);
//         }
//    });
//   })().catch(e => console.log("Error 3" + e));
// }


// const deleteImage = (request, response) => {
//   const id = parseInt(request.params.id)

//   db.pool.query('DELETE FROM file WHERE album_id = $1', [id], (error, results) => {
//     if (error) {
//       throw error
//     } else {
//       console.log("DELETE " + results.rows)
//     }
//     // response.status(200).send(`User deleted with ID: ${id}`)
//   })
// }






module.exports = {
  // imageUpload,
  getImageByAlbumId,
  // upsertImage,
  // deleteImage,
}
