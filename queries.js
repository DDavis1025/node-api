const uuidv4 = require('uuid/v4');
const Pool = require('pg').Pool
const pool = new Pool({
  user: 'me',
  host: 'localhost',
  database: 'api',
  password: 'password',
  port: 5432,
})
const getSongs = (request, response) => {
  pool.query('SELECT * FROM songs ORDER BY index ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

// const getSongsByAlbumId = (request, response) => {
//   const { album_id }  = request.body;

//   pool.query('SELECT * FROM songs WHERE album_id = $1 ORDER BY index ASC', [album_id], (error, results) => {
//     if (error) {
//       throw error
//     }
//     response.status(200).json(results.rows)
//     console.log("getSongsByAlbumId " + JSON.stringify(request.params));
//   })
// }


const getSongById = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('SELECT * FROM songs WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

// const addSong = (request, response) => {
//   const id = parseInt(request.params.id)
//    const { name, link, index, album_id } = request.body;

//   for (let i = 0; i < request.body.length; i++) {
    // const object = request.body[i]
//         pool.query(
//           'INSERT INTO songs (name, link, index, album_id) VALUES ($1, $2, $3, $4) ON CONFLICT (album_id, index) DO NOTHING RETURNING *',
//           [
//             object.name,
//             object.link,
//             object.index,
//             object.album_id,
//           ],
//           (error, results) => {
//             if (error != null) {
//               console.log(error)
//             } else {
//               console.log('INSERT ' + JSON.stringify(results.rows[0].id))
//             }
//           }
//         )
//   }
// }

// const updateSong = (request, response) => {
//   // const album_id = parsreparseInt(request.params.album_id);
//   const id = parseInt(request.params.id);
//   // const { name, link, index, album_id } = request.body;

// for (var i = 0; i < request.body.length; i++) {
//   pool.query(
//     'UPDATE songs SET name = $1, link = $2, index = $3, album_id = $4 WHERE id = $5',
//     [request.body[i].name, request.body[i].link, request.body[i].index, request.body[i].album_id, id],
//     (error, results) => {
//       if (error) {
//         throw error
//       } else {
//         console.log('UPDATE ' + JSON.stringify(request.body))
//       }
//       // response.status(200).send(`User modified with ID: ${id}`)
//     }
//   )
//  }
// }

const upsertSong = (request, response) => {
const { id } = request.body;
const uuid = uuidv4();
for (var i = 0; i < request.body.length; i++) {
let insertQuery = {};
const object = request.body[i];
let params = [uuid, object.name, object.link, object.index, object.album_id];
insertQuery.text = 'INSERT INTO songs (id, name, link, index, album_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING RETURNING *';
insertQuery.values = params;

(async () => {
   
   await pool.query ('UPDATE songs SET name = $1, link = $2, index = $3, album_id = $4 WHERE id = $5 AND index = $3',
    [request.body[i].name, request.body[i].link, request.body[i].index, request.body[i].album_id, id], (err, result) => {
      try {
        if (err) throw err;
        if (result.rowCount > 0){
           console.log ('UPDATE Rows affected: ', result.rowCount);
           return;
         } else {
           pool.query(insertQuery, (error, res) =>{
           try {
             if (error) throw error;
             console.log ('INSERT Rows affected:', res.rowCount);
           }catch(er){
             console.log("Error")
             console.log(er);
            }
          });
        }
       } catch (e){
         console.log("Error 2")
         console.log(e);
        }
   });
  })().catch(e => console.log("Error 3" + e));
}
}









const deleteSong = (request, response) => {
  const id = parseInt(request.params.id)
  const { album_id } = request.body;

  pool.query('DELETE FROM songs WHERE album_id = $1', [album_id], (error, results) => {
    if (error) {
      throw error
    } else {
      console.log("DELETE " + JSON.stringify(request.body))
    }
    // response.status(200).send(`User deleted with ID: ${id}`)
  })
}


module.exports = {
  Pool,
  pool,
  // upsertSong,
  getSongs,
  // getSongsByAlbumId,
  getSongById,
  // addSong,
  // updateSong,
  deleteSong,
}