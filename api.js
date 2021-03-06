const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')({
  origin: true,
  credentials: true
});

const router = express.Router();

router.use(cors);

var admin = require("firebase-admin");

var serviceAccount = require("./share-log-c2f07-firebase-adminsdk-y2cx8-2df23b785e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://share-log-c2f07.firebaseio.com"
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

router.use(authenticate);

router.get('/logs', (req, res) => {
  let ref = admin.database().ref(`/log/${req.user.uid}`);

  ref.once('value')
      .then((logsSnapshot) => {
        let logs = logsSnapshot.val();

        for (let logId in logs) {
          logs[logId].key = logId;
        }

        res.status(200).json(logs);
      })
      .catch((error) => {
        console.log(error);

        res.sendStatus(500);
      });
});

router.get('/log', bodyParser.urlencoded(), (req, res) => {
  let ref = admin.database().ref(`/log/${req.user.uid}/${req.query.logId}`);

  ref.once('value')
      .then((logSnapshot) => {
        let log = logSnapshot.val();

        res.status(200).json({success: true, log: log});
      })
      .catch((error) => {
        console.log(error);

        res.status(200).json({success: false});
      });
});

router.post('/log', bodyParser.json(), (req, res) => {
  let ref = admin.database().ref(`/log/${req.user.uid}`);

  if (req.body.logId) {
    ref = ref.child(req.body.logId);
  } else {
    ref = ref.push();
  }

  ref.set(req.body.log)
      .then(() => {
        res.status(200).json({success: true});
      })
      .catch((error) => {
        console.log(error);

        res.status(200).json({success: false});
      });
});

module.exports = router;
