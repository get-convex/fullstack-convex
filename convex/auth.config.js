export default {
  providers: [
    {
      applicationID: process.env.AUTH0_CLIENT_ID,
      domain: process.env.AUTH0_DOMAIN,
    },
  ],
}
