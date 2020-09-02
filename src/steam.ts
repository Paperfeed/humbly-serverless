import middy from '@middy/core'
import { APIGatewayEvent } from 'aws-lambda'
import fetch from 'node-fetch'
import qs from 'qs'

import { auth } from './middleware/auth'

const pathRewrite = (path: string) => {
  let newPath = ''

  const replacementMap = {
    '/steam/getAppList': '/ISteamApps/GetAppList/v0002',
    '/steam/getOwnedGames': '/IPlayerService/GetOwnedGames/v0001', //&steamid=STEAM_ID
    '/steam/getSteamId': '/ISteamUser/ResolveVanityURL/v0001/', //&vanityurl=USER_NAME
  }

  Object.keys(replacementMap).some(
    (testString: keyof typeof replacementMap) => {
      if (new RegExp(testString).test(path)) {
        newPath = path.replace(testString, replacementMap[testString])
      }
    },
  )

  if (newPath !== path) {
    console.log(`Replaced ${path} -> ${newPath}`)
    return newPath
  }

  return path
}

async function steam(event: APIGatewayEvent /*, context: Context*/) {
  const { STEAM_API_URL: apiUrl, STEAM_API_KEY: apiKey } = process.env

  console.log(event.path)
  const endpoint = pathRewrite(event.path)

  console.log('ENDPOINT', endpoint)
  const queryParameters = {
    ...event.queryStringParameters,
    format: 'json',
    key: apiKey,
  }

  const url = `${apiUrl}${endpoint}?${qs.stringify(queryParameters)}`
  console.log(`Sending request to ${url}`)

  const response = await fetch(url, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  })

  console.log(response)
  const data = await response.json()
  return {
    body: JSON.stringify(data, null, 2),
    statusCode: response.status,
  }
}

export const handler = middy(steam).use(auth())
