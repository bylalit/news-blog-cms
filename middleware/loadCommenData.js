const newsModel = require('../models/News');
const categoryModel = require('../models/Category');
const settingModel = require('../models/Setting');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 3600 });

const loadCommonData = async (req, res, next) => {
  try {
    let latestNews = cache.get('latestNewsCache');
    let categories = cache.get('categoriesCache');
    let settings = cache.get('settingsCache');

    /* ================= LATEST NEWS ================= */
    if (!latestNews) {
      latestNews = await newsModel
        .find()
        .populate('category', 'name slug')
        .populate('author', 'fullname')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      cache.set('latestNewsCache', latestNews);
    }

    /* ================= SETTINGS ================= */
    if (!settings) {
      settings = await settingModel.findOne().lean();
      cache.set('settingsCache', settings);
    }

    /* ================= CATEGORIES ================= */
    if (!categories) {
      const categoriesInUse = await newsModel.distinct('category');
      categories = await categoryModel
        .find({ _id: { $in: categoriesInUse } })
        .lean();

      cache.set('categoriesCache', categories);
    }

    /* ================= LOCALS ================= */
    res.locals.latestNews = latestNews || [];
    res.locals.categories = categories || [];
    res.locals.settings = settings || {};

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = loadCommonData;
