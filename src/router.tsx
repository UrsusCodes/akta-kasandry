import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Landing } from './routes/Landing'
import { NodeView } from './routes/NodeView'
import { DraftView } from './routes/DraftView'
import { Login } from './routes/Login'
import { AdminImport } from './routes/AdminImport'
import { Sessions } from './routes/Sessions'
import { SessionView } from './routes/SessionView'
import { SummaryDemo } from './routes/SummaryDemo'
import { QuotesDemo } from './routes/QuotesDemo'
import { UG2Summary } from './routes/UG2Summary'
import { UG2Narracja } from './routes/UG2Narracja'
import { UG2Presentation } from './routes/UG2Presentation'

// Match the Vite base so deep links work under the GitHub Pages subpath
// (/akta-kasandry/…) in prod and at root (/) in dev.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppShell />,
      children: [
        { index: true, element: <Landing /> },
        { path: 'p/*', element: <NodeView /> },
        { path: 'sesje', element: <Sessions /> },
        { path: 'sesje/:slug', element: <SessionView /> },
        { path: 'streszczenie-demo', element: <SummaryDemo /> },
        { path: 'streszczenie-demo/cytaty', element: <QuotesDemo /> },
        { path: 'streszczenie-ug2', element: <UG2Summary /> },
        { path: 'streszczenie-ug2/narracja', element: <UG2Narracja /> },
        { path: 'prezentacja/ug2', element: <UG2Presentation /> },
        { path: 'draft', element: <DraftView /> },
        { path: 'login', element: <Login /> },
        { path: 'admin/import-characters', element: <AdminImport /> },
      ],
    },
  ],
  { basename },
)
