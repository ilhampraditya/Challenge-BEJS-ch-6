const multer = require("multer");

const generateFileFilter = (mimetypes) => {
    return (req, file, callback) => {
        if (!mimetypes.includes(file.mimetype)) {
            let err = new Error(`Only ${mimetypes} are allowed to upload!`);
            return callback(err, false);
        }

        if (parseInt(req.headers["content-length"]) > 5000000) {
            let err = new Error(`Maximum file size is 5 MB!`);
            return callback(err, false);
        }

        callback(null, true);
    };
};

const image = multer({
    fileFilter: generateFileFilter(['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml']),
    onError: (err, next) => {
        next(err);
    }
});

module.exports = {
    image
};