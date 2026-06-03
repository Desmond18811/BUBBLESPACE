import { Route as rootRoute } from './root'
import { Route as IndexImport } from './routes/index'
import { Route as LoginImport } from './routes/login'
import { Route as SignupImport } from './routes/signup'
import { Route as DashboardImport } from './routes/dashboard'
import { Route as ForgotPasswordImport } from './routes/forgot-password'
import { Route as ResetPasswordImport } from './routes/reset-password'
import { Route as VerifyOtpImport } from './routes/verify-otp'
import { Route as GoogleCallbackImport } from './routes/google-callback'
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
    path: '/google-callback',
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
] as any) as any

export const routeTree = (rootRoute as any).addChildren([
    IndexRoute,
    LoginRoute,
    SignupRoute,
    DashboardRoute,
    ForgotPasswordRoute,
    ResetPasswordRoute,
    VerifyOtpRoute,
    GoogleCallbackRoute,
    NotFoundRoute,
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
    '/google-callback': any
    '/404': any
    '/dashboard/': any
    '/dashboard/all': any
    '/dashboard/work': any
    '/dashboard/friends': any
    '/dashboard/calls': any
    '/dashboard/archive': any
    '/dashboard/profile': any
    '/dashboard/edit-profile': any
  }
}


