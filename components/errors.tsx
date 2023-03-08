import React from 'react'
import Link from 'next/link'
import { useRouter, type NextRouter } from 'next/router'
import { Header } from './login'

const getTitle = (name: string, message: string, location?: string) =>
  `${name}: ${message}${location ? ` (${location})` : ''}`

function newBugLink(
  name: string,
  message: string,
  router: NextRouter,
  callStack?: string[],
  location?: string
) {
  const base =
    'https://github.com/get-convex/fullstack-convex/issues/new?labels=bug'

  const title = getTitle(name, message, location)
  const body = `Please add any additional details you'd like to share about this error:%0A`

  const stackTrace = callStack
    ? `%0A%0A%0A%0A%0A
------%0A
Please do not edit below this line%0A%0A
Path: <code>${router.isReady ? router.asPath : router.pathname}</code>%0A%0A
<details>%0A
<summary>Stack trace:</summary>%0A
<pre>%0A
${callStack.join('%0A')}
</pre>%0A
</details>
`
    : ''

  return `${base}&title=${title}&body=${body + stackTrace}`
}

export function ErrorFallback({ error }: { error: Error }) {
  const router = useRouter()

  const { name, message, stack } = error
  const callStack = stack?.split('\n')
  const location = callStack ? callStack[0].split('/').pop() : undefined

  return (
    <main>
      <div role="alert">
        <Header user={null} />
        <div className="error">
          <h3>Oops! Unexpected error</h3>
          <pre>{getTitle(name, message, location)}</pre>
          <p>
            (Optional)&nbsp;Let the team know about this problem by submitting
            a&nbsp;
            <Link
              href={newBugLink(name, message, router, callStack, location)}
              target="_blank"
            >
              bug report
            </Link>
            {'  ↗️'}
          </p>
        </div>
      </div>
    </main>
  )
}
