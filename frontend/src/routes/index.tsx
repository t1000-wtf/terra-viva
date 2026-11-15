import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'

// Pages
import DashboardPage from '../pages/dashboard/DashboardPage'
import { ProfilePage } from '../pages/Profile'
import { PropertiesPage } from '../pages/Properties'
import { PropertyDetailPage } from '../pages/PropertyDetail'
import { PlotDetailPage } from '../pages/PlotDetail'
import CropsPage from '../pages/crops/CropsPage'
import CropDetailPage from '../pages/crops/CropDetailPage'
import PrioritiesPage from '../pages/priorities/PrioritiesPage'
import EnvironmentalPage from '../pages/environmental/EnvironmentalPage'
import SocialPage from '../pages/social/SocialPage'
import { EconomicPage } from '../pages/Economic'
import { RecommendationsPage } from '../pages/Recommendations'
import { DiagnosticsPage } from '../pages/Diagnostics'
import AssistantPage from '../pages/assistant/AssistantPage'
import SourcesPage from '../pages/sources/SourcesPage'
import HistoryPage from '../pages/history/HistoryPage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
        <Route path="/properties/:propertyId/plots/:plotId" element={<PlotDetailPage />} />
        <Route path="/crops" element={<CropsPage />} />
        <Route path="/crops/:cropId" element={<CropDetailPage />} />
        <Route path="/plots/:plotId/history" element={<HistoryPage />} />
        <Route path="/priorities" element={<PrioritiesPage />} />
        <Route path="/environmental/:propertyId" element={<EnvironmentalPage />} />
        <Route path="/social/:propertyId" element={<SocialPage />} />
        <Route path="/economic" element={<EconomicPage />} />
        <Route path="/recommendations/:plotId" element={<RecommendationsPage />} />
        <Route path="/diagnostics/:propertyId" element={<DiagnosticsPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/sources" element={<SourcesPage />} />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
