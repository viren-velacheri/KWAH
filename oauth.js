var WEB_HOST = process.env.WEB_HOST || "http://localhost:3000" ;
var GOOGLE_OAUTH2_CLIENT_ID = process.env.GOOGLE_OAUTH2_CLIENT_ID || 'YOUR_GOOGLE_OAUTH2_ID';
var GOOGLE_OAUTH2_CLIENT_SECRET = process.env.GOOGLE_OAUTH2_CLIENT_SECRET || 'YOUR_GOOGLE_OAUTH2_SECRET';

var FACEBOOK_OAUTH2_CLIENT_ID = process.env.FACEBOOK_OAUTH2_CLIENT_ID || 'YOUR_FACEBOOK_OAUTH2_ID';
var FACEBOOK_OAUTH2_CLIENT_SECRET = process.env.FACEBOOK_OAUTH2_CLIENT_SECRET || 'YOUR_FACEBOOK_OAUTH2_SECRET' ;

var ids = {
  mailgun: {
    api_key: 'YOUR_MAILGUN_APIKEY',
    domain :'YOUR_MAILGUN_DOMAIN'
  },
facebook: {
 clientID: FACEBOOK_OAUTH2_CLIENT_ID,
 clientSecret: FACEBOOK_OAUTH2_CLIENT_SECRET,
 callbackURL: WEB_HOST + "/auth/facebook/callback"
},
twitter: {
 consumerKey: 'get_your_own',
 consumerSecret: 'get_your_own',
 callbackURL: "http://127.0.0.1:1337/auth/twitter/callback"
},
google_oauth2: {
 authorizationURL:'https://accounts.google.com/o/oauth2/auth',
 tokenURL:'https://accounts.google.com/o/oauth2/token',
 clientID: GOOGLE_OAUTH2_CLIENT_ID,
 clientSecret: GOOGLE_OAUTH2_CLIENT_SECRET,
 callbackURL: WEB_HOST + "/auth/google/callback"
},
google: {
 returnURL: 'http://localhost:3000/auth/google/callback',
 realm: 'http://localhost:3000'
}
}

module.exports = ids
