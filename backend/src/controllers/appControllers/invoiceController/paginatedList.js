const mongoose = require('mongoose');

const Model = mongoose.model('Invoice');

const escapeRegex = (str) => String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const paginatedList = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip = page * limit - limit;

  const { sortBy = 'date', sortValue = -1, filter, equal } = req.query;

  const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];
  const q = req.query.q !== undefined ? String(req.query.q).trim() : '';

  let fields = {};
  if (fieldsArray.length > 0 && q) {
    const escaped = escapeRegex(q);
    fields = {
      $or: fieldsArray.map((field) => ({
        [field]: { $regex: new RegExp(escaped, 'i') },
      })),
    };
  }

  const filterCondition = filter && equal !== undefined ? { [filter]: equal } : {};

  // Query the database for a list of all results
  const resultsPromise = Model.find({
    removed: false,
    ...filterCondition,
    ...fields,
  })
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortValue })
    .populate('createdBy', 'name')
    .exec();

  // Counting the total documents
  const countPromise = Model.countDocuments({
    removed: false,
    ...filterCondition,
    ...fields,
  });

  // Resolving both promises
  const [result, count] = await Promise.all([resultsPromise, countPromise]);
  // Calculating total pages
  const pages = Math.ceil(count / limit) || 1;

  // Getting Pagination Object
  const pagination = { page, pages, count };

  return res.status(200).json({
    success: true,
    result: result || [],
    pagination,
    message: count > 0 ? 'Successfully found all documents' : 'Collection is Empty',
  });
};

module.exports = paginatedList;

