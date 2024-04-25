const {OAuth2Client} = require('google-auth-library');

const client = new OAuth2Client();

// async function verify(t) {
//   const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
//       // Or, if multiple clients access the backend:
//       //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
//   });
//   const payload = ticket.getPayload();
//   const userid = payload['sub'];
//   // If the request specified a Google Workspace domain:
//   // const domain = payload['hd'];
// }
// verify().catch(console.error);


module.exports.verifyGoogleToken = async (token)=>{
try {
    const ticket = await client.verifyIdToken({
        idToken : token,
        audience : process.env.GOOGLE_CLIENT_ID
    });
    const payLoad = ticket.getPayload()
    return payLoad
} catch (error) {
    console.error(error)
}
}