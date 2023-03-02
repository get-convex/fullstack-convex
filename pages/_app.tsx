import { Inter } from 'next/font/google'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '../components/errors'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ConvexProviderWithAuth0 } from 'convex/react-auth0'
import convexConfig from '../convex.json'

const address = process.env.NEXT_PUBLIC_CONVEX_URL
if (!address) throw new Error('Convex URL not found')
const convex = new ConvexReactClient(address)

const inter = Inter({ subsets: ['latin'], variable: '--inter-font' })

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className={inter.className}>
        <ConvexProviderWithAuth0
          client={convex}
          authInfo={convexConfig.authInfo[0]}
          loggedOut={
            // ConvexProviderWithAuth0 only connects to Convex if the user is logged in.
            // So for the logged-out case where users can still read some public data,
            // we need to explicitly wrap the logged-out app in a regular ConvexProvider
            <ConvexProvider client={convex}>
              <Component {...pageProps} />
            </ConvexProvider>
          }
        >
          <Component {...pageProps} />
        </ConvexProviderWithAuth0>
      </div>
    </ErrorBoundary>
  )
}

export default MyApp
