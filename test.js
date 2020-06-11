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
let image;
    response.status(200).send({ message: "Success" });
     album = JSON.parse(request.body.albums);

     db.pool.query(
      'INSERT INTO albums (title, date, description, author, type, id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING RETURNING *' , 
      [album.title, album.date, album.description, album.user_id, album.type, uuid])
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
          console.log(request.files.file[0])
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



const upsertAlbum = (request, response) => {
const uuid = uuidv4();
const id = request.params.id;
// console.log(request.body);
let album = JSON.parse(request.body.album);
let album_id;
let request_file_image;
let song2;
let pathArr = [];

let result;
let insert_result;
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
          album.afterSlice.map((song) => { 
            pathArr.push(song.path)
          })
          return db.pool.query("SELECT * FROM songs WHERE path <> ALL ($1) AND album_id = $2",
          [pathArr, id])
    }).then((result) => {
          result.rows.map((row) => {
          fs.unlinkSync(path.join(__dirname, row.path))
          })
          db.pool.query("DELETE FROM songs WHERE path <> ALL ($1) AND album_id = $2",
          [pathArr, id])
    }).then(() => {
          album.afterSlice.map((song) => { 
          db.pool.query(
          'UPDATE songs SET name = $1, index = $2, path = $3 WHERE album_id = $4 AND index = $2', 
          [song.name, song.index, song.path, id])})
    }).then(() => {
      return db.pool.query('SELECT * FROM file WHERE album_id = $1', [id])
    }).then((result) => {
      if (result.rowCount > 0) {
      image = result.rows[0].path;
      } 
    }).then(() => {
      if (request.files.file) {
        console.log("request.files.file[0]" + JSON.stringify(request.files.file[0]))
        if (image != undefined) {
        let file_path = path.join(__dirname, image);
        fs.unlinkSync(path.join(__dirname, image), (err) => {
          if (err) {
            console.log(err)
          }
        })
       }
        db.pool.query(
        'UPDATE file SET image_name = $1, path = $2 WHERE album_id = $3',
        [request.files.file[0].filename, request.files.file[0].path, id]);
       }
      }).then((result) => {
         response.status(200).send({ message: "Success updating" });
         console.log("UPDATED file");
      }).catch(e => console.log(e));

        
}



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
   db.pool.query('SELECT * FROM file WHERE album_id = $1',
  [id])
  .then((result) => {
   fs.unlinkSync(path.join(__dirname, result.rows[0].path))
   db.pool.query('DELETE FROM file WHERE album_id = $1', [id])
  }).then(() => {
   return db.pool.query('SELECT * FROM songs WHERE album_id = $1',
   [id])
  }).then((result) => {
   result.rows.forEach(element => fs.unlinkSync(path.join(__dirname, element.path)))
   db.pool.query('DELETE FROM songs WHERE album_id = $1', [id])
  }).then(() => {
   db.pool.query('DELETE FROM albums WHERE id = $1', [id])
  }).then(() => {
   response.status(200).send({ message: "Success Deleting" });
  }).catch((err)=>{console.log(err)})

}







module.exports = {
  addData,
  deleteAll,
  upsertAlbum,
  deleteSongs
}

