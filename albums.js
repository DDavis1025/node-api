const uuidv4 = require('uuid/v4');

const db = require('./queries');

const getAlbums = (request, response) => {
  db.pool.query('SELECT * FROM albums', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getAlbumById = (request, response) => {
  const { id } = request.body;

  db.pool.query('SELECT * FROM albums WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

// const addAlbum = (request, response) => {
//   // const id = parseInt(request.params.id)
//   const { title, date, description, id } = request.body;
//   const uuid = uuidv4();

// for (let i = 0; i < request.body.length; i++) {
//   db.pool.query('INSERT INTO albums (title, date, description, id) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING RETURNING *' , [request.body[i].title, request.body[i].date, request.body[i].description, uuid], (error, results) => {
//     if (error) {
//       throw error
//     } else {
//       console.log('INSERT ' + JSON.stringify(request.body));
//       response.send(results.rows);
//     }
    
//   })
// }
// }


// const updateAlbum = (request, response) => {
//   // const id = parseInt(request.params.id)
//   const { title, date, description, id } = request.body

// for (var i = 0; i < request.body.length; i++) {
//   db.pool.query(
//     'UPDATE albums SET title = $1, date = $2, description = $3 WHERE id = $4',
//     [request.body[i].title, request.body[i].date, request.body[i].description, id],
//     (error, results) => {
//       if (error) {
//         throw error
//       } else {
//         console.log('UPDATE ' + JSON.stringify(request.body));
//       // response.status(200).send(`User modified with ID: ${id}`)
//     }
//     }
//   )
// }
 
// }

const deleteAlbum = (request, response) => {
  const id = parseInt(request.params.id)

  db.pool.query('DELETE FROM albums', (error, results) => {
    if (error) {
      throw error
    }
    // response.status(200).send(`User deleted with ID: ${id}`)
  })
}

module.exports = {
  getAlbums,
  getAlbumById,
  // 
  deleteAlbum,
}