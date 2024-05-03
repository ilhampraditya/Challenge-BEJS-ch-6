const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const imageKit = require("../libs/imagekit");
const path = require("path");
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;

module.exports={
    register: async (req, res, next) => {
        try {
            const { first_name, last_name, email, password } = req.body;

            const exist = await prisma.user.findUnique({
                where: { email },
            });

            if (!first_name || !last_name || !email || !password) {
                return res.status(400).json({
                    status: false,
                    message: "Input must be required",
                    data: null,
                });
            } else if (exist) {
                return res.status(401).json({
                    status: false,
                    message: "Email already used!",
                });
            }

            let encryptedPassword = await bcrypt.hash(password, 10);
            const user = await prisma.user.create({
                data: {
                    first_name,
                    last_name,
                    email,
                    password: encryptedPassword,
                },
            });
            delete user.password;

            res.status(201).json({
                status: true,
                message: "User Created Successfully",
                data: user,
            });
        } catch (error) {
            next(error);
        }
    },

    login: async (req, res, next) => {
        try {
            let { email, password } = req.body;
            let user = await prisma.user.findFirst({ where: { email } });
            if (!user) {
                return res.status(400).json({
                    status: false,
                    message: "invalid email or password",
                    data: null,
                });
            }

            let isPasswordCorrect = await bcrypt.compare(password, user.password);
            if (!isPasswordCorrect) {
                return res.status(400).json({
                    status: false,
                    message: "invalid email or password",
                    data: null,
                });
            }

            delete user.password;
            let token = jwt.sign(user, JWT_SECRET_KEY);

            return res.status(201).json({
                status: true,
                message: "success",
                data: { ...user, token },
            });
        } catch (error) {
            next(error);
        }
    },

    auth: async (req, res, next) => {
        try {
            return res.status(200).json({
                status: true,
                message: "OK",
                data: req.user,
            });
        } catch (error) {
            next(error);
        }
    },

    allUser: async (req, res, next) => {
        try {
            const user = await prisma.user.findMany()
            res.status(200).json({
                status: true,
                message: "success",
                data: user,
            })
        } catch (error) {
            next(error)
        }
    },

    detailUser: async (req, res, next) => {
        const id = Number(req.params.id);
        try {
            const user = await prisma.user.findUnique({
                where: { id },
            });

            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: `User with id ${id} not found`,
                    data: null,
                });
            }
            delete user.password;
            res.status(200).json({
                status: true,
                message: "success",
                data: user,
            });
        } catch (error) {
            next(error);
        }
    },

    updateUser: async (req, res, next) => {
        const id = Number(req.params.id);
        try {
            const { first_name, last_name, email, address, occupation } = req.body;

            if (!first_name && !last_name && !email && !address && !occupation) {
                return res.status(400).json({
                    status: false,
                    message: "At least one data must be provided for update",
                    data: null,
                });
            }

            const exist = await prisma.user.findUnique({
                where: { id },
            });

            if (!exist) {
                return res.status(404).json({
                    status: false,
                    message: `User with id ${id} not found`,
                    data: null,
                });
            }

            const user = await prisma.user.update({
                where: { id },
                data: {
                    first_name,
                    last_name,
                    email,
                    address,
                    occupation,
                },
            });
            delete user.password;
            res.status(200).json({
                status: true,
                message: "User updated successfully",
                data: user,
            });
        } catch (error) {
            next(error);
        }
    },

    updateAvatar: async (req, res, next) => {
        try {
            const params = Number(req.params.id); 
            const avatar = req.file.buffer.toString("base64");
            const user = await prisma.user.findUnique({
                where: { id: params }, 
            });

            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: `User with id ${params} not found`, 
                    data: null,
                });
            }

            let { url } = await imageKit.upload({
                fileName: Date.now() + path.extname(req.file.originalname),
                file: avatar,
            });

            const updatedUser = await prisma.user.update({
                where: {
                    id: params 
                },
                data: { avatar_url: url },
            });
            delete updatedUser.password;

            res.status(200).json({
                status: true,
                message: "Avatar updated successfully",
                data: updatedUser,
            });
        } catch (error) {
            next(error);
        }
    },

    deleteUser: async (req, res, next) => {
        const id = Number(req.params.id);
        try {
            const exist = await prisma.user.findUnique({
                where: { id },
                include: { book: true },
            });

            if (!exist) {
                return res.status(404).json({
                    status: false,
                    message: `User with id ${id} not found`,
                    data: null,
                });
            }

            // Delete book from Prisma
            await prisma.book.deleteMany({
                where: { user_id: id },
            });

            // Delete user from Prisma
            await prisma.user.delete({
                where: { id },
            });

            res.status(200).json({
                status: true,
                message: "User and associated images deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    },

    }

