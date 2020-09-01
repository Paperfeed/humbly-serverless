export function auth() {
  const { APP_ID: appId } = process.env

  return {
    before: (handler, next) => {
      if (handler.event.headers.appid !== appId) {
        console.log('Unauthorized request')
        return handler.callback(null, {
          body: JSON.stringify({
            error: 'Unauthorized',
          }),
          statusCode: 401,
        })
      }

      return next()
    },
  }
}
