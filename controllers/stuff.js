const Book = require('../models/Book');
const fs = require('fs');

exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then(books => {
      res.status(200).json(books);
    })
    .catch(error => {
      res.status(500).json({ error });
    });
};


exports.rateBook = async (req, res, next) => {
  const userId = req.auth.userId;
  const rating = req.body.rating;
  const bookId = req.params.id;

  if (rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'Invalid rating. Rating must be between 0 and 5.' });
  }

  try {
    const book = await Book.findOne({ _id: bookId });

    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    const userRating = book.ratings.find(rating => rating.userId === userId);

    if (userRating) {
      return res.status(400).json({ message: 'User has already rated this book.' });
    }

    // Mettez à jour la note et la moyenne de notation du livre
    book.ratings.push({ userId, grade: rating });

    const totalRating = book.ratings.reduce((sum, rating) => sum + rating.grade, 0);
    book.averageRating = totalRating / book.ratings.length;

    // Sauvegardez les modifications du livre
    await book.save();

    // Chargez à nouveau le livre avec les données complètes
    const ratedBook = await Book.findOne({ _id: bookId });

    // Renvoyez les données du livre complètes
    res.status(200).json(ratedBook);
  } catch (error) {
    res.status(500).json({ error });
  }
};



exports.createThing = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;

  bookObject.averageRating = 0;

  const optimizedFileName = req.file.filename.replace(/\.\w+$/, '_optimized.jpg');
  const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${optimizedFileName}`
  });
  book.save()
  .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
  .catch(error => { res.status(400).json( { error })})
};

exports.getOneThing = (req, res, next) => {
  Book.findOne({
    _id: req.params.id
  }).then(
    (book) => {
      res.status(200).json(book);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.modifyThing = (req, res, next) => {
  const bookObject = req.file ? {
    ...JSON.parse(req.body.book),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename.replace(/\.\w+$/, '_optimized.jpg')}`
  } : { ...req.body };

  delete bookObject._userId;

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: 'Not authorized' });
      } else {
        // Supprimer l'ancienne image optimisée (si elle existe)
        if (book.imageUrl) {
          const previousOptimizedFileName = book.imageUrl.split('/images/')[1];
          
          fs.unlink(`images/${previousOptimizedFileName}`, (err) => {
            if (err) {
              console.error(`Erreur lors de la suppression de l'image optimisée précédente : ${err}`);
            }
          });
        }

        // Mettre à jour l'URL avec le nouveau nom de fichier optimisé
        if (req.file) {
          bookObject.imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename.replace(/\.\w+$/, '_optimized.jpg')}`;
        }

        Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet modifié!' }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};




exports.deleteThing = (req, res, next) => {
  Book.findOne({ _id: req.params.id})
    .then(book => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({message: 'Not authorized'});
      } else {
        const filename = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          const optimizedFilename = filename.replace(/\.\w+$/, '_optimized.jpg');
          fs.unlink(`images/${optimizedFilename}`, () => {
            Book.deleteOne({_id: req.params.id})
              .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
              .catch(error => res.status(401).json({ error }));
          });
        });
      }
    })
    .catch( error => {
      res.status(500).json({ error });
    });
};


exports.getAllStuff = (req, res, next) => {
  Book.find().then(
    (books) => {
      res.status(200).json(books);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};