import { Route as rootRoute } from './root'
import { Route as IndexImport } from './routes/index'
import { Route as LoginImport } from './routes/login'
import { Route as SignupImport } from './routes/signup'
import { Route as DashboardImport } from './routes/dashboard'
import { Route as ForgotPasswordImport } from './routes/forgot-password'
import { Route as ResetPasswordImport } from './routes/reset-password'
import { Route as VerifyOtpImport } from './routes/verify-otp'
import { Route as GoogleCallbackImport } from './routes/google-callback'
import { Route as CallJoinImport } from './routes/call-join'
import { Route as NotFoundImport } from './routes/404'

// Dashboard sub-routes
import { Route as DashboardIndexImport } from './routes/dashboard/index'
import { Route as DashboardAllImport } from './routes/dashboard/all'
import { Route as DashboardWorkImport } from './routes/dashboard/work'
import { Route as DashboardFriendsImport } from './routes/dashboard/friends'
import { Route as DashboardCallsImport } from './routes/dashboard/calls'
import { Route as DashboardArchiveImport } from './routes/dashboard/archive'
import { Route as DashboardProfileImport } from './routes/dashboard/profile'
import { Route as DashboardEditProfileImport } from './routes/dashboard/edit-profile'
import { Route as SetupProfileImport } from './routes/setup-profile'
import { Route as DashboardChatImport } from './routes/dashboard/chat.$chatId'
import { Route as PrivacyImport } from './routes/privacy'
import { Route as TermsImport } from './routes/terms'
import { Route as SecurityImport } from './routes/security'
import { Route as StatusImport } from './routes/status'
import { Route as DashboardBrainImport } from './routes/dashboard/brain'
import { Route as DashboardCalendarImport } from './routes/dashboard/calendar'

const IndexRoute = IndexImport.update({
    path: '/',
    getParentRoute: () => rootRoute,
} as any)

const LoginRoute = LoginImport.update({
    path: '/login',
    getParentRoute: () => rootRoute,
} as any)

const SignupRoute = SignupImport.update({
    path: '/signup',
    getParentRoute: () => rootRoute,
} as any)

const ForgotPasswordRoute = ForgotPasswordImport.update({
    path: '/forgot-password',
    getParentRoute: () => rootRoute,
} as any)

const ResetPasswordRoute = ResetPasswordImport.update({
    path: '/reset-password',
    getParentRoute: () => rootRoute,
} as any)

const VerifyOtpRoute = VerifyOtpImport.update({
    path: '/verify-otp',
    getParentRoute: () => rootRoute,
} as any)

const GoogleCallbackRoute = GoogleCallbackImport.update({
    path: '/auth/google/callback',
    getParentRoute: () => rootRoute,
} as any)

const CallJoinRoute = CallJoinImport.update({
    path: '/call/join',
    getParentRoute: () => rootRoute,
} as any)

const NotFoundRoute = NotFoundImport.update({
    path: '/404',
    getParentRoute: () => rootRoute,
} as any)

// Dashboard and children
const DashboardIndexRoute = DashboardIndexImport.update({
    path: '/',
    getParentRoute: () => DashboardRoute,
} as any)

const DashboardAllRoute = DashboardAllImport.update({
    path: '/all',
    getParentRoute: () => DashboardRoute,
} as any)

const DashboardWorkRoute = DashboardWorkImport.update({
    path: '/work',
    getParentRoute: () => DashboardRoute,
} as any)

const DashboardFriendsRoute = DashboardFriendsImport.update({
    path: '/friends',
    getParentRoute: () => DashboardRoute,
} as any)

const DashboardCallsRoute = DashboardCallsImport.update({
    path: '/calls',
    getParentRoute: () => DashboardRoute,
} as any)

const DashboardArchiveRoute = DashboardArchiveImport.update({
    path: '/archive',
    getParentRoute: () => DashboardRoute,
} as any)

const DashboardProfileRoute = DashboardProfileImport.update({
    path: '/profile',
    getParentRoute: () => DashboardRoute,
} as any)

const DashboardEditProfileRoute = DashboardEditProfileImport.update({
    path: '/edit-profile',
    getParentRoute: () => DashboardRoute,
} as any)

const DashboardChatRoute = DashboardChatImport.update({
    path: '/chat/$chatId',
    getParentRoute: () => DashboardRoute,
} as any)

const DashboardBrainRoute = DashboardBrainImport.update({
    path: '/brain',
    getParentRoute: () => DashboardRoute,
} as any)

const DashboardCalendarRoute = DashboardCalendarImport.update({
    path: '/calendar',
    getParentRoute: () => DashboardRoute,
} as any)

const DashboardRoute = DashboardImport.update({
    path: '/dashboard',
    getParentRoute: () => rootRoute,
} as any).addChildren([
    DashboardIndexRoute,
    DashboardAllRoute,
    DashboardWorkRoute,
    DashboardFriendsRoute,
    DashboardCallsRoute,
    DashboardArchiveRoute,
    DashboardProfileRoute,
    DashboardEditProfileRoute,
    DashboardChatRoute,
    DashboardBrainRoute,
    DashboardCalendarRoute,
] as any) as any

const SetupProfileRoute = SetupProfileImport.update({
    path: '/setup-profile',
    getParentRoute: () => rootRoute,
} as any)

const PrivacyRoute = PrivacyImport.update({
    path: '/privacy',
    getParentRoute: () => rootRoute,
} as any)

const TermsRoute = TermsImport.update({
    path: '/terms',
    getParentRoute: () => rootRoute,
} as any)

const SecurityRoute = SecurityImport.update({
    path: '/security',
    getParentRoute: () => rootRoute,
} as any)

const StatusRoute = StatusImport.update({
    path: '/status',
    getParentRoute: () => rootRoute,
} as any)

export const routeTree = (rootRoute as any).addChildren([
    IndexRoute,
    LoginRoute,
    SignupRoute,
    DashboardRoute,
    ForgotPasswordRoute,
    ResetPasswordRoute,
    VerifyOtpRoute,
    GoogleCallbackRoute,
    CallJoinRoute,
    NotFoundRoute,
    SetupProfileRoute,
    PrivacyRoute,
    TermsRoute,
    SecurityRoute,
    StatusRoute,
] as any) as any

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': any
    '/login': any
    '/signup': any
    '/dashboard': any
    '/forgot-password': any
    '/reset-password': any
    '/verify-otp': any
    '/auth/google/callback': any
    '/call/join': any
    '/404': any
    '/setup-profile': any
    '/privacy': any
    '/terms': any
    '/security': any
    '/status': any
    '/dashboard/': any
    '/dashboard/all': any
    '/dashboard/work': any
    '/dashboard/friends': any
    '/dashboard/calls': any
    '/dashboard/archive': any
    '/dashboard/profile': any
    '/dashboard/edit-profile': any
    '/dashboard/chat/$chatId': any
    '/dashboard/brain': any
    '/dashboard/calendar': any
  }
}


