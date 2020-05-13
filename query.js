const db = require('./queries');

const getAll = (request, response) => {

	db.pool.query('SELECT * FROM albums JOIN file ON albums.id = file.album_id ORDER BY time_added DESC')
    .then(results => {
      response.status(200).json(results.rows)
      console.log('+SELECT * FROM albums and file INNER JOIN by id')
    }).catch(error => console.log(error));
}

const getAllByID = (request, response) => {
	const id = request.params.id;
	let someRows, otherRows, all;

	db.pool.query('SELECT * FROM albums JOIN file ON albums.id = file.album_id WHERE id = $1', [id])
    .then( results => {
        someRows = results.rows;
        return db.pool.query('SELECT * FROM songs WHERE album_id = $1 ORDER BY index ASC', [id]);
    } )
    .then( results => {
        otherRows = results.rows;

        all = someRows.concat(otherRows);
    } )
    .then( () => {
       response.status(200).json(all);
       console.log("+getAllByID")
    } ).catch(error => console.log(error));

}




 module.exports = {
 	getAll,
 	getAllByID
 }