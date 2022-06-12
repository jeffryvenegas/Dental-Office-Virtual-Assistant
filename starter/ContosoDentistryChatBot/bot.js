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
        if (!configuration) throw new Error('[QnaMakerBot]: Missing parameter. configuration is required')

        // create a QnAMaker connector
        this.QnAMaker = new QnAMaker(configuration.QnAConfiguration, qnaOptions)
       
        // create a DentistScheduler connector
        this.DentistScheduler = new DentistScheduler(configuration.SchedulerConfiguration)
        
        // create a IntentRecognizer connector
        this.IntentRecognizer = new IntentRecognizer(configuration.LuisConfiguration)

        this.onMessage(async (context, next) => {
            // Send user input to QnA Maker
            const qnaResults = await this.QnAMaker.getAnswers(context);

            // send user input to LUIS
            const LuisResult = await this.IntentRecognizer.executeLuisQuery(context);

            // Determine which service to respond with //
            if (LuisResult.luisResult.prediction.topIntent === "GetAvailability" &&
                LuisResult.intents.GetAvailability.score > .6 &&
                LuisResult.entities.$instance && 
                LuisResult.entities.$instance.availability && 
                LuisResult.entities.$instance.availability[0]
            ) {
                let date = "today";
                if(LuisResult.entities.$instance.date)
                    date = LuisResult.entities.$instance?.date[0].text;
                // call api to view availability
                // An improvement is to parse the date from natural language ('today','tomorrow')
                // and send the selected date to get times for specific day.
                const availableAppointments = await this.DentistScheduler.getAvailability(date);
                await context.sendActivity(availableAppointments);
                await next();
                return;
            }

            if (LuisResult.luisResult.prediction.topIntent === "ScheduleAppointment" &&
                LuisResult.intents.ScheduleAppointment.score > .6 &&
                LuisResult.entities.$instance && 
                LuisResult.entities.$instance.time && 
                LuisResult.entities.$instance.time[0]
            ) {
                const time = LuisResult.entities.$instance.time[0];
                // call api to schedule appointment at selected time
                const scheduledAppointment = await this.DentistScheduler.scheduleAppointment(time);
                const message = scheduledAppointment ? `Appointment was scheduled at ${time}` : "We could not schedule your appointment. Please try again."
                await context.sendActivity(message);
                await next();
                return;
            }

            // If an answer was received from QnA Maker, send the answer back to the user.
            else if (qnaResults && qnaResults[0]) {
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
        const welcomeText = 'Welcome to Contoso Dentistry. I can help you see our availability and schedule an appointment. You can say "Show me available spaces for tomorrow"';
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
