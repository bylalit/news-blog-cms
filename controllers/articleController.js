const newsModel = require('../models/News');
const categoryModel = require('../models/Category');
const userModel = require('../models/User');
const createError = require('../utils/error-message');
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');

/* ================= ALL ARTICLES ================= */
const allArticle = async (req, res, next) => { 
    try {
        let articles;
        if (req.role === 'admin') {
            articles = await newsModel.find()
                .populate('category', 'name')
                .populate('author', 'fullname');
        } else {
            articles = await newsModel.find({ author: req.id })
                .populate('category', 'name')
                .populate('author', 'fullname');
        }
        res.render('admin/articles', { role: req.role, articles });
    } catch (error) {
        next(error);
    }
};

/* ================= ADD PAGE ================= */
const addArticlePage = async (req, res) => { 
    const categories = await categoryModel.find();
    res.render('admin/articles/create', { role: req.role, categories, errors: 0 });
};

/* ================= ADD ARTICLE ================= */
const addArticle = async (req, res, next) => { 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const categories = await categoryModel.find();
        return res.render('admin/articles/create', { 
            role: req.role, 
            categories, 
            errors: errors.array() 
        });
    }

    try {
        const { title, content, category } = req.body;

        const article = new newsModel({
            title,
            content,
            category,
            author: req.id,
            image: req.file.path,          // ✅ Cloudinary URL
            imageId: req.file.filename     // ✅ Cloudinary public_id
        });

        await article.save();
        res.redirect('/admin/article');
    } catch (error) {
        next(error);
    }
};

/* ================= UPDATE PAGE ================= */
const updateArticlePage = async (req, res, next) => { 
    try {
        const article = await newsModel.findById(req.params.id)
            .populate('category', 'name')
            .populate('author', 'fullname');

        if (!article) return next(createError('Article not found.', 404));

        if (req.role === 'author' && req.id != article.author._id) {
            return next(createError('You are not authorized.', 401));
        }

        const categories = await categoryModel.find();
        res.render('admin/articles/update', { role: req.role, article, categories, errors: 0 });
    } catch (error) {
        next(error);
    }
};

/* ================= UPDATE ARTICLE ================= */
const updateArticle = async (req, res, next) => { 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const article = await newsModel.findById(req.params.id);
        const categories = await categoryModel.find();
        return res.render('admin/articles/update', { 
            role: req.role, 
            article, 
            categories, 
            errors: errors.array() 
        });
    }

    try {
        const article = await newsModel.findById(req.params.id);
        if (!article) return next(createError('Article not found.', 404));

        if (req.role === 'author' && req.id != article.author._id) {
            return next(createError('You are not authorized.', 401));
        }

        const { title, content, category } = req.body;

        if (req.file) {
            // 🔥 Delete old image from Cloudinary
            if (article.imageId) {
                await cloudinary.uploader.destroy(article.imageId);
            }

            article.image = req.file.path;       // new image URL
            article.imageId = req.file.filename; // new public_id
        }

        article.title = title;
        article.content = content;
        article.category = category;

        await article.save();
        res.redirect('/admin/article');
    } catch (error) {
        next(error);
    }
};

/* ================= DELETE ARTICLE ================= */
const deleteArticle = async (req, res, next) => { 
    try {
        const article = await newsModel.findById(req.params.id);
        if (!article) return next(createError('Article not found.', 404));

        if (req.role === 'author' && req.id != article.author._id) {
            return next(createError('You are not authorized.', 401));
        }

        // 🔥 Delete image from Cloudinary
        if (article.imageId) {
            await cloudinary.uploader.destroy(article.imageId);
        }

        await article.deleteOne();
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    allArticle,
    addArticlePage,
    addArticle,
    updateArticlePage,
    updateArticle,
    deleteArticle
};
