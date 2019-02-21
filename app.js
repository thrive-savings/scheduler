const express = require('express')
const request = require('request-promise')
const scheduler = require('node-schedule')

const { API, API_SECRET } = require('./config')

const app = express()

try {
  const FETCH_FREQUENCIES = [
    // Money pulling
    'ONCEWEEKLY',
    'TWICEWEEKLY',
    'BIWEEKLY',
    'ONCEMONTHLY',
    'ONCEDAILY',
    // Other tasks
    'ASK_ALGO_BOOST',
    'FIRE_NOTIFICATIONS',
    'FETCH_DAILY_UPDATES',
    'MONTHLY_STATEMENT'
  ]

  const convertFrequency = frequency => {
    const rule = new scheduler.RecurrenceRule()
    rule.tz = 'UTC'
    rule.hour = 14
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
      case 'ASK_ALGO_BOOST':
        rule.date = 15
        rule.hour = 16
        break
      case 'FIRE_NOTIFICATIONS':
        rule.hour = 15
        break
      case 'FETCH_DAILY_UPDATES':
        rule.hour = 10
        break
      case 'MONTHLY_STATEMENT':
        rule.date = 1
        rule.hour = 16
        break
      default:
        // ONCEWEEKLY
        rule.dayOfWeek = 1
        break
    }
    return rule
  }

  const fire = async frequencyWord => {
    const now = new Date(Date.now())
    console.log(
      `Scheduler running for frequency ${frequencyWord} at ${now.toString()}`
    )

    const apiSecret = { secret: API_SECRET }

    let command = 'worker-send-boost-notification'
    let commandBody = { ...apiSecret }

    if (frequencyWord === 'FIRE_NOTIFICATIONS') {
      command = 'notifications-fire'
    } else if (frequencyWord === 'FETCH_DAILY_UPDATES') {
      command = 'worker-fetch-daily-updates'
    } else if (frequencyWord === 'MONTHLY_STATEMENT') {
      command = 'worker-monthly-statement'
    } else if (frequencyWord !== 'ASK_ALGO_BOOST') {
      command = 'worker-run-frequency'
      commandBody.data = { frequencyWord }
    }

    await request.post({
      uri: `${API}/admin/${command}`,
      body: commandBody,
      json: true
    })

    request.post({
      uri: `${API}/admin/worker-notify-about-scheduler-run`,
      body: { ...apiSecret, data: { task: command } },
      json: true
    })
  }

  // Schedule jobs
  FETCH_FREQUENCIES.map(async frequencyWord => {
    const frequency = convertFrequency(frequencyWord)
    scheduler.scheduleJob(frequency, async () => {
      await fire(frequencyWord)
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
