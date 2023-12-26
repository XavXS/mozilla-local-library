const express = require('express');
const router = express.Router();

// require controller modules
const book_controller = require('../controllers/bookController');
const author_controller = require('../controllers/authorController');
const genre_controller = require('../controllers/genreController');
const book_instance_controller = require('../controllers/bookinstanceController');

/// book routes ///

// get catalog home page
router.get('/', book_controller.index);

// get request for creating a book
//note this must come before routes that display book (uses id)
router.get('/book/create', book_controller.book_create_get);

// post request for creating book
router.post('/book/create', book_controller.book_create_post);

// get request to delete book
router.get('/book/:id/delete', book_controller.book_delete_get);

// post request to delete book
router.post('/book/:id/delete', book_controller.book_delete_post);

// get request to update book
router.get('/book/:id/update', book_controller.book_update_get);

// post request to update book
router.post('/book/:id/update', book_controller.book_update_post);

// get request for one book
router.get('/book/:id', book_controller.book_detail);

// get request for list of all book items
router.get('/books', book_controller.book_list);

/// author routes ///

// get request for creating author. note this must come before route for id
router.get('/author/create', author_controller.author_create_get);

// post request for creating author
router.post('/author/create', author_controller.author_create_post);

// get request to delete author
router.get('/author/:id/delete', author_controller.author_delete_get);

// post request to delete author
router.post('/author/:id/delete', author_controller.author_delete_post);

// get request to update author
router.get('/author/:id/update', author_controller.author_update_get);

// post request to update author
router.post('/author/:id/update', author_controller.author_update_post);

// get request for one author
router.get('/author/:id', author_controller.author_detail);

// get request for list of all authors
router.get('/authors', author_controller.author_list);

/// genre routes

// get request for creating a genre. note this must come before router that displays genre
router.get('/genre/create', genre_controller.genre_create_get);

// post request for creating genre
router.post('/genre/create', genre_controller.genre_create_post);

// get request to delete genre
router.get('/genre/:id/delete', genre_controller.genre_delete_get);

// post request to delete genre
router.post('/genre/:id/delete', genre_controller.genre_delete_post);

// get request to update genre
router.get('/genre/:id/update', genre_controller.genre_update_get);

// post request to update genre
router.post('/genre/:id/update', genre_controller.genre_update_post);

// get request for one genre
router.get('/genre/:id', genre_controller.genre_detail);

// get request for list of all genre
router.get('/genres', genre_controller.genre_list);

/// bookinstance routes ///

// get request for creating a bookinstance. note this must come before route that displays bookinstance which uses id
router.get('/bookinstance/create', book_instance_controller.bookinstance_create_get);

// post request for creating bookinstance
router.post('/bookinstance/create', book_instance_controller.bookinstance_create_post);

// get request to delete bookinstance
router.get('/bookinstance/:id/delete', book_instance_controller.bookinstance_delete_get);

// post request to delete bookinstance
router.post('/bookinstance/:id/delete', book_instance_controller.bookinstance_delete_post);

// get request to update bookinstance
router.get('/bookinstance/:id/update', book_instance_controller.bookinstance_update_get);

// post request to update bookinstance
router.post('/bookinstance/:id/update', book_instance_controller.bookinstance_update_post);

// get request for one bookinstance
router.get('/bookinstance/:id', book_instance_controller.bookinstance_detail);

// get request for list of all bookinstance
router.get('/bookinstances', book_instance_controller.bookinstance_list);

module.exports = router;