const uuidv4 = require('uuid/v4');
const db = require('./queries');
const fs = require('fs');
var path = require('path');

const addData = (request, response) => {
const uuid = uuidv4(); 
let album_id;
var album;
var album_files;
let date = new Date;
let date_now = Date.now();
let songs;
    response.status(200).send({ message: "Success" });
     album = JSON.parse(request.body.albums);

     db.pool.query('INSERT INTO albums (title, date, description, author, id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING RETURNING *' , [album.title, album.date, album.description, album.user_id, uuid])
    .then(res => {
      album_id = res.rows[0].id;

      Array.from(album.files).forEach((num1, index) => {
      const num2 = request.files.songs[index];
      
  });      
      
    }).then(() => {
       const dbQueryPromises = [];
       console.log(songs);

      
        Array.from(album.files).forEach((song1, index) => {
         const song2 = request.files.songs[index];
         dbQueryPromises.push(db.pool.query(
          'INSERT INTO songs (id, name, index, path, album_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (album_id, index) DO NOTHING RETURNING *', 
          [uuidv4(), song1.name, song1.index, song2.path, album_id]))
      });      
        // console.log(album_files);
        
        return Promise.all(dbQueryPromises);
        }).then(res => {
          // console.log(album.files)
         console.log('Array of INSERT result for second insert');
         console.log(res.rows);
    }).then(() => {
        db.pool.query(
        'INSERT INTO file (image_name, type, size, path, album_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [request.files.file[0].filename, request.files.file[0].mimetype, request.files.file[0].size, request.files.file[0].path, album_id]);
      }).then((res) => {
         // console.log("INSERT INTO file(images) " + request.body.data);
      }).catch(error => console.log(error));

}

// const updateAlbum = (request, response) => {
//   const id = request.params.id;
//   const { name, email } = request.body;
//   // console.log(request.body.album);
//   // console.log(request.body);
//   console.log(request.bod)
//   let album = JSON.parse(request.body.album);
//   console.log(album.afterSlice);
//   response.status(200).send({ message: "Updated" });
//   db.pool.query(
//     'UPDATE albums SET title = $1, date = $2, description = $3 WHERE id = $4', 
//     [album.title, album.date, album.description, id])
//     .then((results) => {
//       // console.log(results);
//     }).then(() => {
//        const dbQueryPromises = album.afterSlice.map((song) => { 
//           console.log("songs " + JSON.stringify(song));
//           return db.pool.query(
//           'UPDATE songs SET name = $1, index = $2, path = $3 WHERE album_id = $4', 
//           [song.name, song.index, song.path, id])
//        });     

//         }).then(results => {
//            console.log(results);
//     }).catch(error => console.log(error));
//     // .then(() => {
//     //     db.pool.query(
//     //     'UPDATE files image_name = $1, path = $2 WHERE album_id = $3',
//     //     [request.files.file[0].filename, request.files.file[0].mimetype, request.files.file[0].size, request.files.file[0].path, album_id]);
//     //   }).then((res) => {
//     //      // console.log("INSERT INTO file(images) " + request.body.data);
//       // }).catch(error => console.log(error));

// }



const upsertAlbum = (request, response) => {
const uuid = uuidv4();
const id = request.params.id;
// console.log(request.body);
let album = JSON.parse(request.body.album);
let album_id;
let request_file_image;
// console.log(album.afterSlice);

let result;
let insert_result;
   response.status(200).send({ message: "Success" });
   db.pool.query('UPDATE albums SET title = $1, date = $2, description = $3 WHERE id = $4', 
    [album.title, album.date, album.description, id])
     .then((result)=> {
        if (result.rowCount > 0){
           console.log ('UPDATE Rows affected albums: ', result.rowCount);
           return;
         } else {
           return db.pool.query(
            'INSERT INTO albums (title, date, description, author, id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING RETURNING *', 
            [album.title, album.date, album.description, album.user_id, id]);
         }
     }).then((result) => {
            console.log ('INSERT Rows affected albums:');
           }).then(() => {
          const dbQueryPromises = [];

          album.afterSlice.map((song) => { 
          dbQueryPromises.push(db.pool.query(
          'UPDATE songs SET name = $1, index = $2 WHERE album_id = $3 AND index = $2', 
          [song.name, song.index, id]))
        });     
          return Promise.all(dbQueryPromises);
       }).then((result) => {
          if(result.rowCount > 0){
           console.log ('UPDATE Rows affected songs', result.rowCount);
           return;
         } else {
         const dbQueryPromises = [];
        if(request.files.songs) {
         Array.from(album.afterSlice).forEach((song1, index) => {
         const song2 = request.files.songs[index];
         // console.log(request.files.songs);
         dbQueryPromises.push(db.pool.query(
          'INSERT INTO songs (id, name, index, path, album_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (album_id, index) DO NOTHING RETURNING *', 
          [uuidv4(), song1.name, song1.index, song2.path, id]))
      });       
      } 
        return Promise.all(dbQueryPromises);
      }
    }).then((result) => {
            console.log ('INSERT Rows affected songs:', result.rowCount);
    }).then(() => {
      return db.pool.query('SELECT * FROM file WHERE album_id = $1', [id])
    }).then((result) => {
      console.log("results from file" + JSON.stringify(result.rows[0].path));
      request_file_image = request.files.file[0];
      if(result.rows[0].path){
      fs.unlinkSync(path.join(__dirname, result.rows[0].path));
      console.log(result.rows[0].path);
    }
       }).then(() => {
        // console.log(JSON.stringify(request.files.file));
        // if(request.files.file) {
        db.pool.query(
        'UPDATE file SET image_name = $1, path = $2 WHERE album_id = $3',
        [request_file_image.filename, request_file_image.path, id]);
        console.log(request.files.file[0].path)
      // }
      }).then((result) => {
         console.log("UPDATE file");
      }).catch(e => console.log(e));

        
}

// const selectSongs = (request, response) => {
//   const id = request.params.id;
//   const { album_id } = request.body;
  
//   // response.status(200).send({ message: "Success" });
//   db.pool.query('SELECT * FROM songs WHERE album_id = $1', [id])
//   .then((result) => {
//     result.rows.forEach((song, index) => {
//       console.log(song.path)
//     });
         
//     // res.rows[0].path
//     response.status(200).json(result.rows);
//     // console.log("res.rows.path " + JSON.stringify(res.rows[0].path))
//     // console.log("SELECT FROM songs " + JSON.stringify(result));
//     // response.status(200).send(`User deleted with ID: ${id}`)
// })
// }



const deleteSongs = (request, response) => {
  const id = request.params.id;
  const { album_id } = request.body;
  
  response.status(200).send({ message: "Success" });
  db.pool.query('SELECT * FROM songs WHERE album_id = $1', [id])
 .then((result) => {
    result.rows.forEach((song, index) => {
       console.log(song.name);
       console.log(song.path);
       fs.unlinkSync(path.join(__dirname, song.path));
    })
}).then(() => {
  return db.pool.query('DELETE FROM songs WHERE album_id = $1', [id])
}).then((result) => {
    console.log("DELETE FROM songs " + result)
}).catch((err)=>{console.log(err)})
}


const deleteAll = (request, response) => {
  const id = request.params.id;
  
  response.status(200).send({ message: "Success" });
  db.pool.query('DELETE FROM file WHERE album_id = $1', [id])
 .then((result) => {
    console.log("DELETE FROM file")
}).then(() => {
  return db.pool.query('DELETE FROM songs WHERE album_id = $1', [id])
}).then((result) => {
    console.log("DELETE FROM songs")
}).then(() => {
  return db.pool.query('DELETE FROM albums WHERE id = $1', [id])
}).then((result) => {
    console.log("DELETE FROM albums")
}).catch((err)=>{console.log(err)})

}






module.exports = {
  addData,
  deleteAll,
  upsertAlbum,
  deleteSongs,
  // selectSongs,
}

