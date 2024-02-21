const nodemailer = require( 'nodemailer' )
const otpGenerator = require( 'otp-generator' )
require( 'dotenv' ).config()

const transporter = nodemailer.createTransport({
    service : 'gmail',
    auth : {
        user : process.env.AUTH_MAIL,
        pass : process.env.PASS
    }

});

function generateOtp () {
    try {
        const otp =  otpGenerator.generate( 6, {
            upperCaseAlphabets : false,
            lowerCaseAlphabets : false,
            specialChars : false
    
        })
        return otp
    } catch (error) {
        res.redirect('/500')

    }
}

module.exports = {

    sendEmail : (email) => {
        try {
            const otp = generateOtp()
            console.log(otp)
             transporter.sendMail({
                to : email,
                from : process.env.AUTH_MAIL,
                subject : 'OTP verification',
                html : ` <h1> hey, Your OTP is ${otp}</h1><br>
                <p> Note : The OTP only valid for 30 Seconds !!! </p>
                `
            })
             return otp
        } catch (error) {
            res.redirect('/500')
        }

    }
}