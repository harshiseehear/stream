import { Navigate } from 'react-router-dom'

// Home.jsx is now a redirect — the actual layout lives in components/Layout/HomeLayout.jsx
// Graph view: components/Graph/GraphView.jsx
// Table view: components/Table/TableView.jsx
export default function Home() {
  return <Navigate to="/home/graph" replace />
}
