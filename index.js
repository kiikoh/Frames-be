require("dotenv").config()
const flatten = require('flat')

const express = require("express");
const app = express();

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const Airtable = require('airtable');
const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE);

const pick = (obj, keys) => Object.assign({}, ...keys.map(key => ({ [key]: obj[key] })))

app.use(express.json());

app.post("/placeorder", async (req, res) => {

    // TODO: validate stuff first 
    // if fails HTTP 400: Bad Request

    let {orderDetails, ...order} = req.body
    order = flatten(order)

    switch(order.type){
        case "art": {
            order = pick(order, ['course', 'type', 'color', 'size', 'holeIndex', 'imgSrc', 'email', 'notes'])
            break;
        }
        case "event": {
            order = pick(order, [
                'course', 'type', 'color', 'size', 'holeIndex', 'imgSrc', 'email', 'notes',
                'event.playerNames', 'event.awardName'
            ])
            break;
        }
        case "hio": {
            order = pick(order, [
                'course', 'type', 'color', 'size', 'holeIndex', 'imgSrc', 'email', 'notes',
                'hio.date', 'hio.playerName', 'hio.clubUsed', 'hio.witnesses.0', 'hio.witnesses.1', 'hio.witnesses.2', 'hio.distance'
            ])
            break;
        }
        default: {
            res.status(400).send("Invalid Order Type")
        }
    }

    for(let key in order) {
        order[key] = String(order[key])
    }

    console.log(order)

    sgMail
        .send({
            to: req.body.email, 
            from: process.env.FROM_EMAIL,
            cc: process.env.CC_EMAIL,
            template_id: "d-0f57292c8eaf473ea842e6937676ac04",
            asm: {
                groupId: 16532 // orders unsubscribe group
            },
            dynamic_template_data: {
                orderDetails
            }
        })
        .then(() => {
            console.log('Email sent to ' + req.body.email);
            res.status(201).send() // HTTP 201: Created
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(); // HTTP 500: Internal Server Error
        })

    order.holeIndex = String(order.holeIndex)

    base.table("Orders").create(order, (err, record) => {
        if(err) 
            console.error(err);
        else 
            console.log("Saved to airtable" + record.OrderID)
    })
})

app.listen(3001, () => console.log("listening on port 3001"))