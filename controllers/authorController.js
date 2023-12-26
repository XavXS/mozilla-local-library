const Author = require('../models/author');
const Book = require('../models/book');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

// display list of all authors
exports.author_list = asyncHandler(async(req, res, next) => {
    const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
    res.render('author_list', {
        title: 'Author List',
        author_list: allAuthors,
    });
});

// display detail page for a specific author
exports.author_detail = asyncHandler(async(req, res, next) => {
    // get details of author and all their books (in parallel)
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, 'title summary').exec(),
    ]);

    if(author === null) {
        // no results
        const err = new Error('Author not found');
        err.status = 404;
        return next(err);
    }

    res.render('author_detail', {
        title: 'Author Detail',
        author: author,
        author_books: allBooksByAuthor,
    });
});

// display author create form on get
exports.author_create_get = (req, res, next) => {
    res.render('author_form', { title: 'Create Author' });
};

// handle author create on post
exports.author_create_post = [
    // validate and sanitize fields
    body('first_name')
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage('First name must be specified.')
        .isAlphanumeric()
        .withMessage('First name has non-alphanumeric characters'),
    body('family_name')
        .trim()
        .isLength({ min: 1})
        .escape()
        .withMessage('Family name must be specified')
        .isAlphanumeric()
        .withMessage('Family name has non-alphanumeric characters'),
    body('date_of_birth', 'Invalid date of birth')
        .optional({ values: 'falsy' })
        .isISO8601()
        .toDate(),
    body('date_of_death', 'Invalid date of death')
        .optional({ values: 'falsy' })
        .isISO8601()
        .toDate(),
    
    // process request after validation and sanitization
    asyncHandler(async(req, res, next) => {
        // extract the validation errors from a request
        const errors = validationResult(req);

        // create author object with escaped and trimmed data
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
        });

        if(!errors.isEmpty()) {
            // there are errors. render form again with sanitized values/errors messages.
            res.render('author_form', {
                title: 'Create Author',
                author: author,
                errors: errors.array(),
            });
            return;
        }
        else {
            // data from form is valid

            // save author
            await author.save();
            // redirect to new author record
            res.redirect(author.url);
        }
    })
];

// display author delete form on get
exports.author_delete_get = asyncHandler(async(req, res, next) => {
    // get details of author and all their books (in parallel)
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, 'title summary').exec(),
    ]);

    if(author === null) {
        // No results.
        res.redirect('/catalog/authors');
    }

    res.render('author_delete', {
        title: 'Delete Author',
        author: author,
        author_books: allBooksByAuthor,
    });
});

// handle author delete on post
exports.author_delete_post = asyncHandler(async(req, res, next) => {
    // get details of author and all their books
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, 'title summary').exec(),
    ]);

    if(allBooksByAuthor.length > 0) {
        // author has books. render in same way as for get route
        res.render('author delete', {
            title: 'Delete Author',
            author: author,
            author_books: allBooksByAuthor,
        });
        return;
    }
    else {
        // author has no books. delete object and redirect ot the list of authors
        await Author.findByIdAndDelete(req.body.authorid);
        res.redirect('/catalog/authors');
    }
});

// display author update form on get
exports.author_update_get = asyncHandler(async(req, res, next) => {
    const author = await Author.findById(req.params.id).exec();

    if(author === null) {
        const err = new Error('Author not found');
        err.status = 404;
        return next(err);
    }

    res.render('author_form', {
        title: 'Update Author',
        author: author,
    })
});

// handle author update on post
exports.author_update_post = [
    body('first_name')
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage('First name must be specified.')
        .isAlphanumeric()
        .withMessage('First name has non-alphanumeric characters'),
    body('family_name')
        .trim()
        .isLength({ min: 1})
        .escape()
        .withMessage('Family name must be specified')
        .isAlphanumeric()
        .withMessage('Family name has non-alphanumeric characters'),
    body('date_of_birth', 'Invalid date of birth')
        .optional({ values: 'falsy' })
        .isISO8601()
        .toDate(),
    body('date_of_death', 'Invalid date of death')
        .optional({ values: 'falsy' })
        .isISO8601()
        .toDate(),

    asyncHandler(async(req, res, next) => {
        const errors = validationResult(req);
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id,
        });

        if(!errors.isEmpty()) {
            // there are errors. render form again with sanitized values/errors messages.
            res.render('author_form', {
                title: 'Update Author',
                author: author,
                errors: errors.array(),
            });
            return;
        }
        else {
            // save author
            const updatedAuthor = await Author.findByIdAndUpdate(req.params.id, author, {});
            // redirect to new author record
            res.redirect(updatedAuthor.url);
        }
    })
];