const express = require('express')
const request = require('request-promise')
const scheduler = require('node-schedule')

const { API, API_SECRET } = require('./config')

const app = express()

try {
  const FETCH_FREQUENCIES = [
    'ONCEWEEKLY',
    'TWICEWEEKLY',
    'BIWEEKLY',
    'ONCEMONTHLY',
    'ONCEDAILY'
  ]
  // const FETCH_FREQUENCIES = ['EVERYMINUTE']

  const convertFrequency = frequency => {
    const rule = new scheduler.RecurrenceRule()
    rule.tz = 'UTC'
    rule.hour = 10
    rule.minute = 0
    switch (frequency) {
      case 'ONCEWEEKLY':
        rule.dayOfWeek = 1
        break
      case 'TWICEWEEKLY':
        rule.dayOfWeek = [1, 3]
        break
      case 'BIWEEKLY':
        rule.date = [1, 15]
        break
      case 'ONCEMONTHLY':
        rule.date = 1
        break
      case 'ONCEDAILY':
        break
      case 'EVERYHOUR':
        rule.hour = null
        break
      case 'EVERYMINUTE':
        rule.hour = null
        rule.minute = new scheduler.Range(0, 59, 1)
        break
      default:
        // ONCEWEEKLY
        rule.dayOfWeek = 1
        break
    }
    return rule
  }

  // Schedule jobs
  FETCH_FREQUENCIES.map(async frequencyWord => {
    const frequency = convertFrequency(frequencyWord)
    scheduler.scheduleJob(frequency, async () => {
      console.log(`Scheduler running for frequency ${frequencyWord}`)
      await request.post({
        uri: `${API}/admin/worker-run-frequency`,
        body: { secret: API_SECRET, data: { frequencyWord } },
        json: true
      })
    })
  })
} catch (error) {
  if (error.stack) console.log(error.stack)
  else console.log(error)
}

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason)
})

app.listen(3001)
