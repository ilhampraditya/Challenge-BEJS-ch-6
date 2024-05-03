const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const imagekit = require("../libs/imagekit");
const path = require("path");

module.exports={
    createBook: async (req, res, next) => {
        try {
            const { judul, deskripsi } = req.body;

            // Validation if title or description is not included in the request body
            if (!judul || !deskripsi) {
                return res.status(400).json({
                    status: false,
                    message: "Title and description must be included in the request body.",
                });
            }

            // Validation if file is not found in the request
            if (!req.file) {
                return res.status(400).json({
                    status: false,
                    message: "File not found in the request.",
                });
            }

            let strFile = req.file.buffer.toString("base64");

            // Upload file using imagekit
            let { url } = await imagekit.upload({
                fileName: Date.now() + path.extname(req.file.originalname),
                file: strFile,
            });

            // Create book entry in the database using Prisma
            const data = await prisma.book.create({
                data: {
                    judul,
                    deskripsi,
                    imageUrl: url,
                    user_id: req.user.id
                },
            });

            // Send response with success status
            return res.status(201).json({
                status: true,
                message: "Book successfully created",
                data: data,
            });

        } catch (error) {
            next(error)
        }
    },

 allBook: async (req, res, next) => {
        try {
            const books = await prisma.book.findMany()
            res.status(200).json({
                status: true,
                message: "success",
                data: books,
            })
        } catch (error) {
            next(error)
        }
    },

searchBook: async (req, res, next) => {
        try {
            const { search } = req.query;
            const book = await prisma.book.findMany({
                where: { judul: { contains: search, mode: "insensitive" } },
            });

            book.forEach((books) => {
                delete books.id;
            });
            res.status(200).json({
                status: true,
                message: "success",
                data: book,
            });


        } catch (error) {
            next(error)

        }
    },

detailBook: async (req, res, next) => {
        try {
            const id = Number(req.params.id)
            const books = await prisma.book.findUnique({
                where: { id },
            })

            if (!books) {
                return res.status(404).json({
                    status: false,
                    message: `Book with id ${id} not found`,
                    data: null,
                })
            }
            res.status(200).json({
                status: true,
                message: "success",
                data: books,
            })
        } catch (error) {
            next(error)
        }
    },

updateBook: async (req, res, next) => {
        const id = Number(req.params.id);
        const { judul, deskripsi } = req.body;
        try {
            if (!judul && !deskripsi && !req.file) {
                return res.status(400).json({
                    status: false,
                    message: "At least one data must be provided for update",
                    data: null,
                });
            }

            // Check if the book with the given ID exists
            const exist = await prisma.book.findUnique({
                where: { id },
            });

            if (!exist) {
                return res.status(404).json({
                    status: false,
                    message: `Book with id ${id} not found`,
                    data: null,
                });
            }

            let imageUrl = exist.imageUrl;

            // If there is a new file, upload it to ImageKit and get the new URL
            if (req.file) {
                let strFile = req.file.buffer.toString("base64");
                const { url } = await imagekit.upload({
                    fileName: Date.now() + path.extname(req.file.originalname),
                    file: strFile,
                });
                imageUrl = url;
            }

            // Update the book in the database
            const book = await prisma.book.update({
                where: { id },
                data: {
                    judul: judul || exist.judul,
                    deskripsi: deskripsi || exist.deskripsi,
                    imageUrl: imageUrl,
                },
            });

            res.status(200).json({
                status: true,
                message: "Book updated successfully",
                data: book,
            });
        } catch (error) {
            next(error);
        }
    },

    deleteBook: async (req, res, next) => {
        const id = Number(req.params.id)
        try {
            const exist = await prisma.book.findUnique({
                where: { id },
            })

            if (!exist) {
                return res.status(404).json({
                    status: false,
                    message: `Books with id ${id} not found`,
                    data: null,
                })
            }

            await prisma.book.delete({
                where: { id },
            })

            res.status(200).json({
                status: true,
                message: "Book deleted successfully",
                data: null,
            })

        } catch (error) {
            next(error)
        }
    }

}



