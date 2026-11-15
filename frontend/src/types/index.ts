// ==================== Auth ====================
export interface Token {
  access_token: string
  token_type: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
  full_name?: string
  phone?: string
  role?: string
}

// ==================== User ====================
export interface User {
  id: number
  name: string
  email: string
  phone?: string
  role?: string
  full_name?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface FarmerProfile {
  id: number
  user_id: number
  cpf?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  bio?: string
  created_at: string
  updated_at?: string
}

// ==================== Property ====================
export interface Property {
  id: number
  owner_id: number
  name: string
  description?: string
  total_area_ha: number
  cultivated_area_ha?: number
  country?: string
  state: string
  municipality: string
  ibge_code?: string
  latitude: number
  longitude: number
  boundary_geojson?: Record<string, any>
  created_at: string
  updated_at?: string
  // Legacy / optional aliases for backward compatibility
  address?: string
  city?: string
  zip_code?: string
  car_number?: string
}

export interface PropertyCreate {
  name: string
  description?: string
  total_area_ha: number
  cultivated_area_ha?: number
  country?: string
  state: string
  municipality: string
  ibge_code?: string
  latitude: number
  longitude: number
  boundary_geojson?: Record<string, any>
  // Legacy / optional aliases
  address?: string
  city?: string
  zip_code?: string
  car_number?: string
}

// ==================== Plot ====================
export interface Plot {
  id: number
  property_id: number
  name: string
  area_ha: number
  boundary_geojson?: Record<string, any>
  soil_type?: string
  soil_texture?: string
  ph?: number
  organic_matter_pct?: number
  water_retention_capacity?: string
  drainage?: string
  slope_pct?: number
  current_crop?: string
  irrigation_system?: string
  created_at?: string
  updated_at?: string
  // Legacy / optional aliases
  description?: string
  irrigation_type?: string
  coordinates?: string
}

export interface PlotCreate {
  property_id?: number
  name: string
  area_ha: number
  boundary_geojson?: Record<string, any>
  soil_type?: string
  soil_texture?: string
  ph?: number
  organic_matter_pct?: number
  water_retention_capacity?: string
  drainage?: string
  slope_pct?: number
  current_crop?: string
  irrigation_system?: string
  // Legacy / optional aliases
  description?: string
  irrigation_type?: string
  coordinates?: string
}

// ==================== Crop Catalog ====================
export interface CropCatalog {
  id: number
  name: string
  common_name?: string
  scientific_name?: string
  category?: string
  description?: string
  avg_cycle_days?: number
  cycle_days?: number
  water_requirement_mm?: number
  drought_tolerance?: string
  heat_tolerance?: string
  estimated_cost_per_ha_brl?: number | null
  market_liquidity?: string
  management_complexity?: string
  water_requirement?: string
  climate_requirements?: string
  created_at: string
}

// ==================== Crop History ====================
export interface CropHistory {
  id: number
  plot_id: number
  crop_catalog_id?: number
  crop_name: string
  variety?: string
  planting_date?: string
  harvest_date?: string
  expected_harvest_date?: string
  area_planted_ha?: number
  production_kg?: number
  productivity_kg_ha?: number
  revenue?: number
  cost?: number
  profit?: number
  notes?: string
  status?: string
  created_at: string
  updated_at?: string
  crop?: CropCatalog
}

export interface CropHistoryCreate {
  plot_id: number
  crop_catalog_id?: number
  crop_name: string
  variety?: string
  planting_date?: string
  harvest_date?: string
  expected_harvest_date?: string
  area_planted_ha?: number
  production_kg?: number
  productivity_kg_ha?: number
  revenue?: number
  cost?: number
  profit?: number
  notes?: string
  status?: string
}

// ==================== User Priority ====================
export interface UserPriority {
  id: number
  user_id: number
  title: string
  description?: string
  priority_level: number
  category?: string
  status?: string
  due_date?: string
  created_at: string
  updated_at?: string
}

export interface UserPriorityCreate {
  title: string
  description?: string
  priority_level?: number
  category?: string
  status?: string
  due_date?: string
}

// ==================== Recommendation ====================
export interface RecommendationItem {
  id: number
  plot_id: number
  title?: string
  description?: string
  recommendation_type?: string
  confidence_score?: number
  source?: string
  is_applied?: boolean
  applied_at?: string
  created_at: string
  updated_at?: string
  // Backend RecommendationResponse fields
  property_id?: number
  strategy_type?: string
  strategy_title?: string
  strategy_description?: string
  crop_sequence?: string[]
  duration_months?: number
  score_environmental?: number
  score_social?: number
  score_economic?: number
  score_overall?: number
  confidence_level?: string
  potential_benefits?: string[]
  risks?: string[]
  limitations?: string[]
  justification?: string
  sources_cited?: string[]
}

// ==================== Alert ====================
export interface AlertItem {
  id: number
  user_id: number
  property_id?: number
  plot_id?: number
  title: string
  message: string
  alert_type?: string
  severity?: string
  is_read?: boolean
  read_at?: string
  created_at: string
}

// ==================== Diagnostic ====================
export interface DiagnosticReport {
  id: number
  property_id: number
  plot_id?: number
  title?: string
  description?: string
  report_type?: string
  findings?: string
  recommendations?: string
  status?: string
  created_at: string
  updated_at?: string
  // Backend holistic report fields
  land_needs?: Record<string, any>
  farmer_needs?: Record<string, any>
  region_offers?: Record<string, any>
  synthesis?: string
  active_alerts?: Array<{
    type?: string
    severity?: string
    title?: string
    description?: string
  }>
}

// ==================== Chat / Assistant ====================
export interface ChatMessage {
  id?: number
  user_id?: number
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at?: string
}

export interface ChatRequest {
  message: string
  conversation_id?: string
}

export interface ChatResponse {
  reply: string
  conversation_id?: string
}

// ==================== Social ====================
export interface SocialIndicator {
  id: number
  property_id: number
  indicator_name: string
  indicator_value?: number
  unit?: string
  year?: number
  description?: string
  created_at: string
  updated_at?: string
}

export interface SocialIndicatorCreate {
  property_id: number
  indicator_name: string
  indicator_value?: number
  unit?: string
  year?: number
  description?: string
}

// ==================== Environmental ====================
export interface EnvironmentalRecord {
  id: number
  property_id: number
  record_type?: string
  value?: number
  unit?: string
  date?: string
  description?: string
  created_at: string
  updated_at?: string
}

export interface EnvironmentalRecordCreate {
  property_id: number
  record_type?: string
  value?: number
  unit?: string
  date?: string
  description?: string
}

// ==================== Economic ====================
export interface EconomicRecord {
  id: number
  user_id: number
  property_id?: number
  plot_id?: number
  record_type?: string
  amount?: number
  currency?: string
  date?: string
  description?: string
  category?: string
  created_at: string
  updated_at?: string
}

export interface EconomicRecordCreate {
  property_id?: number
  plot_id?: number
  record_type?: string
  amount?: number
  currency?: string
  date?: string
  description?: string
  category?: string
}

// ==================== Data Source ====================
export interface DataSource {
  id: number
  name: string
  source_type?: string
  url?: string
  description?: string
  api_key?: string
  is_active?: boolean
  created_at: string
  updated_at?: string
}

// ==================== Dashboard ====================
export interface DashboardStats {
  total_properties: number
  total_plots: number
  total_area_ha: number
  active_crops: number
  pending_priorities: number
  unread_alerts: number
  recent_activities?: ActivityItem[]
}

export interface ActivityItem {
  id: number
  type: string
  title: string
  description?: string
  created_at: string
}

// ==================== Pagination ====================
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface PaginationParams {
  page?: number
  size?: number
  skip?: number
  limit?: number
}

// ==================== Analytics & Holistic Models ====================
export interface AlertItemDetail {
  id: number
  property_id: number
  plot_id?: number
  alert_type: string
  severity: string
  title: string
  description: string
  created_at: string
  evidence?: Record<string, any>
  confidence: string
  recommended_action: string
  source: string
}

export interface RecommendationItemDetail {
  id: number
  property_id: number
  plot_id: number
  created_at: string
  strategy_type: string
  strategy_title: string
  strategy_description: string
  crop_sequence: string[]
  duration_months: number
  score_environmental: number
  score_social: number
  score_economic: number
  score_overall: number
  confidence_level: string
  potential_benefits: string[]
  risks: string[]
  limitations: string[]
  justification: string
  sources_cited: string[]
}

export interface SocialIndicatorDetail {
  id: number
  municipality_ibge_code: string
  municipality_name: string
  state: string
  reference_year: number
  population_total?: number
  population_rural_pct?: number
  idhm?: number
  idhm_education?: number
  idhm_income?: number
  idhm_longevity?: number
  poverty_rate_pct?: number
  agricultural_gdp_dependency_pct?: number
  family_farms_count?: number
  commercial_farms_count?: number
  rural_piped_water_access_pct?: number
  rural_internet_access_pct?: number
  source_name: string
}

export interface SocialDiagnosticResponse {
  property_id: number
  municipality: string
  state: string
  social_analysis: {
    agriculture_type: string
    labor_availability: string
    has_technical_assistance: boolean
    has_rural_credit: boolean
    has_irrigation: boolean
    opportunities: string[]
    constraints: string[]
    farmer_needs: string[]
    regional_context: {
      municipality?: string
      state?: string
      idhm?: number
      rural_population_pct?: number
      agricultural_gdp_dependency_pct?: number
      rural_water_access_pct?: number
      source?: string
      reference_year?: number
      population_total?: number
      idhm_education?: number
      idhm_income?: number
      idhm_longevity?: number
      poverty_rate_pct?: number
      family_farms_count?: number
      commercial_farms_count?: number
      rural_internet_access_pct?: number
    }
    confidence_level: string
  }
}

export interface EnvironmentalSyncResponse {
  message: string
  property_id: number
  days_synced: number
  sources: string[]
}

export interface EnvironmentalTimelinePoint {
  date: string
  temp_mean?: number
  temp_max?: number
  temp_min?: number
  precipitation?: number
  precipitation_mm?: number
  soil_moisture?: number
  soil_moisture_m3_m3?: number
  ndvi?: number
  evapotranspiration?: number
  evapotranspiration_mm?: number
  data_status?: string
  confidence_level?: string
}

export interface EnvironmentalTimeseriesResponse {
  property_id: number
  summary: Record<string, any>
  records_count: number
  timeline: EnvironmentalTimelinePoint[]
}

export interface CropCostBreakdown {
  crop: string
  cost_per_ha_brl?: number | null
  market_liquidity?: string
  management_complexity?: string
}

export interface EconomicEstimateResponse {
  area_ha: number
  cost_per_ha_brl?: number | null
  estimated_total_investment_brl?: number | null
  financial_compatibility: string
  market_liquidity_general: string
  crops_breakdown: CropCostBreakdown[]
  sources: string[]
  uncertainty_note: string
}

export interface HolisticDiagnosticResponse {
  id: number
  property_id: number
  plot_id?: number
  created_at: string
  land_needs: Record<string, any>
  farmer_needs: Record<string, any>
  region_offers: Record<string, any>
  synthesis: string
  active_alerts?: Array<{
    type?: string
    severity?: string
    title?: string
    description?: string
  }>
}

export interface FarmerProfileFull {
  id?: number
  user_id?: number
  agriculture_type?: 'FAMILY' | 'COMMERCIAL' | 'MIXED' | string
  experience_years?: number | null
  people_involved?: number | null
  hired_workers?: number | null
  labor_availability?: 'baixa' | 'média' | 'alta' | string
  internet_access?: boolean
  equipment_access?: 'manual' | 'trator' | 'completo' | string
  has_irrigation?: boolean
  irrigation_type?: string | null
  technical_assistance?: boolean
  rural_credit_access?: boolean
  main_income_source?: string
  household_income_declared?: number | null
}



// ==================== Dashboard Summary & TimeSeries ====================
export interface DashboardProperty {
  id: number
  name: string
  municipality?: string
  state?: string
  total_area_ha?: number
  latitude?: number
  longitude?: number
  plots_count?: number
}

export interface DashboardPlot {
  id: number
  name: string
  area_ha: number
  current_crop?: string
  soil_type?: string
}

export interface EnvironmentalKpis {
  drought_risk?: string
  soil_moisture_m3_m3?: number | null
  precipitation_total_mm?: number | null
  ndvi_mean?: number | null
  erosion_risk?: string
}

export interface DashboardAlert {
  id: number
  type?: string
  severity: string
  title: string
  description?: string
  recommended_action?: string
  created_at?: string
}

export interface DashboardRecommendationSummary {
  id: number
  plot_id: number
  strategy_type: string
  title: string
  crop_sequence: string[]
  score_overall: number
}

export interface DashboardSummary {
  property: DashboardProperty
  plots: DashboardPlot[]
  plots_count?: number
  total_area_ha?: number
  environmental_score?: number
  environmental_kpis?: EnvironmentalKpis
  environmental_summary?: any
  active_alerts_count?: number
  alerts: DashboardAlert[]
  recommendations_summary?: DashboardRecommendationSummary[]
  latest_recommendation?: any
}

export interface EnvironmentalTimeseriesPoint {
  date: string
  temp_mean?: number | null
  temp_max?: number | null
  precipitation?: number | null
  soil_moisture?: number | null
  ndvi?: number | null
  evapotranspiration?: number | null
  data_status?: string | null
  confidence_level?: string
}


