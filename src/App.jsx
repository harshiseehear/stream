import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './theme/ThemeContext'
import HomeLayout from './components/Layout/HomeLayout'
import GraphView from './components/Graph/GraphView'
import TableView from './components/Table/TableView'
import Login from './pages/Login'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<HomeLayout />}>
            <Route index element={<Navigate to="graph" replace />} />
            <Route path="graph" element={<GraphView />} />
            <Route path="table" element={<TableView />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
