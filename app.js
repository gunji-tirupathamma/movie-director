const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertDbObjectToResponseObjectDirectors = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

//Get All Movie Names

app.get("/movies/", async (request, response) => {
  const getMovieNamesQuery = `SELECT movie_name from movie;`;

  const movieNameArray = await db.all(getMovieNamesQuery);
  response.send(
    movieNameArray.map((eachName) => convertDbObjectToResponseObject(eachName))
  );
});

//add new movie

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieDetailsQuery = `INSERT INTO 
                                          movie(director_id,movie_name,lead_actor)
                                          VALUES(${directorId},
                                            "${movieName}",
                                            "${leadActor}");`;
  const dbResponse = await db.run(addMovieDetailsQuery);
  const movieId = dbResponse.lastID;
  response.send("Movie Successfully Added");
});

//get movie using movie-id

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;

  const getMovieQuery = `SELECT * FROM movie WHERE movie_id=${movieId};`;

  const movie = await db.get(getMovieQuery);
  response.send(convertDbObjectToResponseObject(movie));
});

//update movie details
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;

  const { directorId, movieName, leadActor } = movieDetails;

  const updateMovieQuery = `UPDATE movie SET
                                                director_id=${directorId},
                                                movie_name=${movieName},
                                                lead_actor=${leadActor}
                                            WHERE movie_id=${movieId};`;

  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//delete movie

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `DELETE FROM movie WHERE movie_id=${movieId};`;

  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//get directors list

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `SELECT * FROM director`;
  const directorsArray = await db.all(getDirectorsQuery);
  response.send(
    directorsArray.map((eachItem) =>
      convertDbObjectToResponseObjectDirectors(eachItem)
    )
  );
});

//get movies using movie and director tables

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorName } = request.params;
  const getMovieQueryUsingDirectorName = `SELECT movie_name FROM movie INNER JOIN director ON movie.director_id=director.director_id WHERE director_name=${directorName};`;
  const movieNameArray = await db.all(getMovieQueryUsingDirectorName);
  response.send(
    movieNameArray.map((eachItem) => convertDbObjectToResponseObject(eachItem))
  );
});

module.exports = app;
