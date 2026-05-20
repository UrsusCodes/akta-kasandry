import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Landing } from './routes/Landing'
import { NodeView } from './routes/NodeView'
import { MapView } from './routes/MapView'
import { DraftView } from './routes/DraftView'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'p/*', element: <NodeView /> },
      { path: 'map', element: <MapView /> },
      { path: 'draft', element: <DraftView /> },
    ],
  },
])
