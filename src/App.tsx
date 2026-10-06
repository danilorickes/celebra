import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// Shell & Auth Pages
import CelebraLayout from '@/components/CelebraLayout'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import VerifyEmail from '@/pages/VerifyEmail'
import ConfirmEmailChange from '@/pages/ConfirmEmailChange'

// Celebra App Pages
import EventSelect from '@/pages/EventSelect'
import Dashboard from '@/pages/Dashboard'
import Tables from '@/pages/Tables'
import Guests from '@/pages/Guests'
import Honorees from '@/pages/Honorees'
import Teams from '@/pages/Teams'
import Timeline from '@/pages/Timeline'
import Occurrences from '@/pages/Occurrences'
import Live from '@/pages/Live'
import Checkin from '@/pages/Checkin'
import Checklist from '@/pages/Checklist'
import Buffet from '@/pages/Buffet'
import NotFound from '@/pages/NotFound'
const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/confirm-email-change" element={<ConfirmEmailChange />} />

            {/* Root redirect to App */}
            <Route path="/" element={<Navigate to="/app" replace />} />

            {/* Protected Celebra Central App */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <CelebraLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<EventSelect />} />
              <Route path=":eventId/dashboard" element={<Dashboard />} />
              <Route path=":eventId/honorees" element={<Honorees />} />
              <Route path=":eventId/guests" element={<Guests />} />
              <Route path=":eventId/tables" element={<Tables />} />
              <Route path=":eventId/checkin" element={<Checkin />} />
              <Route path=":eventId/checklist" element={<Checklist />} />
              <Route path=":eventId/buffet" element={<Buffet />} />
              <Route path=":eventId/timeline" element={<Timeline />} />
              <Route path=":eventId/teams" element={<Teams />} />
              <Route path=":eventId/occurrences" element={<Occurrences />} />
              <Route path=":eventId/live" element={<Live />} />
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
