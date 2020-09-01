import middy from '@middy/core'
import { APIGatewayEvent, Context } from 'aws-lambda'

import { auth } from './middleware/auth'
const axios = require('axios').default

async function igdb(event: APIGatewayEvent, context: Context, callback) {
  const { IGDB_API_URL: apiUrl, IGDB_API_KEY: apiKey } = process.env

  const endpoint = event.path.split('/')[2]
  try {
    console.log(
      `Sending request to ${apiUrl}/${endpoint}\n\nWith body: ${event.body}\nAPI Key: ${apiKey}`,
    )
    const response = await axios.post(`${apiUrl}/${endpoint}`, event.body, {
      headers: {
        Accept: 'application/json',
        'Access-Control-Allow-Origin': '*',
        'user-key': apiKey,
      },
    })

    return callback(null, {
      response: response,
      statusCode: 200,
    })
  } catch (error) {
    console.log('An error occurred:', JSON.stringify(error, null, 2))
    return callback({
      body: JSON.stringify(error),
      statusCode: 200,
    })
  }
}

export const handler = middy(igdb).use(auth())
