const checkApiKey = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Usamos res.clientError
    return res.clientError(401, 'API Key missing');
  }

  const token = authHeader.split(' ')[1];

  if (token !== process.env.USER_API_KEY && token !== process.env.DEV_API_KEY) {
    return res.clientError(403, 'Invalid API Key');
  }

  // Pasar el tipo de usuario
  if (token === process.env.USER_API_KEY) {
    req.userType = "user";
  } else if (token === process.env.DEV_API_KEY) {
    req.userType = "developer";
  }

  next();
};

module.exports = checkApiKey;
