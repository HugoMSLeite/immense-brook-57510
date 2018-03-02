'use strict';

// Imports dependencies and set up http server
const
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express().use(bodyParser.json()), // creates express http server
    request = require('request'),
    handleMessage = require('./modules/handle-message'),
    handlePostback = require('./modules/handle-post-back'),
    components = require('./modules/components'),
    PAGE_TOKEN = 'EAACgWBaTX5YBAGjTIX6kAwd3zCxDZBonCp8L94x0Us1ZBZBDdDldWvQhv3g2WsZCFuQ3uarcuifeX08mfy9ThMiat4Bp09bE7DDp7iOZBZARQ8LEO0jMxTkMwc7sswcQHUJgb8mwm4pZALwNyohLI6NBM4zY6FUJjWu0TxhZBUeMplRiErqkdZCdy'

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'))

app.get('/', (req, res) => {
    res.status(200).send('Server Running')
})

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {

    let body = req.body
        // Checks this is an event from a page subscription
    if (body.object === 'page') {

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {

            // Gets the message. entry.messaging is an array, but 
            // will only ever contain one message, so we get index 0
            let webhook_event = entry.messaging[0]

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id
            console.log('Sender PSID: ' + sender_psid)

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message, callSendAPI)
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback, callSendAPI)
            }
        })

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED')
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404)
    }

})

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "verificacao"

    // Parse the query params
    let mode = req.query['hub.mode']
    let token = req.query['hub.verify_token']
    let challenge = req.query['hub.challenge']

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED')
            res.status(200).send(challenge)

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403)
        }
    }
})

function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": PAGE_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err)
        }
    })
}