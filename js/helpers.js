require('dotenv').config()

const DB_CONSTANTS = {
  TAGS_DB,
  TAGS_CONNECT_DB,
  EVENTS_DB,
  SPEAKERS_DB,
  SPEAKERS_CONNECT_DB,
  ORGANIZATIONS_DB,
  CATEGORIES_DB,
  SEARCH_EVENTS_DB,
  CITIES_DB,
  COUNTRIES_DB,
  EVENTS_INFO_VIEW,
  ORDERS_DB,
  CHIRO_TIX_SETTINGS_DB,
  USERS_DB,
  TICKETS_TYPE_DB,
} = process.env;
const HOST_URL = process.env.HOST_URL

/**
* @param {function} fn - Async function to be wrapped into an error catching function.
*
* @returns {function} Error catching function wrapping the original function.
*/
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

function notFoundHandler(req, res, next) {
  console.warn('Not found', req.originalUrl);
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, req, res, next) { 
  console.error(err);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid json' });
  }

  return res.status(500).json({ success:false,error: 'Internal server error' });
}

function isValidDate(d){
  return d instanceof Date && !isNaN(d);
}






module.exports = {
  catchErrors,
  notFoundHandler,
  errorHandler,
  isValidDate,
  DB_CONSTANTS,
  HOST_URL
}
