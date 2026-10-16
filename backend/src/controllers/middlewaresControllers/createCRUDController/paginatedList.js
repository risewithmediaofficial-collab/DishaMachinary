const escapeRegex = (str) => String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const paginatedList = async (Model, req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip = page * limit - limit;

  const { sortBy = 'enabled', sortValue = -1, filter, equal } = req.query;

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

  // Build filter condition safely: reject MongoDB operators in values
  let filterCondition = {};
  if (filter && equal !== undefined) {
    if (typeof equal === 'object') {
      return res.status(400).json({
        success: false,
        result: [],
        message: 'Invalid filter value',
      });
    }
    filterCondition = { [filter]: equal };
  }

  // Query the database for a list of all results
  const resultsPromise = Model.find({
    removed: false,
    ...filterCondition,
    ...fields,
  })
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortValue })
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
