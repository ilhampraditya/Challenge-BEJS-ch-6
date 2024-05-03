const router = require("express").Router();
const restrict = require("../middlewares/auth.middlewares")
const { image } = require("../libs/multer");

const { register, login, auth, allUser, detailUser, updateUser, updateAvatar, deleteUser } = require("../controllers/users.controllers");
router.post("/users", register);
router.post("/auth/login", login);
router.get("/auth/authenticate", restrict, auth);
router.get("/users", allUser);
router.get("/users/:id",restrict, detailUser);
router.put("/users/:id", restrict, updateUser);
router.put("/users/:id/avatar", restrict, image.single('image'), updateAvatar);
router.delete("/users/:id", restrict, deleteUser);


const { createBook, allBook, detailBook, updateBook, deleteBook, searchBook,} = require('../controllers/books.controllers')
router.post("/books",restrict, image.single('file'), createBook);
router.get("/books",restrict, allBook );
router.get("/books/search",restrict, searchBook);
router.get("/books/:id",restrict, detailBook);
router.put("/books/:id", restrict ,image.single('file'), updateBook);
router.delete("/books/:id", restrict, deleteBook);


module.exports = router;