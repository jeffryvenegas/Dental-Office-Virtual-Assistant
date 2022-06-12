class DentistScheduler {
    constructor(configuration) {
        this.getAvailability = async (date) => {
            const response = await fetch(configuration.SchedulerEndpoint + "availability")
            const times = await response.json()
            let responseText = `Current time slots available for ${date}: `
            responseText += times.join(', ');
            return responseText
        }

        this.scheduleAppointment = async (time) => {
            const response = await fetch(configuration.SchedulerEndpoint + "schedule", { method: "post", body: { time: time } })
            let responseText = `An appointment was created for ${time}.`
            return responseText
        }
    }
}

module.exports = DentistScheduler