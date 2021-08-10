/**
 * Dependencies:
 *  nodemon - refresh without having to stop and restart the servers, saved in dev so it is not installed in production (--save-dev)
 *  express - basically a framework for node.js that allows developers to create servers/middleware
 *  cors    - enables cross origin resource sharing
 *  dotenv  - to read .env variabled
 *
 *  spotify-web-api-node
 */

//imports
const express = require("express");
const cors = require("cors");
const lyricsFinder = require("lyrics-finder");
const SpotifyWebApi = require("spotify-web-api-node");
const detectRyhmes = require("rhyme-detector");

require("dotenv").config();

//express
const app = express();

//middleware, basically the .use is excuted every request
//in other words, middleware is a general request reciever
//express.json() converts request body to json
app.use(cors());
app.use(express.json());
app.use(
	express.urlencoded({
		extended: true,
	})
);

/**
 * Using the code that was returned from spotify authentication we will request a access and refresh token using
 * spotify-web-api-node's .authorizationCodeGrant function.
 */

let clientIDs = process.env.CLIENT_ID;
let clientSecrets = process.env.CLIENT_SECRET;
let domainURI = process.env.DOMAIN_URI;
let redirectURI = domainURI + process.env.REDIRECT_PATH;

/**
 * Handes login
 */
app.post("/login", (req, res) => {
	const code = req.body.code;
	const spotifyWebApi = new SpotifyWebApi({
		clientId: clientIDs,
		clientSecret: clientSecrets,
		redirectUri: redirectURI,
	});
	if (code === undefined) {
		res.sendStatus(402);
		return;
	}
	spotifyWebApi
		.authorizationCodeGrant(code)
		.then((data) => {
			console.log("Got access token! \n ");
			res.json({
				accessToken: data.body.access_token,
				refreshToken: data.body.refresh_token,
				expiresIn: data.body.expires_in,
			});
		})
		.catch((e) => {
			console.log(
				"-> spotifyApi.authorizationCodeGrant Error:: \n\t" +
					`->${code}` +
					e +
					"\n"
			);
			res.sendStatus(400);
		});
});

//Refreshing the token when it expires, so the user doesn't have to keep logging in everytime the token expires.
app.post("/refresh", (req, res) => {
	console.log(
		"The access token has been refreshed! " +
			new Date().getMinutes() +
			":" +
			new Date().getSeconds()
	);
	const refreshToken = req.body.refreshToken;
	const spotifyApi = new SpotifyWebApi({
		redirectUri: redirectURI,
		clientId: clientIDs,
		clientSecret: clientSecrets,
		refreshToken,
	});

	spotifyApi
		.refreshAccessToken()
		.then((data) => {
			res.json({
				accessToken: data.body.access_token,
				refreshToken: data.body.refresh_token,
			});
		})
		.catch((e) => {
			console.log("Spotify Refresh Access Token: \n\t" + e + "\n");
			res.sendStatus(400);
		});
});

app.post("/refresh2", (req, res) => {
	console.log(
		"The access token has been refreshed! " +
			new Date().getMinutes() +
			":" +
			new Date().getSeconds()
	);
	res.json({
		accessToken: "dfjksdlfjljdslj",
		refreshToken: 3600,
	});
});

app.post("/lyrics", (req, res) => {
	let title = req.body.title;
	let artist = req.body.artist;
	if ([title, artist].includes(undefined)) {
		res.sendStatus(402);
		return;
	}
	(async function (artist, title) {
		let lyrics = (await lyricsFinder(artist, title)) || "not found";
		let rhymes = detectRyhmes(lyrics);
		res.send({
			lyrics: lyrics,
			rhymes: rhymes,
		});
	})(artist, title);
});

app.listen(process.env.PORT);
