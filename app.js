const express = require('express')
const request = require('request-promise')
const scheduler = require('node-schedule')

const { API, API_SECRET } = require('./config')

const app = express()

try {
  const JOBS = {
    SAVER: {
      endpoint: 'saver-run'
    },
    FETCHER: {
      endpoint: 'quovo-fetch-updates'
    },
    NOTIFIER: {
      endpoint: 'notifications-fire'
    },

    ASK_ALGO_BOOST: {
      endpoint: 'notifications-ask-boost'
    },
    MONTHLY_STATEMENT: {
      endpoint: 'notifications-monthly-statement'
    },
    DAILY_OKR: {
      endpoint: 'manual-echo-okr'
    }
  }

  const getSchedulerRule = frequency => {
    const rule = new scheduler.RecurrenceRule()
    rule.tz = 'UTC'
    rule.hour = 14
    rule.minute = 0
    switch (frequency) {
      default:
      case 'SAVER':
        break
      case 'NOTIFIER':
        rule.hour = 15
        break
      case 'FETCHER':
        rule.hour = 10
        break

      case 'ASK_ALGO_BOOST':
        rule.date = 15
        rule.hour = 16
        break
      case 'MONTHLY_STATEMENT':
        rule.date = 1
        rule.hour = 16
        break
      case 'DAILY_OKR':
        rule.hour = 13
        rule.minute = 0
        break
    }
    return rule
  }

  const fire = job => {
    const now = new Date(Date.now())
    console.log(`Scheduler running for the job ${job} at ${now.toString()}`)

    const apiSecret = { secret: API_SECRET }

    request.post({
      uri: `${API}/admin/${JOBS[job].endpoint}`,
      body: { ...apiSecret },
      json: true
    })

    request.post({
      uri: `${API}/admin/manual-notify-about-scheduler-run`,
      body: { ...apiSecret, data: { job } },
      json: true
    })
  }

  // Schedule jobs
  Object.keys(JOBS).map(job => {
    const rule = getSchedulerRule(job)
    scheduler.scheduleJob(rule, () => fire(job))
  })
} catch (error) {
  if (error.stack) console.log(error.stack)
  else console.log(error)
}

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason)
})

app.listen(3001)
