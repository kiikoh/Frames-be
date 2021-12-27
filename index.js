require("dotenv").config()
const express = require("express");
const app = express();
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

app.use(express.json());

app.post("/placeorder", async (req, res) => {

    // TODO: validate stuff first 
    // if fails HTTP 400: Bad Request

    const msg = {
        to: req.body.email, 
        from: process.env.FROM_EMAIL,
        cc: process.env.CC_EMAIL,
        template_id: "d-0f57292c8eaf473ea842e6937676ac04",
        asm: {
            groupId: 16532 // orders unsubscribe group
        },
        dynamic_template_data: {
            orderDetails: req.body.orderDetails
        }
    }

    sgMail
        .send(msg)
        .then(() => {
            // TODO: store the order locally somewhere, or even better, in google sheets
            console.log('Email sent to ' + req.body.email);
            res.status(201).send() // HTTP 201: Created
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(); // HTTP 500: Internal Server Error
        })
})

app.listen(3001, () => console.log("listening on port 3001"))