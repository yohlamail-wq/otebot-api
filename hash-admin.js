const bcrypt = require('bcrypt');

const password = 'MonSuperMotDePasse456!';

bcrypt.hash(password, 10).then(hash => {
  console.log('HASH =', hash);
});
