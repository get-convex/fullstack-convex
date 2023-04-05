import { createContext, Context } from 'react'
import type { BackendEnvironment, AppData } from './types'

export const BackendContext = createContext(
  null
) as Context<BackendEnvironment | null>

export const DataContext = createContext(null) as Context<AppData | null>
