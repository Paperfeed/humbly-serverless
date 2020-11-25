import { PromiseHandler } from '@lambda-middleware/utils'
import { APIGatewayEvent, Context } from 'aws-lambda'

export const auth = () => <R>(handler: PromiseHandler) => async (
  event: APIGatewayEvent,
  context: Context,
): Promise<R> => {
  try {
    const { APP_ID: appId } = process.env

    if (event.headers.appid !== appId) {
      throw new Error('Unauthorized request')
    }

    return handler(event, context)
  } catch (error) {
    console.log('Unauthorized request')
    error.statusCode = 401
    throw error
  }
}
