const express = require('express');

const app = express();

var admin = require("firebase-admin");

var serviceAccount = require("./share-log-c2f07-firebase-adminsdk-y2cx8-2df23b785e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://share-log-c2f07.firebaseio.com"
});

app.get('/', (req, res) => {
  res.status(200).send('Hello, world!').end();
});

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const authenticate = (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    res.status(403).send('Unauthorized');
    return;
  }
  const idToken = req.headers.authorization.split('Bearer ')[1];
  admin.auth().verifyIdToken(idToken).then(decodedIdToken => {
    req.user = decodedIdToken;
    next();
  }).catch(error => {
    res.status(403).send('Unauthorized');
  });
};

app.use(authenticate);

app.get('/api/logs', (req, res) => {
  let ref = admin.database().ref(`/log/${req.user.uid}`);

  ref.once('value')
      .then((logsSnapshot) => {
        let logs = logsSnapshot.val();

        res.status(200).json(logs);
      })
      .catch((error) => {
        console.log(error);

        res.sendStatus(500);
      });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
