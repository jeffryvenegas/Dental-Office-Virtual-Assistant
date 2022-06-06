// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');

const { QnAMaker } = require('botbuilder-ai');
const DentistScheduler = require('./dentistscheduler');
const IntentRecognizer = require("./intentrecognizer")

class DentaBot extends ActivityHandler {
    constructor(configuration, qnaOptions) {
        // call the parent constructor
        super();
        if (!configuration) throw new Error('[QnaMakerBot]: Missing parameter. configuration is required');

        // create a QnAMaker connector
        this.QnAMaker = new QnAMaker(configuration.QnAConfiguration, qnaOptions)
       
        // create a DentistScheduler connector
      
        // create a IntentRecognizer connector


        this.onMessage(async (context, next) => {
            // Send user input to QnA Maker
            const qnaResults = await this.QnAMaker.getAnswers(context);
            // If an answer was received from QnA Maker, send the answer back to the user.
            if (qnaResults[0]) {
                console.log(qnaResults[0])
                await context.sendActivity(`${qnaResults[0].answer}`);
            }
            else {
                // If no answers were returned from QnA Maker, reply with help.
                await context.sendActivity(`I'm not sure`
                    + 'I found an answer to your question'
                    + `You can ask me questions about our dental office, like "Can I be seen if I don't have insurance?"`);
            }
            await next();
        });

        this.onMembersAdded(async (context, next) => {
        const membersAdded = context.activity.membersAdded;
        const welcomeText = 'Welcome to Contoso Dentistry. I can help you see our availability for an appointment. You can say "Show me available dates next week"';
        for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
            if (membersAdded[cnt].id !== context.activity.recipient.id) {
                await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
            }
        }
        // by calling next() you ensure that the next BotHandler is run.
        await next();
    });
    }
}

module.exports.DentaBot = DentaBot;
