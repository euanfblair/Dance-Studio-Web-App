const notFound = (req, res) => {
  res.status(404)
    .type('text/plain')
    .send('404 Not found.');
};

const serverError = (err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500)
    .type('text/plain')
    .send('Internal Server Error.');
};

module.exports = { notFound, serverError };