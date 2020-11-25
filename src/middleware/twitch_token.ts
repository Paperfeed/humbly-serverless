/* eslint-disable @typescript-eslint/camelcase */
import { PromiseHandler } from '@lambda-middleware/utils'
import { APIGatewayEvent, Context } from 'aws-lambda'
import faunadb, { query as q } from 'faunadb'
import fetch from 'node-fetch'

export type WithTwitchToken = APIGatewayEvent & {
  headers: APIGatewayEvent['headers'] & {
    Authorization: string
    clientID: string
  }
}

type FaunaResponse<T> = {
  data: T
  ref: object
}

export const twitchToken = <T extends object>() => <R>(
  handler: PromiseHandler<WithTwitchToken, R>,
) => async (event: APIGatewayEvent, context: Context): Promise<R> => {
  try {
    const {
      IGDB_CLIENT_SECRET: clientSecret,
      IGDB_CLIENT_ID: clientID,
      IGDB_OAUTH_URL: oauthUrl,
      FAUNADB_SERVER_SECRET: faunaServerKey,
    } = process.env

    console.log('Trying to retrieve token from DB')
    const serverClient = new faunadb.Client({ secret: faunaServerKey })
    const response = await serverClient.query<
      FaunaResponse<{ expires: string; token: string }>
    >(q.Get(q.Ref(q.Collection('tokens'), '283018855080526337')))
    const data = response.data
    let Authorization: string

    if (parseInt(data.expires) <= Date.now()) {
      console.log('Token expired, retrieving a new one')
      const twitchResponse = await fetch(
        `${oauthUrl}?client_id=${clientID}&client_secret=${clientSecret}&grant_type=client_credentials`,
        { method: 'POST' },
      )

      // eslint-disable-next-line @typescript-eslint/camelcase
      const {
        access_token: accessToken,
        expires_in: expiryTime,
      } = await twitchResponse.json()

      Authorization = accessToken

      await serverClient.query(
        q.Update(q.Ref(q.Collection('tokens'), '283018855080526337'), {
          data: {
            expires: `${Date.now() + parseInt(expiryTime) * 1000}`,
            token: Authorization,
          },
        }),
      )
    } else {
      console.log(
        `Token is valid until ${new Date(
          parseInt(data.expires),
        ).toLocaleDateString()}`,
      )
      Authorization = data.token
    }

    console.log('Retrieved access token from FaunaDB', data.token)
    console.log('Requesting OAuth response from Twitch')

    return handler(
      {
        ...event,
        headers: {
          ...event.headers,
          Authorization,
          clientID,
        },
      },
      context,
    )
  } catch (error) {
    console.error(error)
    throw error
  }
}
