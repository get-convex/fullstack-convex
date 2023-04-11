import '../styles/globals.css'
import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '../components/errors'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithAuth0 } from 'convex/react-auth0'
import { Auth0Provider } from '@auth0/auth0-react'
import type { ReactElement, ReactNode } from 'react'
import type { NextPage } from 'next'
import type { AppProps } from 'next/app'

export type NextPageWithLayout<P = unknown, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

const address = process.env.NEXT_PUBLIC_CONVEX_URL
if (!address) throw new Error('Convex URL not found')
const convex = new ConvexReactClient(address)

const authDomain = process.env.NEXT_PUBLIC_AUTH_DOMAIN as string
const authClient = process.env.NEXT_PUBLIC_AUTH_CLIENT as string
if (!authDomain) throw new Error('Auth domain not found')
if (!authClient) throw new Error('Auth client not found')

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  return (
    <>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Auth0Provider
          domain={authDomain}
          clientId={authClient}
          authorizationParams={{
            redirect_uri:
              typeof window === 'undefined'
                ? undefined
                : window.location.origin,
          }}
          useRefreshTokens={true}
          cacheLocation="localstorage"
        >
          <ConvexProviderWithAuth0 client={convex}>
            {<Component {...pageProps} />}
          </ConvexProviderWithAuth0>
        </Auth0Provider>
      </ErrorBoundary>
    </>
  )
}

export default MyApp
