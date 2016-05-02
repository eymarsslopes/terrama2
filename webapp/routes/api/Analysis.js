var passport = require('../../config/Passport');

module.exports = function (app) {
  var controller = app.controllers.api.Analysis;

  app.get('/api/Analysis/', passport.isAuthenticated, controller.get);
  app.post('/api/Analysis/', passport.isAuthenticated, controller.post);
  app.delete('/api/Analysis/:id/delete', passport.isAuthenticated, controller.delete);
};
