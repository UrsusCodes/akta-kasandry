import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Landing } from './routes/Landing'
import { NodeView } from './routes/NodeView'
import { DraftView } from './routes/DraftView'
import { Login } from './routes/Login'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'p/*', element: <NodeView /> },
      { path: 'draft', element: <DraftView /> },
      { path: 'login', element: <Login /> },
    ],
  },
])
