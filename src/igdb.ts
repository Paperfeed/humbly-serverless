import middy from '@middy/core'
import { APIGatewayEvent } from 'aws-lambda'
import fetch from 'node-fetch'

import { auth } from './middleware/auth'

async function igdb(event: APIGatewayEvent /*, context: Context*/) {
  const { IGDB_API_URL: apiUrl, IGDB_API_KEY: apiKey } = process.env

  const endpoint = event.path.split('/')[2]
  console.log(
    `Sending request to ${apiUrl}/${endpoint}\n\nWith body: ${event.body}\nAPI Key: ${apiKey}`,
  )

  const response = await fetch(`${apiUrl}/${endpoint}`, {
    body: event.body,
    headers: {
      Accept: 'application/json',
      'Access-Control-Allow-Origin': '*',
      'user-key': apiKey,
    },
    method: 'POST',
  })

  const data = await response.json()
  return {
    body: JSON.stringify(data, null, 2),
    headers: {
      'content-type': 'application/json',
    },
    statusCode: response.status,
  }
}

export const handler = middy(igdb).use(auth())
