import { compose } from '@lambda-middleware/compose'
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
  const endpoint = pathRewrite(event.path)

  const queryParameters = {
    ...event.queryStringParameters,
    format: 'json',
    key: /GetAppList/.test(endpoint)
      ? (Math.random() + 1).toString(36).substring(7)
      : apiKey,
  }

  const url = `${apiUrl}${endpoint}?${qs.stringify(queryParameters)}`
  console.log(`Sending request to ${url}`)

  const response = await fetch(url, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  })

  const data = await response.json()
  return {
    body: JSON.stringify(data, null, 2),
    statusCode: response.status,
  }
}

export const handler = compose(
  // Middlewares
  auth(),
)(steam)
