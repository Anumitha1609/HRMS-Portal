import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { registerLocaleData } from '@angular/common';
import localeEnIN from '@angular/common/locales/en-IN';
import {
  LucideAngularModule,
  AlertTriangle,
  BadgeDollarSign,
  CalendarDays,
  CalendarPlus,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Image,
  Info,
  LayoutGrid,
  List,
  Lock,
  LogOut,
  MoreVertical,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Upload,
  User,
  Wallet,
  X,
  XCircle
} from 'lucide-angular';

registerLocaleData(localeEnIN);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    { provide: LOCALE_ID, useValue: 'en-IN' },
    importProvidersFrom(
      LucideAngularModule.pick({
        AlertTriangle,
        BadgeDollarSign,
        CalendarDays,
        CalendarPlus,
        CheckCircle,
        CheckCircle2,
        ChevronLeft,
        ChevronRight,
        Clock,
        Download,
        Eye,
        FileSpreadsheet,
        FileText,
        Filter,
        Image,
        Info,
        LayoutGrid,
        List,
        Lock,
        LogOut,
        MoreVertical,
        Paperclip,
        Pencil,
        Plus,
        RotateCcw,
        Save,
        Search,
        Send,
        Settings,
        ShieldAlert,
        ShieldCheck,
        ThumbsDown,
        ThumbsUp,
        Trash2,
        Upload,
        User,
        Wallet,
        X,
        XCircle
      })
    )
  ]
};
