const axios = require("axios");
const User = require("../models/User");
const config = require("../config/config");
const path = require('path');
const fs = require('fs');

// const { saveTokens } = require("../utils/tokenUtils");
require('dotenv').config(); 

const tokensFilePath = path.join(__dirname, 'tokens.json');

const getStoredTokens = () => {
  if (fs.existsSync(tokensFilePath)) {
    const tokensData = fs.readFileSync(tokensFilePath);
    return JSON.parse(tokensData);
  }
  return null;
};

const saveTokens = (tokens) => {
  fs.writeFileSync(tokensFilePath, JSON.stringify(tokens, null, 2));
};

const refreshAccessToken = async (refreshToken) => {

  console.log("ssssssssssssssssssssssssssssssssssssssss", refreshToken);
  
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientsecret = process.env.HUBSPOT_CLIENT_SECRET;
  try {
    const response = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
      params: {
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientsecret,
        refresh_token: refreshToken,
      },
    });

    const { access_token, expires_in } = response.data;
    console.log('New Access Token:', access_token);
    console.log('Expires in:', expires_in);

    // Update stored tokens securely
    saveTokens({ accessToken: access_token, refreshToken, expiresAt: Date.now() + expires_in * 1000 });

    return access_token;

  } catch (error) {
    console.error('Error refreshing access token:', error.response ? error.response.data : error.message);
    throw error;
  }
};

exports.authorize = (req, res) => {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const redirectUri = process.env.HUBSPOT_REDIRECT_URI;
  const scopes = process.env.scopes;
  // console.log(clientId);
  if (clientId !== undefined) {
     const authorizationUrl =  'https://app-na2.hubspot.com/oauth/authorize?client_id=08b2c303-792b-42f1-b0ec-f7ddbf53f4b3&redirect_uri=https://frontend-build-fawn.vercel.app/api/auth/oauth-callback&scope=content%20automation%20oauth%20crm.objects.contacts.read';
    res.status(200).json({"redirect_url": authorizationUrl}); 
  } else {  
    // Handle case where clientId is undefined, perhaps return a 400 or 500 error  
    res.status(400).json({ error: "Client ID is undefined" });  
}  
};

exports.oauthCallback = async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  const redirectUri = process.env.HUBSPOT_REDIRECT_URI;

  console.log("save");
  const formData = {
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code: code
  };
  try {
  const response = await axios.post('https://api.hubapi.com/oauth/v1/token', new URLSearchParams(formData), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const { access_token, refresh_token, expires_in } = response.data;

    saveTokens({ accessToken: access_token, refreshToken: refresh_token, expiresAt: Date.now() + expires_in * 1000 });
    console.log(access_token);
    console.log(refresh_token);

    // res.status(200).json(access_token);
    // console.log("success");
    // res.redirect('/success');
    // res.setHeader( 'Content—Type' , 'text/html' );
    // res.write('<hd>Succesfully installed integration, you can close the page</h4>');
    // res.end();
    // res.redirect(`http://localhost:3000/authorize?accessToken=${access_token}`);
    res.redirect(`http://localhost:3001`);

  } catch (error) {
    console.error("Error during OAuth callback:", error.message);
    res.status(500).send("Error during OAuth process");
  }
};
exports.reauthorize = async(req, res) => {
  try {
    let tokens = getStoredTokens();

    if (!tokens) {
      console.error('No tokens found. Please authenticate first.');
      return;
    }

    let { accessToken, refreshToken, expiresAt } = tokens;
    if (Date.now() >= expiresAt) {
      console.log("rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", refreshToken, expiresAt );
      accessToken = await refreshAccessToken(refreshToken);
    }
    res.json(accessToken);

  } catch (error) {
    console.error('Error making API call:', error.response ? error.response.data : error.message);
  }
};
