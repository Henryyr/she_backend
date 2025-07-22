const paginateQuery = async (pool, sql, countSql, params = [], countParams = [], page = 1, limit = 10) => {
  limit = Math.min(limit, 100);
  const offset = (page - 1) * limit;

  const [data] = await pool.query(sql + ' LIMIT ? OFFSET ?', [...params, limit, offset]);
  const [count] = await pool.query(countSql, countParams);

  return {
    data,
    pagination: {
      total: count[0].total,
      page,
      limit,
      totalPages: Math.ceil(count[0].total / limit)
    }
  };
};

module.exports = paginateQuery;
