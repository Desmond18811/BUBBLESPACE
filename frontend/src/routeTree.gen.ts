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

const DashboardRoute = DashboardImport.update({
    path: '/dashboard',
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

export const routeTree = rootRoute.addChildren([
    IndexRoute,
    LoginRoute,
    SignupRoute,
    DashboardRoute,
    ForgotPasswordRoute,
    ResetPasswordRoute,
    VerifyOtpRoute,
    GoogleCallbackRoute,
    NotFoundRoute,
])
