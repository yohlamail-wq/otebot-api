const bcrypt = require('bcrypt');

const password = 'TON_MOT_DE_PASSE_ICI';

bcrypt.hash(password, 10).then(hash => {
  console.log('HASH =', hash);
});
