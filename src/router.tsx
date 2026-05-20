import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Landing } from './routes/Landing'
import { NodeView } from './routes/NodeView'
import { DraftView } from './routes/DraftView'
import { Login } from './routes/Login'
import { AdminImport } from './routes/AdminImport'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'p/*', element: <NodeView /> },
      { path: 'draft', element: <DraftView /> },
      { path: 'login', element: <Login /> },
      { path: 'admin/import-characters', element: <AdminImport /> },
    ],
  },
])
