import { compose } from '@lambda-middleware/compose'
import { APIGatewayEvent, ProxyHandler } from 'aws-lambda'
import fetch from 'node-fetch'

import { auth } from './middleware/auth'
import { twitchToken } from './middleware/twitch_token'

async function igdb(event: APIGatewayEvent /*, context: Context*/) {
  const { IGDB_API_URL: apiUrl } = process.env

  const endpoint = event.path.split('/')[2]
  const url = `${apiUrl}/${endpoint}`
  console.log(`Sending request to ${url}\n\nWith body: ${event.body}`)

  const response = await fetch(`${url}`, {
    body: event.body,
    headers: {
      Accept: 'application/json',
      'Access-Control-Allow-Origin': '*',
      Authorization: `Bearer ${event.headers.Authorization}`,
      'Client-ID': event.headers.clientID,
    },
    method: 'POST',
  })

  const data = await response.json()

  console.log(`Received data response:\n${JSON.stringify(data, null, 2)}`)
  return {
    body: JSON.stringify(data, null, 2),
    headers: {
      'content-type': 'application/json',
    },
    statusCode: response.status,
  }
}

export const handler: ProxyHandler = compose(
  // Middlewares
  auth(),
  twitchToken(),
)(igdb)
