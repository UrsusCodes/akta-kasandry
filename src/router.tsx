import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Landing } from './routes/Landing'
import { ShelfView } from './routes/ShelfView'
import { BookView } from './routes/BookView'
import { ChapterView } from './routes/ChapterView'
import { PageView } from './routes/PageView'
import { MapView } from './routes/MapView'
import { DraftView } from './routes/DraftView'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Landing /> },
      { path: 's/:shelf', element: <ShelfView /> },
      { path: 's/:shelf/b/:book', element: <BookView /> },
      { path: 's/:shelf/b/:book/c/:chapter', element: <ChapterView /> },
      { path: 's/:shelf/b/:book/c/:chapter/p/:page', element: <PageView /> },
      { path: 's/:shelf/b/:book/p/:page', element: <PageView /> },
      { path: 'map', element: <MapView /> },
      { path: 'draft', element: <DraftView /> },
    ],
  },
])
