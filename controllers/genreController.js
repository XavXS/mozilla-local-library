const Genre = require('../models/genre');
const Book = require('../models/book');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

// display list of all Genre
exports.genre_list = asyncHandler(async(req, res, next) => {
    const allGenres = await Genre.find().sort({ name: 1 }).exec();
    res.render('genre_list', {
        title: 'Genre List',
        genre_list: allGenres,
    })
});

// display detail page for a specific Genre
exports.genre_detail = asyncHandler(async(req, res, next) => {
    // get details of genre and all associated books (in parallel)
    const [genre, booksInGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, 'title summary').exec(),
    ]);
    
    if(genre === null) {
        // no results
        const err = new Error('Genre not found');
        err.status = 404;
        return next(err);
    }

    res.render('genre_detail', {
        title: 'Genre Detail',
        genre: genre,
        genre_books: booksInGenre,
    });
});

// display Genre create form on GET
exports.genre_create_get = (req, res, next) => {
    res.render('genre_form', { title: 'Create Genre' });
};

// handle Genre create on POST
exports.genre_create_post = [
    // validate and sanitize the name field
    body('name', 'genre name must contain at least 3 characters')
        .trim()
        .isLength({ min: 3 })
        .escape(),

    // process request after validation and sanitization
    asyncHandler(async(req, res, next) => {
        // extract the validation errors from a request
        const errors = validationResult(req);

        // create a genre object with escaped and trimmed data
        const genre = new Genre({ name: req.body.name });

        if(!errors.isEmpty()) {
            // there are errors. render the form again with sanitized values/error messages
            res.render('genre_form', {
                title: 'Create Genre',
                genre: genre,
                errors: errors.array(),
            });
            return;
        }
        else {
            // data from form is valid
            // check if genre with same name already exists
            const genreExists = await Genre.findOne({ name: req.body.name }).exec();
            if(genreExists) {
                // genre exists. redirect to its detail page
                res.redirect(genreExists.url);
            }
            else {
                await genre.save();
                // new genre saved. redirect to genre detail page.
                res.redirect(genre.url);
            }
        }
    }),
];

// display Genre delete form on GET
exports.genre_delete_get = asyncHandler(async(req, res, next) => {
    const [genre, booksWithGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }).exec(),
    ]);

    if(genre === null) {
        res.redirect('/catalog/genres');
    }

    res.render('genre_delete', {
        title: 'Delete Genre',
        genre: genre,
        genre_books: booksWithGenre,
    })
});

// handle Genre delete on POST
exports.genre_delete_post = asyncHandler(async(req, res, next) => {
    const [genre, booksWithGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }).exec(),
    ]);

    if(booksWithGenre.length > 0) {
        res.render('genre_delete', {
            title: 'Delete Genre',
            genre: genre,
            genre_books: booksWithGenre,
        })
        return;
    }
    else {
        await Genre.findByIdAndDelete(req.body.genreid);
        res.redirect('/catalog/genres');
    }   
});

// display Genre update form on GET
exports.genre_update_get = asyncHandler(async(req, res, next) => {
    const genre = Genre.findById(req.params.id);
    if(genre === null) {
        const err = new Error('Genre not found');
        err.status = 404;
        return next(err);
    }
    res.render('genre_form', {
        title: 'Update Genre',
        genre: genre,
    })
});

// handle Genre update on POST
exports.genre_update_post = [
    body('name', 'genre name must contain at least 3 characters')
        .trim()
        .isLength({ min: 3 })
        .escape(),
    asyncHandler(async(req, res, next) => {
        const errors = validationResult(req)
        // create a genre object with escaped and trimmed data
        const genre = new Genre({
            name: req.body.name,
            _id: req.params.id,
        });

        if(!errors.isEmpty()) {
            // there are errors. render the form again with sanitized values/error messages
            res.render('genre_form', {
                title: 'Create Genre',
                genre: genre,
                errors: errors.array(),
            });
            return;
        }
        else {
            // data from form is valid
            // check if genre with same name already exists
            const genreExists = await Genre.findOne({ name: req.body.name }).exec();
            if(genreExists) {
                // genre exists. redirect to its detail page
                res.redirect(genreExists.url);
            }
            else {
                await Genre.findByIdAndUpdate(req.params.id, genre, {});
                // new genre saved. redirect to genre detail page.
                res.redirect(genre.url);
            }
        }
    }),
];