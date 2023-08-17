const express = require('express');
const stuffCtrl = require('../controllers/stuff');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');


router.post('/', auth, multer.upload, multer.optimizeImage, stuffCtrl.createThing);
router.post('/:id/rating', auth, stuffCtrl.rateBook);
router.get('/bestrating', stuffCtrl.getBestRatedBooks);
router.get('/', stuffCtrl.getAllStuff);
router.get('/:id', stuffCtrl.getOneThing);
router.put('/:id', auth, multer.upload, multer.optimizeImage, stuffCtrl.modifyThing);
router.delete('/:id', auth, stuffCtrl.deleteThing);

module.exports = router;