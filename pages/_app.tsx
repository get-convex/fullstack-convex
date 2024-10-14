import '../styles/globals.css';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '../components/errors';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithAuth0 } from 'convex/react-auth0';
import { Auth0Provider } from '@auth0/auth0-react';
import type { ReactElement, ReactNode } from 'react';
import type { NextPage } from 'next';
import type { AppProps, AppContext } from 'next/app';
import App from 'next/app';

export type NextPageWithLayout<P = unknown, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
  authDomain: string;
  authClient: string;
};

const address = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!address) throw new Error('Convex URL not found');
const convex = new ConvexReactClient(address);

function MyApp({ Component, pageProps, authDomain, authClient }: AppPropsWithLayout) {
  return (
    <>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Auth0Provider
          domain={authDomain}
          clientId={authClient}
          authorizationParams={{
            redirect_uri: typeof window === 'undefined' ? undefined : window.location.origin,
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
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const authDomain = process.env.NEXT_PUBLIC_AUTH_DOMAIN || process.env.AUTH0_DOMAIN as string;
  const authClient = process.env.NEXT_PUBLIC_AUTH_CLIENT || process.env.AUTH0_CLIENT_ID as string;

  if (!authDomain) {
    throw new Error('Auth domain not found');
  }
  if (!authClient) {
    throw new Error('Auth client not found');
  }
  const appProps = await App.getInitialProps(appContext);
  return { ...appProps, authDomain, authClient };
};

export default MyApp;
