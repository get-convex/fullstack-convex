import '../styles/globals.css'
import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '../components/errors'
import { ConvexReactClient } from 'convex/react'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
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
if (!address)
  throw new Error('Set NEXT_PUBLIC_CONVEX_URL: have you run `npx convex dev`?')
const convex = new ConvexReactClient(address)

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  return (
    <>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ConvexAuthProvider client={convex}>
          {<Component {...pageProps} />}
        </ConvexAuthProvider>
      </ErrorBoundary>
    </>
  )
}

export default MyApp
