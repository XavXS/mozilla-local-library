const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');
const { body, validationResult } = require('express-validator')

const asyncHandler = require('express-async-handler');

exports.index = asyncHandler(async(req, res, next) => {
    // get details of books, book instance, authors, and genre counts (in parallel)
    const [
        numBooks,
        numBookInstances,
        numAvailableBookInstances,
        numAuthors,
        numGenres,
    ] = await Promise.all([
        Book.countDocuments({}).exec(),
        BookInstance.countDocuments({}).exec(),
        BookInstance.countDocuments({ status: 'Available' }).exec(),
        Author.countDocuments({}).exec(),
        Genre.countDocuments({}).exec(),
    ]);

    res.render('index', {
        title: 'Local Library Home',
        book_count: numBooks,
        book_instance_count: numBookInstances,
        book_instance_available_count: numAvailableBookInstances,
        author_count: numAuthors,
        genre_count: numGenres,
    });
});

// display list of all books
exports.book_list = asyncHandler(async(req, res, next) => {
    const allBooks = await Book.find({}, 'title author')
        .sort({ title: 1 })
        .populate('author')
        .exec();

    res.render('book_list', { title: 'Book List', book_list: allBooks });
});

// display detail page for a specific book
exports.book_detail = asyncHandler(async(req, res, next) => {
    // get details of books, book instances for specific book
    const [book, bookInstances] = await Promise.all([
        Book.findById(req.params.id).populate('author').populate('genre').exec(),
        BookInstance.find({ book: req.params.id }).exec(),
    ]);

    if(book === null) {
        // no results
        const err = new Error('Book not found');
        err.status = 404;
        return next(err);
    }

    res.render('book_detail', {
        title: book.title,
        book: book,
        book_instances: bookInstances,
    });
});

// display book create form on GET
exports.book_create_get = asyncHandler(async(req, res, next) => {
    // get all authors and genres, which we can use for adding to our book.
    const [allAuthors, allGenres] = await Promise.all([
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec()
    ]);

    res.render('book_form', {
        title: 'Create Book',
        authors: allAuthors,
        genres: allGenres,
    });
});

// handle book create on POST
exports.book_create_post = [
    // convert the genre into array
    (req, res, next) => {
        if(!Array.isArray(req.body.genre)) {
            req.body.genre = typeof req.body.genre === 'undefined' ? [] : [req.body.genre];
        }
        next();
    },

    // validate and sanitize fields
    body('title', 'Title must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('author', 'Author must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('summary', 'Summary must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('isbn', 'ISBN must not be empty')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('genre.*').escape(),

    // process request after validation and sanitization
    asyncHandler(async(req, res, next) => {
        // extract the validation errors from a request
        const errors = validationResult(req);

        // create a book object with escaped and trimmed data
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre,
        });

        if(!errors.isEmpty()) {
            // there are errors. Render the form again with sanitized values/error messages 

            // get all authors and genres for form
            const [allAuthors, allGenres] = await Promise.all([
                Author.find().sort({ family_name: 1 }).exec(),
                Genre.find().sort({ name: 1 }).exec(),
            ]);

            // mark our selected genres as checked
            for(const genre of allGenres) {
                if(book.genre.includes(genre._id)) {
                    genre.checked = 'true';
                }
            }
            
            res.render('book_form', {
                title: 'Create Book',
                authors: allAuthors,
                genres: allGenres,
                book: book,
                errors: errors.array(),
            })
        }
        else {
            // data from form is valid. save book.
            await book.save();
            res.redirect(book.url);
        }
    })
];

// display book delete form on GET
exports.book_delete_get = asyncHandler(async(req, res, next) => {
    const [book, allRelatedInstances] = await Promise.all([
        Book.findById(req.params.id).exec(),
        BookInstance.find({ book: req.params.id }).exec(),
    ]);

    if(book === null) {
        res.redirect('/catalog/books');
    }

    res.render('book_delete', {
        title: 'Delete Book',
        book: book,
        related_instances: allRelatedInstances,
    })
})

// display book delete form on POST
exports.book_delete_post = asyncHandler(async(req, res, next) => {
    const [book, allRelatedInstances] = await Promise.all([
        Book.findById(req.params.id).exec(),
        BookInstance.find({ book: req.params.id }).exec(),
    ]);

    if(allRelatedInstances.length > 0) {
        // book has related bookinstances
        res.render('book_delete', {
            title: 'Delete Book',
            book: book,
            related_instances: allRelatedInstances,
        });
        return;
    }
    else {
        await Book.findByIdAndDelete(req.body.bookid);
        res.redirect('/catalog/books');
    }
});

// display book update form on GET
exports.book_update_get = asyncHandler(async(req, res, next) => {
    // get book, authors, and genres for form
    const [book, allAuthors, allGenres] = await Promise.all([
        Book.findById(req.params.id).populate('author').exec(),
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
    ]);

    if(book === null) {
        // no results
        const err = new Error('Book not found');
        err.status = 404;
        return next(err);
    }

    // mark our selected genres as checked
    allGenres.forEach((genre) => {
        if(book.genre.includes(genre._id)) genre.checked = 'true';
    });

    res.render('book_form', {
        title: 'Update Book',
        authors: allAuthors,
        genres: allGenres,
        book: book,
    });
});

// handle book update on POST
exports.book_update_post = [
    // convert the genre to an array
    (req, res, next) => {
        if(!Array.isArray(req.body.genre)) {
            req.body.genre = typeof req.body.genre === 'undefined'? [] : [req.body.genre];
        }
        next();
    },

    // validate and sanitize fields
    body('title', 'Title must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('author', 'Author must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('summary', 'Sumary must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('isbn', 'ISBN must not be empty')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('genre.*').escape(),

    // process request after validation and sanitization
    asyncHandler(async(req, res, next) => {
        // extract the validation errors from a request.
        const errors = validationResult(req);

        // create a book object with escaped/trimmed data and old id.
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: typeof req.body.genre === 'undefined' ? [] : req.body.genre,
            _id: req.params.id, // this is required, ot a new ID will be assigned
        });

        if(!errors.isEmpty()) {
            // there are errors. render form again with sanitized values/error messages

            // get all authors and genres for form
            const [allAuthors, allGenres] = await Promise.all([
                Author.find().sort({ family_name: 1 }).exec(),
                Genre.find().soft({ name: 1 }).exec(),
            ]);

            // mark our selected genres as checked
            for(const genre of allGenres) {
                if(book.genre.indexOf(genre._id) > -1) {
                    genre.checked = 'true';
                }
            }
            res.render('book_form', {
                title: 'Update Book',
                authors: allAuthors,
                genres: allGenres,
                book: book,
                errors: errors.array(),
            })
            return;
        }
        else {
            // data from form is valid. update the record
            const updatedBook = await Book.findByIdAndUpdate(req.params.id, book, {});
            // redirect to book detail page
            res.redirect(updatedBook.url);
        }
    }),
];