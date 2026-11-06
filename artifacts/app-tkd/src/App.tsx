import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useTKDData } from '@/hooks/use-tkd-data';
import NotFound from '@/pages/not-found';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, Camera, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleDollarSign,
  ClipboardCheck, Download, Dumbbell, FileSpreadsheet, FileText, Filter, Grid2X2,
  Heart, Home, LogOut, Menu, Package, Plus, QrCode, Search, Settings, ShieldCheck,
  ShoppingBag, Sparkles, Users, Wifi, WifiOff, X, Trash2, Pencil, Phone, CalendarDays,
  AlertCircle, RefreshCw, ScanLine, Wallet, BarChart3, Save, LockKeyhole, Mail,
  UserRound, CircleHelp, TrendingUp,
} from 'lucide-react';
import { Route, Switch, Link, useLocation, useParams, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const mxn = (value: unknown) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(value || 0));
const dateFmt = (value?: string) => value ? new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : '—';
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const fullName = (student: any) => [student?.nombre, student?.apellidos].filter(Boolean).join(' ') || 'Alumno';
const initials = (name: string) => name.split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();
const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/alumnos', label: 'Alumnos', icon: Users },
  { href: '/asistencia', label: 'Asistencia', icon: ClipboardCheck },
  { href: '/finanzas', label: 'Finanzas', icon: CircleDollarSign },
  { href: '/inventario', label: 'Inventario', icon: Package },
  { href: '/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/configuracion', label: 'Ajustes', icon: Settings },
];

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedErrorBoundary><AuthGate /></RoutedErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function AuthGate() {
  const auth = useAuth();
  if (!auth.ready) return <div className="min-h-[100dvh] grid place-items-center bg-background"><div className="panel p-8 w-[min(88vw,380px)]"><div className="h-3 w-24 rounded bg-muted animate-pulse mb-5"/><div className="h-8 w-52 rounded bg-muted animate-pulse mb-3"/><div className="h-3 w-full rounded bg-muted animate-pulse"/></div></div>;
  if (!auth.user) return <AuthScreen auth={auth} />;
  return <AppRouter auth={auth} />;
}

function AuthScreen({ auth }: { auth: any }) {
  const [mode, setMode] = useState<'login' | 'setup' | 'reset'>(auth.configured === false ? 'setup' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  if (!auth.configured) {
    return <main className="min-h-[100dvh] grid place-items-center bg-[#e7edf5] p-5"><section className="panel w-full max-w-xl p-7 md:p-9"><div className="w-12 h-12 bg-[#c9213b] rounded-xl text-white grid place-items-center"><Dumbbell size={24}/></div><div className="text-xs uppercase tracking-[.14em] font-bold text-secondary mt-5">Configuración inicial</div><h1 className="display text-4xl font-bold mt-2">Conecta Firebase</h1><p className="text-sm text-muted-foreground mt-3">Agrega las seis variables de Firebase que aparecen en <strong>CONFIGURACION_FIREBASE.md</strong> a Replit Secrets y reinicia la app. Sus valores no deben compartirse en el chat.</p></section></main>;
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (mode === 'reset') { await auth.resetPassword(email); setNotice('Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.'); }
      else if (mode === 'setup') { await auth.signUp(name, email, password); }
      else await auth.signIn(email, password);
    } catch (e: any) { setError(e?.message || 'No se pudo completar la solicitud. Intenta de nuevo.'); }
    finally { setBusy(false); }
  };
  return <main className="min-h-[100dvh] grid md:grid-cols-[1.05fr_.95fr] bg-[#e7edf5]">
    <section className="relative overflow-hidden bg-[#173b70] text-white p-7 md:p-12 flex flex-col justify-between min-h-[37vh] md:min-h-[100dvh]">
      <div className="absolute inset-0 soft-grid opacity-40"/>
      <div className="relative flex items-center gap-3"><div className="w-11 h-11 bg-[#c9213b] rounded-xl grid place-items-center"><Dumbbell size={24}/></div><div><div className="display text-2xl leading-none font-bold">APP TKD</div><div className="text-[10px] tracking-[.2em] uppercase text-blue-100/70 mt-1">Escuela · Comunidad · Disciplina</div></div></div>
      <div className="relative max-w-xl py-8"><div className="tag bg-white/10 text-white mb-5"><ShieldCheck size={13} className="mr-1.5"/> Hecho para tu dojang</div><h1 className="display text-5xl md:text-7xl font-bold leading-[.92]">El ritmo de tu<br/><span className="text-[#f1c85b]">escuela,</span> en<br/>tus manos.</h1><p className="text-blue-100/80 mt-6 max-w-md leading-relaxed">Alumnos, clases y pagos al día. Una herramienta clara para enfocarte en lo que importa: enseñar.</p><div className="flex gap-2 mt-8"><span className="h-1.5 w-12 bg-[#c9213b] rounded-full"/><span className="h-1.5 w-6 bg-white/30 rounded-full"/><span className="h-1.5 w-6 bg-white/30 rounded-full"/></div></div>
      <div className="relative flex justify-between items-end text-xs text-blue-100/65"><span>Taekwondo · México</span><span className="mono">TKD / 01</span></div>
    </section>
    <section className="p-5 md:p-12 grid place-items-center">
      <form onSubmit={submit} className="panel w-full max-w-[440px] p-6 md:p-9">
        <div className="text-xs uppercase tracking-[.14em] font-bold text-secondary">{mode === 'setup' ? 'Configuración inicial' : mode === 'reset' ? 'Recuperar acceso' : 'Acceso de instructor'}</div>
        <h2 className="display text-4xl font-bold mt-2">{mode === 'setup' ? 'Crea la cuenta principal' : mode === 'reset' ? 'Vuelve a entrar' : 'Qué bueno verte.'}</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-7">{mode === 'setup' ? 'Registra al administrador de la escuela para empezar.' : mode === 'reset' ? 'Te enviaremos un enlace a tu correo.' : 'Ingresa para continuar con tu escuela.'}</p>
        {mode === 'setup' && <label className="block text-sm font-semibold mb-4">Nombre<input className="field mt-1.5" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Tu nombre"/></label>}
        <label className="block text-sm font-semibold mb-4">Correo electrónico<input className="field mt-1.5" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="nombre@escuela.mx"/></label>
        {mode !== 'reset' && <label className="block text-sm font-semibold mb-5">Contraseña<input className="field mt-1.5" type="password" autoComplete={mode === 'setup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres"/></label>}
        {auth.error && <Notice message={String(auth.error)} tone="error"/>}
        {error && <Notice message={error} tone="error"/>}{notice && <Notice message={notice} tone="success"/>}
        <button className="btn btn-primary w-full mt-2" disabled={busy}>{busy ? 'Un momento…' : mode === 'setup' ? 'Crear cuenta principal' : mode === 'reset' ? 'Enviar instrucciones' : 'Entrar a App TKD'}<ArrowRight size={16}/></button>
        <div className="mt-5 text-center text-sm text-muted-foreground">
          {mode === 'login' && <div className="flex flex-col gap-3"><button type="button" className="underline underline-offset-4" onClick={() => setMode('reset')}>¿Olvidaste tu contraseña?</button><button type="button" className="underline underline-offset-4" onClick={() => setMode('setup')}>¿Primera vez? Crear cuenta principal</button></div>}
          {mode === 'reset' && <button type="button" className="underline underline-offset-4" onClick={() => setMode('login')}>Volver a iniciar sesión</button>}
          {mode === 'setup' && <button type="button" className="underline underline-offset-4" onClick={() => setMode('login')}>Ya tengo una cuenta</button>}
        </div>
      </form>
      <div className="text-xs text-slate-500 mt-5 flex items-center gap-2"><LockKeyhole size={13}/> Acceso protegido · Tus datos pertenecen a tu escuela</div>
    </section>
  </main>;
}

function AppRouter({ auth }: { auth: any }) {
  const userId = auth.user?.uid || '';
  const data = useTKDData(userId);
  const common = { data, auth };
  return <Switch>
    <Route path="/"><Redirect to="/dashboard"/></Route>
    <Route path="/dashboard"><Layout {...common}><Dashboard {...common}/></Layout></Route>
    <Route path="/alumnos"><Layout {...common}><Students {...common}/></Layout></Route>
    <Route path="/alumnos/:id"><Layout {...common}><StudentDetail {...common}/></Layout></Route>
    <Route path="/asistencia"><Layout {...common}><AttendancePage {...common}/></Layout></Route>
    <Route path="/finanzas"><Layout {...common}><Finance {...common}/></Layout></Route>
    <Route path="/inventario"><Layout {...common}><Inventory {...common}/></Layout></Route>
    <Route path="/reportes"><Layout {...common}><Reports {...common}/></Layout></Route>
    <Route path="/configuracion"><Layout {...common}><SettingsPage {...common}/></Layout></Route>
    <Route component={NotFound}/>
  </Switch>;
}

function Redirect({ to }: { to: string }) { const [, setLocation] = useLocation(); useEffect(() => setLocation(to, { replace: true }), [setLocation, to]); return null; }

function Layout({ children, data, auth }: { children: ReactNode; data: any; auth: any }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = navItems.find(n => location === n.href || (n.href === '/alumnos' && location.startsWith('/alumnos/'))) || navItems[0];
  return <div className="app-shell md:flex">
    <aside className="sidebar hidden md:flex md:fixed md:inset-y-0 md:w-[238px] md:flex-col md:z-30">
      <Brand/>
      <nav className="px-3 mt-8 space-y-1 flex-1">{navItems.map(item => <NavItem key={item.href} item={item} active={current.href === item.href}/>)}</nav>
      <div className="mx-4 mb-4 p-3 rounded-xl bg-white/[.07] border border-white/10"><div className="flex items-center gap-2 text-xs"><span className={`w-2 h-2 rounded-full ${data.isOnline ? 'bg-emerald-400' : 'bg-amber-300'}`}/>{data.isOnline ? 'Conectado' : 'Sin conexión'}</div><div className="text-[11px] text-blue-100/60 mt-1">{syncLabel(data.syncState)}</div></div>
      <button onClick={() => auth.signOut()} className="mx-4 mb-5 rounded-xl px-3 py-2.5 flex items-center gap-3 text-sm text-blue-100/80 hover:bg-white/10"><LogOut size={17}/> Cerrar sesión</button>
      <div className="px-5 pb-5 text-[10px] tracking-[.15em] text-blue-100/40 uppercase">App TKD · México</div>
    </aside>
    <div className="md:ml-[238px] min-h-[100dvh] flex-1">
      <header className="sticky top-0 z-20 px-4 md:px-8 h-[68px] bg-background/90 backdrop-blur-md border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3"><button className="md:hidden p-2 -ml-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Abrir menú"><Menu size={20}/></button><div className="md:hidden"><Brand compact/></div><div className="hidden md:block"><div className="text-[10px] uppercase tracking-[.16em] text-muted-foreground">Tu escuela / <span className="text-foreground">{current.label}</span></div><h1 className="display text-[23px] font-bold leading-none mt-1">{current.label}</h1></div></div>
        <div className="flex items-center gap-2 md:gap-3"><SyncChip data={data}/><div className="w-9 h-9 rounded-full bg-[#c9213b] text-white grid place-items-center text-xs font-bold">{initials(auth.user?.displayName || auth.user?.email || 'TK')}</div><span className="hidden sm:block text-sm font-semibold max-w-[140px] truncate">{auth.user?.displayName || auth.user?.email}</span></div>
      </header>
      {mobileOpen && <div className="md:hidden fixed inset-0 top-[68px] z-40 bg-background/95 backdrop-blur p-4"><button onClick={() => setMobileOpen(false)} className="absolute right-4 top-3 p-2"><X/></button><nav className="mt-8 space-y-2">{navItems.map(item => <NavItem key={item.href} item={item} active={current.href === item.href} onClick={() => setMobileOpen(false)}/>)}</nav><button onClick={() => auth.signOut()} className="btn btn-quiet w-full mt-6"><LogOut size={16}/> Cerrar sesión</button></div>}
      <main className="px-4 md:px-8 py-6 md:py-8 pb-28 md:pb-10 max-w-[1500px] mx-auto">{data.loading ? <LoadingState/> : data.error ? <ErrorState message={String(data.error)} retry={() => window.location.reload()}/> : children}</main>
      <nav className="mobile-bottom-nav md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#173b70] text-white border-t border-white/10 px-1 pt-2 grid grid-cols-5">{navItems.slice(0,5).map(item => <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 py-1.5 text-[10px] ${current.href === item.href ? 'text-[#f1c85b]' : 'text-white/65'}`}><item.icon size={19}/>{item.label}</Link>)}</nav>
    </div>
  </div>;
}

function Brand({ compact = false }: { compact?: boolean }) { return <Link href="/dashboard" className={`flex items-center gap-3 ${compact ? '' : 'px-5 pt-5'}`}><div className="w-10 h-10 rounded-xl bg-[#c9213b] grid place-items-center shadow-lg"><Dumbbell size={21}/></div><div><div className="display font-bold text-[23px] leading-none">APP TKD</div>{!compact && <div className="text-[9px] tracking-[.22em] text-blue-100/55 uppercase mt-1">Escuela · Comunidad</div>}</div></Link>; }
function NavItem({ item, active, onClick }: { item: any; active: boolean; onClick?: () => void }) { return <Link href={item.href} onClick={onClick} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold transition-colors ${active ? 'bg-white text-[#173b70] shadow-md' : 'text-blue-100/70 hover:text-white hover:bg-white/[.08]'}`}><item.icon size={18}/>{item.label}{active && <ChevronRight size={15} className="ml-auto"/>}</Link>; }
function syncLabel(state: any) { if (state === 'sincronizando') return 'Sincronizando cambios…'; if (state === 'sin-conexion') return 'Cambios guardados en este dispositivo'; if (state === 'error') return 'Hay cambios pendientes'; return 'Todo al día'; }
function SyncChip({ data }: { data: any }) { const online = data.isOnline; return <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${online ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{online ? <Wifi size={12}/> : <WifiOff size={12}/>} {online ? 'En línea' : 'Sin conexión'}</span>; }
function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) { return <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8 anim-in"><div>{eyebrow && <div className="text-[10px] tracking-[.16em] uppercase font-bold text-secondary mb-1">{eyebrow}</div>}<h2 className="display text-[40px] md:text-[48px] font-bold leading-[.94]">{title}</h2>{description && <p className="text-sm text-muted-foreground mt-2 max-w-xl">{description}</p>}</div>{action}</div>; }
function LoadingState() { return <div className="space-y-5"><div className="h-12 w-56 bg-muted animate-pulse rounded-lg"/><div className="grid md:grid-cols-3 gap-4">{[1,2,3].map(i=><div key={i} className="panel h-32 animate-pulse bg-muted/60"/>)}</div><div className="panel h-64 animate-pulse bg-muted/60"/></div>; }
function ErrorState({ message, retry }: { message: string; retry: () => void }) { return <div className="panel p-8 text-center max-w-xl mx-auto mt-12"><div className="w-12 h-12 rounded-full bg-red-100 text-red-700 grid place-items-center mx-auto"><AlertCircle/></div><h3 className="display text-3xl font-bold mt-4">No cargó esta sección</h3><p className="text-sm text-muted-foreground mt-2">{message}</p><button onClick={retry} className="btn btn-primary mt-5"><RefreshCw size={15}/> Volver a intentar</button></div>; }
function Empty({ title, text, action }: { title: string; text: string; action?: ReactNode }) { return <div className="py-12 px-5 text-center"><div className="w-12 h-12 rounded-2xl bg-muted text-primary grid place-items-center mx-auto"><Sparkles size={21}/></div><h3 className="display text-2xl font-bold mt-4">{title}</h3><p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1.5">{text}</p>{action && <div className="mt-5">{action}</div>}</div>; }
function Notice({ message, tone = 'error' }: { message: string; tone?: 'error' | 'success' }) { return <div className={`rounded-xl px-3 py-2.5 text-sm mb-3 ${tone === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>{message}</div>; }
function Stat({ label, value, note, icon: Icon, color = 'blue' }: { label: string; value: string; note?: string; icon: any; color?: string }) { const colors: any = { blue: 'bg-blue-100 text-blue-800', red: 'bg-red-100 text-red-800', gold: 'bg-amber-100 text-amber-900', green: 'bg-emerald-100 text-emerald-800' }; return <div className="panel p-4 md:p-5"><div className="flex items-start justify-between"><span className="text-xs text-muted-foreground font-semibold">{label}</span><span className={`w-9 h-9 rounded-xl grid place-items-center ${colors[color]}`}><Icon size={17}/></span></div><div className="display text-4xl font-bold mt-3">{value}</div>{note && <div className="text-[11px] text-muted-foreground mt-1">{note}</div>}</div>; }
function Avatar({ name, url, size = 'md' }: { name: string; url?: string; size?: 'sm' | 'md' | 'lg' }) { return url ? <img className={`${size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-16 h-16' : 'w-11 h-11'} rounded-xl object-cover bg-muted`} src={url} alt={name}/> : <div className={`${size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-16 h-16 text-xl' : 'w-11 h-11'} rounded-xl bg-[#dce7f4] text-[#173b70] grid place-items-center font-bold text-sm`}>{initials(name)}</div>; }
function Modal({ title, close, children, wide = false }: { title: string; close: () => void; children: ReactNode; wide?: boolean }) { return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}><div className={`modal-card ${wide ? 'max-w-[820px]' : ''}`}><div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-5 md:px-7 py-4 flex items-center justify-between"><h3 className="display text-3xl font-bold">{title}</h3><button onClick={close} aria-label="Cerrar" className="p-2 rounded-lg hover:bg-muted"><X size={19}/></button></div><div className="p-5 md:p-7">{children}</div></div></div>; }
function ExportButtons({ rows, filename, title }: { rows: any[]; filename: string; title: string }) { const exportExcel = () => { const sheet = XLSX.utils.json_to_sheet(rows); const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, title.slice(0, 31)); XLSX.writeFile(book, `${filename}.xlsx`); }; const exportPdf = () => { const doc = new jsPDF(); doc.setFontSize(17); doc.text(title, 14, 18); doc.setFontSize(9); const lines = rows.map(row => Object.values(row).join('  ·  ')); doc.text(lines.length ? doc.splitTextToSize(lines.join('\n'), 180) : 'Sin registros', 14, 29); doc.save(`${filename}.pdf`); }; return <div className="flex gap-2"><button onClick={exportExcel} className="btn btn-outline text-xs"><FileSpreadsheet size={15}/> Excel</button><button onClick={exportPdf} className="btn btn-outline text-xs"><FileText size={15}/> PDF</button></div>; }
function useStudentForm(data: any, existing?: any) {
  const blank = { nombre: '', apellidos: '', fechaNacimiento: '', telefono: '', email: '', contactoEmergencia: '', telefonoEmergencia: '', direccion: '', grado: 'Blanca', fechaIngreso: today(), cuotaMensual: '', activo: true };
  const [form, setForm] = useState<any>(existing ? { ...blank, ...existing } : blank);
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const update = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, cuotaMensual: Number(form.cuotaMensual || 0) };
      if (existing) await data.updateStudent(existing.id, payload);
      else {
        const createdId = await data.addStudent(payload);
        if (photo && createdId) await data.uploadStudentPhoto(createdId, photo);
      }
      if (photo && existing) await data.uploadStudentPhoto(existing.id, photo);
      return true;
    } finally { setSaving(false); }
  };
  return { form, update, photo, setPhoto, saving, save };
}
function StudentForm({ data, existing, onDone }: { data: any; existing?: any; onDone: () => void }) {
  const { form, update, photo, setPhoto, saving, save } = useStudentForm(data, existing);
  const handle = async (e: FormEvent) => { try { if (await save(e)) onDone(); } catch { /* Error is surfaced by shared data state. */ } };
  const fields: [string,string,string?][] = [['nombre','Nombre'],['apellidos','Apellidos'],['fechaNacimiento','Fecha de nacimiento','date'],['telefono','Teléfono','tel'],['email','Correo','email'],['contactoEmergencia','Contacto de emergencia'],['telefonoEmergencia','Teléfono de emergencia','tel'],['direccion','Dirección'],['grado','Grado'],['fechaIngreso','Fecha de ingreso','date'],['cuotaMensual','Cuota mensual (MXN)','number']];
  return <form onSubmit={handle} className="space-y-4"><div className="grid sm:grid-cols-2 gap-3">{fields.map(([key,label,type]) => <label key={key} className="block text-xs font-bold text-muted-foreground">{label}<input className="field mt-1.5 text-sm" type={type || 'text'} value={form[key] ?? ''} onChange={e => update(key, e.target.value)} required={['nombre','apellidos','grado','fechaIngreso'].includes(key)}/></label>)}</div>
    <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={!!form.activo} onChange={e => update('activo', e.target.checked)}/> Alumno activo</label>
    <label className="block text-xs font-bold text-muted-foreground">Foto del alumno<input className="field mt-1.5 text-sm" type="file" accept="image/*" capture="environment" onChange={e => setPhoto(e.target.files?.[0] || null)}/><span className="text-[10px] font-normal block mt-1">Puedes tomar una foto o elegir una imagen del dispositivo.</span></label>
    <div className="flex justify-end gap-2 pt-3"><button type="button" className="btn btn-quiet" onClick={onDone}>Cancelar</button><button className="btn btn-primary" disabled={saving}><Save size={15}/>{saving ? 'Guardando…' : existing ? 'Guardar cambios' : 'Registrar alumno'}</button></div>
  </form>;
}

function Dashboard({ data }: { data: any }) {
  const students = data.students || [], payments = data.payments || [], attendance = data.attendance || [], sales = data.sales || [];
  const active = students.filter((s: any) => s.activo).length;
  const due = payments.filter((p: any) => p.estado !== 'pagado');
  const collected = payments.filter((p: any) => p.estado === 'pagado' && (p.fechaPago || '').startsWith(today().slice(0,7))).reduce((sum: number, p: any) => sum + Number(p.monto || 0), 0);
  const latest = [...attendance].sort((a: any,b: any) => String(b.fecha).localeCompare(String(a.fecha))).slice(0,5);
  const attendCounts: any = {};
  attendance.filter((a: any) => a.fecha === today()).forEach((a: any) => { attendCounts[a.estado] = (attendCounts[a.estado] || 0) + 1; });
  return <div className="anim-in"><PageHeading eyebrow="Lunes · tu escuela en movimiento" title="Buen día, instructor." description="Un vistazo a lo que está pasando en el dojang hoy." action={<Link href="/asistencia" className="btn btn-red"><ScanLine size={16}/> Pasar asistencia</Link>}/>
    <section className="rounded-2xl bg-[#173b70] text-white p-5 md:p-7 relative overflow-hidden mb-5"><div className="absolute right-[-25px] top-[-70px] w-64 h-64 border-[36px] border-white/[.06] rounded-full"/><div className="absolute right-24 bottom-[-100px] w-56 h-56 border-[26px] border-[#c9213b]/25 rounded-full"/><div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5"><div><div className="tag bg-white/10">Resumen de hoy</div><h3 className="display text-3xl md:text-4xl font-bold mt-3">Entrena con la escuela al día.</h3><p className="text-sm text-blue-100/70 mt-1">Registra asistencia y mantén cada avance visible.</p></div><div className="flex gap-5 md:gap-8"><div><div className="mono text-3xl font-semibold">{attendCounts.presente || 0}</div><div className="text-[10px] uppercase tracking-widest text-blue-100/60 mt-1">Presentes hoy</div></div><div className="border-l border-white/20 pl-5 md:pl-8"><div className="mono text-3xl font-semibold">{due.length}</div><div className="text-[10px] uppercase tracking-widest text-blue-100/60 mt-1">Cuotas pendientes</div></div></div></div></section>
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4"><Stat label="Alumnos activos" value={String(active)} note={`${students.length} registrados`} icon={Users}/><Stat label="Cuotas por cobrar" value={mxn(due.reduce((s: number,p: any)=>s+Number(p.monto||0),0))} note={`${due.length} pagos pendientes`} icon={Wallet} color="red"/><Stat label="Cobrado este mes" value={mxn(collected)} note="Pagos registrados este mes" icon={TrendingUp} color="green"/><Stat label="Ventas registradas" value={String(sales.length)} note="En el historial" icon={ShoppingBag} color="gold"/></div>
    <div className="grid lg:grid-cols-[1.25fr_.75fr] gap-4 mt-5"><section className="panel"><div className="flex items-center justify-between p-5 pb-3"><div><div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Actividad</div><h3 className="display text-2xl font-bold mt-1">Últimos registros</h3></div><Link href="/asistencia" className="text-xs text-primary font-bold flex items-center gap-1">Ver asistencia <ArrowRight size={14}/></Link></div>{latest.length ? <div className="divide-y divide-border">{latest.map((record: any) => { const student = students.find((s: any) => s.id === record.studentId); return <div key={record.id} className="px-5 py-3 flex items-center gap-3"><Avatar name={fullName(student)} size="sm" url={student?.fotoUrl}/><div className="min-w-0 flex-1"><div className="font-semibold text-sm truncate">{fullName(student)}</div><div className="text-xs text-muted-foreground">{record.clase || 'Clase'} · {dateFmt(record.fecha)}</div></div><Status value={record.estado}/></div>;})}</div> : <Empty title="Todo empieza aquí" text="Registra la asistencia de tu primera clase para ver la actividad." action={<Link href="/asistencia" className="btn btn-primary"><ClipboardCheck size={15}/> Registrar asistencia</Link>}/>}</section>
      <section className="panel p-5"><div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Atajos</div><h3 className="display text-2xl font-bold mt-1 mb-4">A mano, rápido.</h3><div className="space-y-2"><Quick href="/alumnos" icon={Plus} title="Dar de alta alumno" detail="Ficha y credencial QR"/><Quick href="/finanzas" icon={CircleDollarSign} title="Registrar un pago" detail="Cuotas y seguimiento"/><Quick href="/inventario" icon={Package} title="Revisar inventario" detail="Stock y ventas"/></div><div className="mt-4 rounded-xl bg-[#f1c85b]/20 p-3 text-xs flex gap-2 items-start text-foreground"><CircleHelp size={15} className="text-amber-800 shrink-0 mt-0.5"/> Los cambios se sincronizan cuando vuelve la conexión.</div></section></div>
  </div>;
}
function Quick({ href, icon: Icon, title, detail }: { href: string; icon: any; title: string; detail: string }) { return <Link href={href} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/60"><span className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 grid place-items-center"><Icon size={17}/></span><span className="flex-1"><span className="block text-sm font-bold">{title}</span><span className="block text-[11px] text-muted-foreground">{detail}</span></span><ChevronRight size={15} className="text-muted-foreground"/></Link>; }

function Students({ data }: { data: any }) {
  const students = data.students || [];
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('todos');
  const [modal, setModal] = useState(false);
  const filtered = students.filter((s: any) => fullName(s).toLowerCase().includes(query.toLowerCase()) && (filter === 'todos' || (filter === 'activos' ? s.activo : !s.activo)));
  const exportRows = filtered.map((s: any) => ({ Nombre: fullName(s), Grado: s.grado, Teléfono: s.telefono, Correo: s.email, Cuota: mxn(s.cuotaMensual), Estado: s.activo ? 'Activo' : 'Inactivo' }));
  return <><PageHeading eyebrow="Personas de tu dojang" title="Alumnos" description={`${students.length} fichas registradas · cada avance cuenta.`} action={<button onClick={() => setModal(true)} className="btn btn-red"><Plus size={17}/> Nuevo alumno</button>}/>
    <div className="panel p-3 md:p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center"><div className="relative flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input className="field pl-10" placeholder="Buscar por nombre o apellido…" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="flex gap-2"><select className="field w-auto min-w-[138px]" value={filter} onChange={e=>setFilter(e.target.value)}><option value="todos">Todos</option><option value="activos">Activos</option><option value="inactivos">Inactivos</option></select><ExportButtons rows={exportRows} filename="alumnos-tkd" title="Directorio de alumnos"/></div></div>
    <div className="panel overflow-hidden">{filtered.length ? <div className="table-wrap"><table><thead><tr><th>Alumno</th><th>Grado</th><th>Teléfono</th><th>Cuota mensual</th><th>Estado</th><th/></tr></thead><tbody>{filtered.map((s: any) => <tr key={s.id} data-testid={`row-student-${s.id}`}><td><Link href={`/alumnos/${s.id}`} className="flex items-center gap-3 min-w-[190px]"><Avatar name={fullName(s)} url={s.fotoUrl} size="sm"/><span><span className="block font-bold text-sm">{fullName(s)}</span><span className="text-[11px] text-muted-foreground">Desde {dateFmt(s.fechaIngreso)}</span></span></Link></td><td><Belt grade={s.grado}/></td><td>{s.telefono || '—'}</td><td className="mono">{mxn(s.cuotaMensual)}</td><td><Status value={s.activo ? 'activo' : 'inactivo'}/></td><td><Link href={`/alumnos/${s.id}`} className="btn btn-quiet !min-h-8 !px-2.5 text-xs">Ver ficha <ArrowRight size={13}/></Link></td></tr>)}</tbody></table></div> : <Empty title={students.length ? 'No hay coincidencias' : 'Tu lista empieza aquí'} text={students.length ? 'Prueba otro nombre o cambia el filtro.' : 'Registra a tu primer alumno y crea su credencial digital.'} action={!students.length && <button onClick={()=>setModal(true)} className="btn btn-primary"><Plus size={15}/> Registrar alumno</button>}/>}</div>
    {modal && <Modal title="Nueva ficha de alumno" close={()=>setModal(false)} wide><StudentForm data={data} onDone={()=>setModal(false)}/></Modal>}
  </>;
}
function Belt({ grade }: { grade: string }) { const color = grade?.toLowerCase().includes('negra') ? 'bg-slate-900 text-white' : grade?.toLowerCase().includes('roja') ? 'bg-red-100 text-red-800' : grade?.toLowerCase().includes('amarilla') ? 'bg-amber-100 text-amber-900' : 'bg-muted text-foreground'; return <span className={`tag ${color}`}>{grade || 'Sin grado'}</span>; }
function Status({ value }: { value: string }) { const v = String(value || '').toLowerCase(); let style = 'bg-muted text-muted-foreground', label = value || 'Sin estado'; if (['presente','pagado','activo','completado'].includes(v)) { style='bg-emerald-100 text-emerald-800'; label = v === 'presente' ? 'Presente' : v === 'pagado' ? 'Pagado' : v === 'activo' ? 'Activo' : 'Completado'; } else if (['pendiente','ausente','vencido','inactivo'].includes(v)) { style = v === 'ausente' || v === 'vencido' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'; label = v === 'pendiente' ? 'Pendiente' : v === 'ausente' ? 'Ausente' : v === 'vencido' ? 'Vencido' : 'Inactivo'; } else if (v === 'retardo') { style='bg-blue-100 text-blue-800'; label='Retardo'; } return <span className={`tag ${style}`}>{label}</span>; }

function StudentDetail({ data }: { data: any }) {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const student = (data.students || []).find((s: any) => String(s.id) === String(params.id));
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('avance');
  if (!student) return <div><Link href="/alumnos" className="btn btn-quiet mb-5"><ChevronLeft size={16}/> Regresar a alumnos</Link><Empty title="No encontramos esta ficha" text="Puede que el registro ya no esté disponible."/></div>;
  const grades = (data.grades || []).filter((g: any) => String(g.studentId) === String(student.id)).sort((a: any,b: any)=>String(b.fecha).localeCompare(String(a.fecha)));
  const attendance = (data.attendance || []).filter((a: any) => String(a.studentId) === String(student.id)).sort((a: any,b: any)=>String(b.fecha).localeCompare(String(a.fecha)));
  const payments = (data.payments || []).filter((p: any) => String(p.studentId) === String(student.id)).sort((a: any,b: any)=>String(b.fechaVencimiento).localeCompare(String(a.fechaVencimiento)));
  const remove = async () => { if (window.confirm(`¿Eliminar la ficha de ${fullName(student)}?`)) { await data.deleteStudent(student.id); setLocation('/alumnos'); } };
  return <><Link href="/alumnos" className="text-sm text-primary font-bold flex items-center gap-1 mb-4"><ChevronLeft size={16}/> Alumnos</Link><div className="panel overflow-hidden mb-5"><div className="h-24 bg-[#173b70] relative"><div className="absolute inset-0 soft-grid opacity-40"/><span className="absolute right-5 top-4"><Status value={student.activo ? 'activo':'inactivo'}/></span></div><div className="px-5 md:px-7 pb-6"><div className="flex flex-col md:flex-row md:items-end gap-3 -mt-9 relative"><Avatar name={fullName(student)} url={student.fotoUrl} size="lg"/><div className="flex-1 pt-2"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Ficha de alumno</div><h2 className="display text-4xl font-bold">{fullName(student)}</h2><div className="mt-1"><Belt grade={student.grado}/></div></div><div className="flex gap-2"><button className="btn btn-outline text-xs" onClick={()=>setEditing(true)}><Pencil size={14}/> Editar</button><button className="btn btn-quiet text-xs" onClick={()=>window.print()}><FileText size={14}/> Imprimir</button><button className="btn btn-outline !text-red-700" onClick={remove} aria-label="Eliminar alumno"><Trash2 size={15}/></button></div></div></div></div>
    <div className="grid lg:grid-cols-[1fr_310px] gap-4"><div><div className="flex gap-2 border-b border-border mb-4 overflow-auto">{[['avance','Avance'],['asistencia','Asistencia'],['pagos','Pagos']].map(([k,label])=><button key={k} onClick={()=>setTab(k)} className={`px-4 py-2 text-sm font-bold border-b-2 whitespace-nowrap ${tab===k?'border-secondary text-secondary':'border-transparent text-muted-foreground'}`}>{label}</button>)}</div>
      {tab==='avance' && <div className="panel p-5"><div className="flex items-center justify-between"><div><div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Camino de grado</div><h3 className="display text-2xl font-bold mt-1">Historial de cintas</h3></div><button className="btn btn-primary text-xs" onClick={async()=>{const grado=window.prompt('Nuevo grado o cinta');if(grado) await data.addGrade({studentId:student.id,grado,fecha:today(),notas:''});}}><Plus size={14}/> Añadir grado</button></div>{grades.length ? <div className="mt-5 space-y-3">{grades.map((g:any)=><div key={g.id} className="flex gap-3"><div className="w-8 h-8 rounded-full bg-[#173b70] text-white grid place-items-center shrink-0"><Check size={15}/></div><div className="flex-1 border-b border-border pb-3"><div className="flex justify-between gap-2"><div className="font-bold">{g.grado}</div><span className="text-xs text-muted-foreground">{dateFmt(g.fecha)}</span></div>{g.notas && <p className="text-xs text-muted-foreground mt-1">{g.notas}</p>}</div></div>)}</div>:<Empty title="El siguiente grado comienza aquí" text="Agrega el avance de cinta cuando el alumno esté listo."/ >}</div>}
      {tab==='asistencia' && <div className="panel"><div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Clase</th><th>Hora</th><th>Estado</th></tr></thead><tbody>{attendance.map((a:any)=><tr key={a.id}><td>{dateFmt(a.fecha)}</td><td>{a.clase}</td><td>{a.hora || '—'}</td><td><Status value={a.estado}/></td></tr>)}</tbody></table>{!attendance.length && <Empty title="Sin asistencia registrada" text="Las clases marcadas aparecerán en este historial."/>}</div></div>}
      {tab==='pagos' && <div className="panel"><div className="table-wrap"><table><thead><tr><th>Periodo</th><th>Vence</th><th>Importe</th><th>Estado</th></tr></thead><tbody>{payments.map((p:any)=><tr key={p.id}><td>{p.periodo}</td><td>{dateFmt(p.fechaVencimiento)}</td><td className="mono">{mxn(p.monto)}</td><td><Status value={p.estado}/></td></tr>)}</tbody></table>{!payments.length && <Empty title="Aún no hay pagos" text="Cuando registres una cuota podrás consultarla aquí."/>}</div></div>}
    </div><aside className="space-y-4"><div className="panel p-5"><div className="flex items-center justify-between mb-3"><div><div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Credencial digital</div><div className="font-bold mt-1">Acceso a clases</div></div><QrCode size={18} className="text-primary"/></div><div className="bg-white p-3 rounded-xl w-fit mx-auto"><QRCodeSVG value={`tkd:${student.id}`} size={168} level="M" includeMargin/></div><div className="text-center text-[10px] text-muted-foreground mt-2 mono">tkd:{student.id}</div><p className="text-[11px] text-center text-muted-foreground mt-2">Escanea para registrar asistencia</p></div>
      <div className="panel p-5"><div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Datos de contacto</div><Info label="Teléfono" value={student.telefono} icon={Phone}/><Info label="Correo" value={student.email} icon={Mail}/><Info label="Contacto emergencia" value={student.contactoEmergencia} icon={Heart}/><Info label="Teléfono emergencia" value={student.telefonoEmergencia} icon={Phone}/><Info label="Inscripción" value={dateFmt(student.fechaIngreso)} icon={CalendarDays}/><Info label="Cuota mensual" value={mxn(student.cuotaMensual)} icon={Wallet}/></div></aside></div>
    {editing && <Modal title="Editar ficha" close={()=>setEditing(false)} wide><StudentForm data={data} existing={student} onDone={()=>setEditing(false)}/></Modal>}
  </>;
}
function Info({ label, value, icon: Icon }: { label: string; value?: string; icon: any }) { return <div className="flex gap-2.5 py-2 border-t border-border first:border-0"><Icon size={15} className="mt-0.5 text-muted-foreground"/><div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="text-sm font-semibold mt-0.5">{value || '—'}</div></div></div>; }

function AttendancePage({ data }: { data: any }) {
  const [className, setClassName] = useState('Clase general');
  const [scan, setScan] = useState(false);
  const [filterDate, setFilterDate] = useState(today());
  const [message, setMessage] = useState('');
  const attendance = (data.attendance || []).filter((a:any)=>a.fecha===filterDate&&a.clase===className);
  const students = data.students || [];
  const record = async (studentId: string, estado = 'presente') => { const already = attendance.some((a:any)=>String(a.studentId)===String(studentId)); if (already) { setMessage('Este alumno ya está registrado para la fecha seleccionada.'); return; } try { await data.recordAttendance({ studentId, clase: className, fecha: filterDate, hora: new Date().toTimeString().slice(0,5), estado }); setMessage('Asistencia registrada.'); } catch { setMessage('No se pudo registrar la asistencia.'); } };
  const onScan = (text: string) => { const id = text.trim().replace(/^tkd:/, ''); const student = students.find((s:any)=>String(s.id)===id); if (student) { void record(student.id); } else setMessage('No encontramos una credencial válida para esta escuela.'); };
  return <><PageHeading eyebrow="Control de clase" title="Asistencia" description="Escanea la credencial o registra a cada alumno en segundos." action={<button className={`btn ${scan?'btn-quiet':'btn-red'}`} onClick={()=>setScan(!scan)}>{scan?<X size={16}/>:<ScanLine size={16}/>} {scan?'Cerrar escáner':'Abrir escáner QR'}</button>}/>
    <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-4"><div className="space-y-4"><div className="panel p-5"><label className="text-xs font-bold text-muted-foreground">Clase<input className="field mt-1.5" value={className} onChange={e=>setClassName(e.target.value)} placeholder="Ej. Juvenil · 17:00"/></label><label className="text-xs font-bold text-muted-foreground block mt-4">Fecha<input className="field mt-1.5" type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}/></label><div className="grid grid-cols-2 gap-3 mt-5"><div className="rounded-xl bg-emerald-50 p-3"><div className="mono text-2xl font-semibold text-emerald-800">{attendance.filter((a:any)=>a.estado==='presente').length}</div><div className="text-[10px] uppercase tracking-wider text-emerald-800/70">Presentes</div></div><div className="rounded-xl bg-amber-50 p-3"><div className="mono text-2xl font-semibold text-amber-900">{Math.max(0, students.filter((s:any)=>s.activo).length-attendance.length)}</div><div className="text-[10px] uppercase tracking-wider text-amber-900/70">Sin marcar</div></div></div></div>
      {scan && <QrScanner onScan={onScan} close={()=>setScan(false)}/>}
      <div className="panel p-5"><h3 className="display text-2xl font-bold">Escanea una tarjeta</h3><p className="text-xs text-muted-foreground mt-1">La cámara del dispositivo lee QR con formato tkd:&lt;id&gt;.</p><div className="mt-4 border border-dashed border-border rounded-xl p-6 text-center text-muted-foreground"><QrCode size={32} className="mx-auto text-primary"/><button className="btn btn-primary mt-4" onClick={()=>setScan(true)}><Camera size={15}/> Activar cámara</button></div></div></div>
      <section className="panel overflow-hidden"><div className="p-5 flex items-center justify-between"><div><div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Lista de clase</div><h3 className="display text-2xl font-bold mt-1">{dateFmt(filterDate)}</h3></div><span className="tag bg-blue-100 text-blue-800">{attendance.length} registros</span></div>{message && <div className="mx-5 mb-3"><Notice message={message} tone={message.includes('registrada')?'success':'error'}/></div>}{students.filter((s:any)=>s.activo).length ? <div className="divide-y divide-border">{students.filter((s:any)=>s.activo).map((s:any)=>{const done=attendance.find((a:any)=>String(a.studentId)===String(s.id));return <div key={s.id} className="flex items-center gap-3 px-5 py-3"><Avatar name={fullName(s)} url={s.fotoUrl} size="sm"/><div className="flex-1 min-w-0"><div className="font-bold text-sm truncate">{fullName(s)}</div><div className="text-xs text-muted-foreground">{s.grado}</div></div>{done?<Status value={done.estado}/>:<div className="flex gap-2"><button className="btn btn-primary !min-h-9 !px-3 text-xs" onClick={()=>record(s.id)}><Check size={14}/> Presente</button><button className="btn btn-quiet !min-h-9 !px-3 text-xs" onClick={()=>record(s.id,'ausente')}>Ausente</button></div>}</div>})}</div>:<Empty title="No hay alumnos activos" text="Agrega alumnos activos para preparar la lista."/ >}</section></div>
  </>;
}
function QrScanner({ onScan, close }: { onScan: (text: string)=>void; close: ()=>void }) {
  const callback = useRef(onScan);
  const [cameraMessage, setCameraMessage] = useState('Solicitando acceso a la cámara…');
  callback.current = onScan;
  useEffect(() => {
    const scanner = new Html5Qrcode('tkd-qr-reader', { verbose: false });
    let cancelled = false;
    let started = false;
    const startup = (async () => {
      const cameras = await Html5Qrcode.getCameras();
      if (cancelled) return;
      if (!cameras.length) throw new Error('No se encontró una cámara en este dispositivo.');
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (decoded) => callback.current(decoded),
        () => undefined,
      );
      started = true;
      if (cancelled) {
        await scanner.stop();
        return;
      }
      setCameraMessage('Centra la credencial dentro del recuadro.');
    })().catch((cause: unknown) => {
      if (cancelled) return;
      const message = cause instanceof Error ? cause.message : '';
      setCameraMessage(/permission|notallowed|denied/i.test(message)
        ? 'Permite el acceso a la cámara en tu navegador para escanear credenciales.'
        : /notfound|camera/i.test(message)
          ? 'No se encontró una cámara disponible en este dispositivo.'
          : 'No se pudo activar la cámara. Comprueba el permiso y vuelve a intentarlo.');
    });
    return () => {
      cancelled = true;
      void startup.finally(async () => {
        if (started) await scanner.stop().catch(() => undefined);
        try {
          scanner.clear();
        } catch {
          // The camera can already be released if startup was cancelled.
        }
      });
    };
  }, []);
  return <div className="panel p-4"><div className="flex justify-between items-center mb-3"><h3 className="font-bold">Lector de credenciales</h3><button className="p-1" onClick={close} aria-label="Cerrar escáner"><X size={17}/></button></div><div id="tkd-qr-reader" className="qr-reader"/><p className="text-xs text-muted-foreground mt-3">{cameraMessage}</p></div>;
}

function Finance({ data }: { data: any }) {
  const payments=data.payments||[], students=data.students||[];
  const [filter,setFilter]=useState('todos');
  const [modal,setModal]=useState(false);
  const filtered=payments.filter((p:any)=>filter==='todos'||p.estado===filter);
  const pending=payments.filter((p:any)=>p.estado!=='pagado');
  const exportRows=filtered.map((p:any)=>({Alumno:fullName(students.find((s:any)=>String(s.id)===String(p.studentId))),Periodo:p.periodo,Vence:dateFmt(p.fechaVencimiento),Monto:mxn(p.monto),Estado:p.estado,Metodo:p.metodo||'—'}));
  return <><PageHeading eyebrow="Cuotas y caja" title="Finanzas" description="Cobros claros, recordatorios sencillos y menos pendientes." action={<button className="btn btn-red" onClick={()=>setModal(true)}><Plus size={16}/> Registrar pago</button>}/>
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5"><Stat label="Por cobrar" value={mxn(pending.reduce((s:number,p:any)=>s+Number(p.monto||0),0))} note={`${pending.length} cuotas abiertas`} icon={Wallet} color="red"/><Stat label="Cuotas pagadas" value={String(payments.filter((p:any)=>p.estado==='pagado').length)} note="En el historial" icon={CheckCircle2} color="green"/><Stat label="Movimientos" value={String(payments.length)} note="Pagos registrados" icon={ArrowDownLeft}/><Stat label="Alumnos activos" value={String(students.filter((s:any)=>s.activo).length)} note="Base de cobro" icon={Users} color="gold"/></div>
    <div className="panel p-3 md:p-4 mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Filter size={16} className="text-muted-foreground"/><select className="field w-auto min-w-[150px]" value={filter} onChange={e=>setFilter(e.target.value)}><option value="todos">Todos los estados</option><option value="pendiente">Pendientes</option><option value="pagado">Pagados</option><option value="vencido">Vencidos</option></select></div><ExportButtons rows={exportRows} filename="finanzas-tkd" title="Movimientos de finanzas"/></div>
    <div className="panel overflow-hidden">{filtered.length ? <div className="table-wrap"><table><thead><tr><th>Alumno</th><th>Concepto / periodo</th><th>Vencimiento</th><th>Monto</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{filtered.map((p:any)=>{const s=students.find((x:any)=>String(x.id)===String(p.studentId));const due=p.estado!=='pagado';const msg=encodeURIComponent(`Hola ${s?.nombre||''}, te escribimos de tu escuela de Taekwondo para recordarte el pago de ${p.concepto||'tu mensualidad'}${p.periodo?` (${p.periodo})`:''} por ${mxn(p.monto)}. ¡Gracias!`);return <tr key={p.id}><td><Link href={`/alumnos/${p.studentId}`} className="font-bold hover:underline">{fullName(s)}</Link></td><td>{p.concepto||'Cuota mensual'}<div className="text-[11px] text-muted-foreground">{p.periodo}</div></td><td>{dateFmt(p.fechaVencimiento)}</td><td className="mono font-semibold">{mxn(p.monto)}</td><td><Status value={p.estado}/></td><td><div className="flex gap-1.5">{due && <a className="btn btn-quiet !min-h-8 !px-2.5 text-[11px]" href={`https://wa.me/${String(s?.telefono||'').replace(/\D/g,'')}?text=${msg}`} target="_blank" rel="noreferrer"><Phone size={13}/> WhatsApp</a>}<button className="btn btn-outline !min-h-8 !px-2.5 text-[11px]" onClick={()=>{if(due) void data.updatePayment(p.id,{...p,estado:'pagado',fechaPago:today()});}} disabled={!due}><Check size={13}/> {due?'Marcar pagado':'Listo'}</button></div></td></tr>})}</tbody></table></div>:<Empty title="Sin movimientos para mostrar" text="Registra un pago para comenzar el control de cuotas." action={<button className="btn btn-primary" onClick={()=>setModal(true)}><Plus size={15}/> Registrar pago</button>}/>}</div>
    {modal&&<Modal title="Registrar pago" close={()=>setModal(false)}><PaymentForm data={data} students={students} onDone={()=>setModal(false)}/></Modal>}
  </>;
}
function PaymentForm({ data, students, onDone }: {data:any;students:any[];onDone:()=>void}) { const [form,setForm]=useState<any>({studentId:'',monto:'',periodo:new Date().toLocaleDateString('es-MX',{month:'long',year:'numeric'}),fechaVencimiento:today(),fechaPago:today(),estado:'pagado',metodo:'efectivo',concepto:'Cuota mensual'});const [busy,setBusy]=useState(false);const change=(k:string,v:any)=>setForm((x:any)=>({...x,[k]:v}));const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);try{await data.addPayment({...form,monto:Number(form.monto),fechaPago:form.estado==='pagado'?form.fechaPago:''});onDone();}finally{setBusy(false);}};return <form onSubmit={submit} className="space-y-4"><label className="block text-xs font-bold text-muted-foreground">Alumno<select className="field mt-1.5" required value={form.studentId} onChange={e=>{const s=students.find(x=>String(x.id)===e.target.value);change('studentId',e.target.value);if(s)change('monto',String(s.cuotaMensual||''));}}><option value="">Selecciona alumno</option>{students.map(s=><option key={s.id} value={s.id}>{fullName(s)}</option>)}</select></label><label className="block text-xs font-bold text-muted-foreground">Concepto<input className="field mt-1.5" value={form.concepto} onChange={e=>change('concepto',e.target.value)}/></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-muted-foreground">Monto (MXN)<input className="field mt-1.5" type="number" min="0" required value={form.monto} onChange={e=>change('monto',e.target.value)}/></label><label className="text-xs font-bold text-muted-foreground">Periodo<input className="field mt-1.5" value={form.periodo} onChange={e=>change('periodo',e.target.value)} required/></label><label className="text-xs font-bold text-muted-foreground">Fecha límite<input className="field mt-1.5" type="date" value={form.fechaVencimiento} onChange={e=>change('fechaVencimiento',e.target.value)} required/></label><label className="text-xs font-bold text-muted-foreground">Método<select className="field mt-1.5" value={form.metodo} onChange={e=>change('metodo',e.target.value)}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option><option value="otro">Otro</option></select></label></div><label className="block text-xs font-bold text-muted-foreground">Estado<select className="field mt-1.5" value={form.estado} onChange={e=>change('estado',e.target.value)}><option value="pagado">Pagado</option><option value="pendiente">Pendiente</option></select></label><div className="flex justify-end"><button className="btn btn-primary" disabled={busy}><Save size={15}/>{busy?'Guardando…':'Guardar pago'}</button></div></form>; }

function Inventory({ data }: {data:any}) {
  const products=data.products||[],sales=data.sales||[];
  const [modal,setModal]=useState(false),[saleOpen,setSaleOpen]=useState(false),[search,setSearch]=useState('');
  const [cart,setCart]=useState<any[]>([]);
  const [saleMethod,setSaleMethod]=useState('efectivo');
  const active=products.filter((p:any)=>p.activo&&p.nombre.toLowerCase().includes(search.toLowerCase()));
  const addCart=(p:any)=>setCart((c:any[])=>{const old=c.find(i=>i.productId===p.id);return old?c.map(i=>i.productId===p.id?{...i,cantidad:Math.min(i.cantidad+1,p.stock)}:i):[...c,{productId:p.id,nombre:p.nombre,cantidad:1,precioUnitario:Number(p.precio)}]});
  const checkout=async()=>{if(!cart.length)return;await data.createSale({articulos:cart,total:cart.reduce((s:any,i:any)=>s+i.cantidad*i.precioUnitario,0),fecha:today(),metodoPago:saleMethod});setCart([]);setSaleOpen(false);};
  return <><PageHeading eyebrow="Equipo del dojang" title="Inventario" description="Cuida el stock y registra ventas sin detener la clase." action={<div className="flex gap-2"><button className="btn btn-outline" onClick={()=>setSaleOpen(true)}><ShoppingBag size={16}/> Venta <span className="tag bg-secondary text-white !py-0">{cart.length}</span></button><button className="btn btn-red" onClick={()=>setModal(true)}><Plus size={16}/> Producto</button></div>}/>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5"><Stat label="Productos activos" value={String(products.filter((p:any)=>p.activo).length)} icon={Package}/><Stat label="Unidades disponibles" value={String(products.reduce((s:number,p:any)=>s+Number(p.stock||0),0))} icon={Grid2X2} color="gold"/><Stat label="Stock bajo" value={String(products.filter((p:any)=>p.activo&&Number(p.stock)<=3).length)} note="3 unidades o menos" icon={AlertCircle} color="red"/><Stat label="Ventas" value={String(sales.length)} icon={ShoppingBag} color="green"/></div>
    <div className="panel p-3 mb-4 relative"><Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground"/><input className="field pl-10" placeholder="Buscar producto…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
    {active.length ? <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">{active.map((p:any)=><div className="panel p-4" key={p.id}><div className="flex justify-between gap-3"><div><div className="text-[10px] uppercase tracking-widest text-secondary font-bold">{p.categoria||'Equipo'}</div><h3 className="display text-2xl font-bold mt-1">{p.nombre}</h3><p className="text-xs text-muted-foreground mt-1">{p.talla?`Talla ${p.talla} · `:''}{p.stock} en existencia</p></div><span className={`w-10 h-10 rounded-xl grid place-items-center ${Number(p.stock)<=3?'bg-red-100 text-red-800':'bg-blue-100 text-blue-800'}`}><Package size={19}/></span></div><div className="flex items-end justify-between mt-5"><span className="mono text-xl font-semibold">{mxn(p.precio)}</span><div className="flex gap-2"><button className="btn btn-outline !min-h-9 !px-3 text-xs" onClick={()=>{const stock=window.prompt('Nueva cantidad disponible',String(p.stock));if(stock!==null)void data.updateProduct(p.id,{...p,stock:Number(stock)});}}>Editar stock</button><button className="btn btn-primary !min-h-9 !px-3 text-xs" onClick={()=>addCart(p)} disabled={Number(p.stock)<1}><Plus size={14}/> Agregar</button><button className="p-2 text-red-700 rounded-lg hover:bg-red-50" aria-label={`Eliminar ${p.nombre}`} onClick={()=>{if(window.confirm(`¿Eliminar ${p.nombre} del inventario?`))void data.deleteProduct(p.id);}}><Trash2 size={15}/></button></div></div></div>)}</div>:<div className="panel"><Empty title={products.length?'No encontramos productos':'Tu inventario empieza aquí'} text={products.length?'Cambia tu búsqueda para ver otros artículos.':'Registra los uniformes y el equipo que manejas en la escuela.'} action={!products.length&&<button className="btn btn-primary" onClick={()=>setModal(true)}><Plus size={15}/> Registrar producto</button>}/></div>}
    <section className="panel mt-5 overflow-hidden"><div className="p-5 flex justify-between items-center"><div><div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Caja de productos</div><h3 className="display text-2xl font-bold mt-1">Ventas recientes</h3></div><span className="tag bg-blue-100 text-blue-800">{sales.length} movimientos</span></div>{sales.length?<div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Artículos</th><th>Método</th><th>Total</th></tr></thead><tbody>{[...sales].sort((a:any,b:any)=>String(b.fecha).localeCompare(String(a.fecha))).slice(0,10).map((s:any)=><tr key={s.id}><td>{dateFmt(s.fecha)}</td><td>{(s.articulos||[]).map((x:any)=>`${x.nombre} × ${x.cantidad}`).join(', ')}</td><td>{s.metodoPago}</td><td className="mono font-bold">{mxn(s.total)}</td></tr>)}</tbody></table></div>:<Empty title="Sin ventas todavía" text="Agrega productos a la venta para registrar el primer movimiento."/>}</section>
    {modal&&<Modal title="Nuevo producto" close={()=>setModal(false)}><ProductForm data={data} onDone={()=>setModal(false)}/></Modal>}
    {saleOpen&&<Modal title="Registrar venta" close={()=>setSaleOpen(false)}><div className="space-y-3">{cart.length?cart.map((item:any)=><div key={item.productId} className="flex justify-between items-center border-b border-border pb-3"><div className="font-bold text-sm">{item.nombre}<div className="text-xs text-muted-foreground">{item.cantidad} × {mxn(item.precioUnitario)}</div></div><div className="flex gap-2 items-center"><span className="mono font-bold">{mxn(item.cantidad*item.precioUnitario)}</span><button onClick={()=>setCart(cart.filter((x:any)=>x.productId!==item.productId))} className="p-1 text-red-700"><Trash2 size={15}/></button></div></div>):<Empty title="La venta está vacía" text="Agrega artículos desde inventario."/>}<div className="flex justify-between font-bold pt-2"><span>Total</span><span className="mono">{mxn(cart.reduce((s:number,i:any)=>s+i.cantidad*i.precioUnitario,0))}</span></div><label className="block text-xs font-bold text-muted-foreground">Método de pago<select className="field mt-1.5" value={saleMethod} onChange={e=>setSaleMethod(e.target.value)}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option></select></label><button className="btn btn-primary w-full" disabled={!cart.length} onClick={checkout}><Check size={15}/> Confirmar venta</button></div></Modal>}
  </>;
}
function ProductForm({data,onDone}:{data:any;onDone:()=>void}) { const [f,setF]=useState<any>({nombre:'',categoria:'',talla:'',stock:'',precio:'',activo:true});const [busy,setBusy]=useState(false);const set=(k:string,v:any)=>setF((x:any)=>({...x,[k]:v}));const submit=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);try{await data.addProduct({...f,stock:Number(f.stock),precio:Number(f.precio)});onDone();}finally{setBusy(false);}};return <form onSubmit={submit} className="space-y-4">{[['nombre','Nombre'],['categoria','Categoría'],['talla','Talla']].map(([k,l])=><label key={k} className="block text-xs font-bold text-muted-foreground">{l}<input className="field mt-1.5" value={f[k]} onChange={e=>set(k,e.target.value)} required={k==='nombre'}/></label>)}<div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-muted-foreground">Existencias<input type="number" min="0" className="field mt-1.5" value={f.stock} onChange={e=>set('stock',e.target.value)} required/></label><label className="text-xs font-bold text-muted-foreground">Precio (MXN)<input type="number" min="0" step=".01" className="field mt-1.5" value={f.precio} onChange={e=>set('precio',e.target.value)} required/></label></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.activo} onChange={e=>set('activo',e.target.checked)}/> Disponible para venta</label><button className="btn btn-primary w-full" disabled={busy}><Save size={15}/>{busy?'Guardando…':'Guardar producto'}</button></form>; }

function Reports({data}: {data:any}) { const students=data.students||[], payments=data.payments||[], attendance=data.attendance||[], sales=data.sales||[];const paid=payments.filter((p:any)=>p.estado==='pagado').reduce((s:number,p:any)=>s+Number(p.monto||0),0);const pending=payments.filter((p:any)=>p.estado!=='pagado').reduce((s:number,p:any)=>s+Number(p.monto||0),0);const months=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-5+i);const key=d.toISOString().slice(0,7);return {key,label:d.toLocaleDateString('es-MX',{month:'short'}),value:payments.filter((p:any)=>p.estado==='pagado'&&String(p.fechaPago||'').startsWith(key)).reduce((s:number,p:any)=>s+Number(p.monto||0),0)};});const max=Math.max(1,...months.map(m=>m.value));const rows=payments.map((p:any)=>({Alumno:fullName(students.find((s:any)=>String(s.id)===String(p.studentId))),Periodo:p.periodo,Monto:mxn(p.monto),Estado:p.estado,Fecha:dateFmt(p.fechaPago||p.fechaVencimiento)}));return <><PageHeading eyebrow="Lectura de tu escuela" title="Reportes" description="Datos concretos para tomar decisiones con más claridad." action={<ExportButtons rows={rows} filename="reporte-tkd" title="Reporte financiero"/>}/><div className="grid grid-cols-2 xl:grid-cols-4 gap-3"><Stat label="Alumnos" value={String(students.length)} note={`${students.filter((s:any)=>s.activo).length} activos`} icon={Users}/><Stat label="Ingresos registrados" value={mxn(paid)} note="Suma de pagos realizados" icon={ArrowDownLeft} color="green"/><Stat label="Pendiente de cobro" value={mxn(pending)} icon={ArrowUpRight} color="red"/><Stat label="Asistencias" value={String(attendance.length)} note="Todos los registros" icon={ClipboardCheck} color="gold"/></div><div className="grid lg:grid-cols-[1.1fr_.9fr] gap-4 mt-5"><section className="panel p-5"><div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Ingresos registrados</div><h3 className="display text-2xl font-bold mt-1">Últimos seis meses</h3>{payments.length?<div className="flex items-end gap-3 h-52 mt-7 px-2">{months.map(m=><div className="flex-1 flex flex-col items-center gap-2 h-full justify-end" key={m.key}><div className="text-[10px] mono text-muted-foreground">{m.value?mxn(m.value):'—'}</div><div className="w-full max-w-12 rounded-t-md bg-[#173b70] relative" style={{height:`${Math.max(5,m.value/max*72)}%`}}/><div className="text-[10px] uppercase text-muted-foreground">{m.label}</div></div>)}</div>:<Empty title="Sin cifras para comparar" text="Al registrar pagos, verás el ritmo de ingresos aquí."/>}</section><section className="panel p-5"><div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">En números</div><h3 className="display text-2xl font-bold mt-1">Tu escuela ahora</h3><div className="mt-5 space-y-4"><ReportLine label="Alumnos activos" value={students.filter((s:any)=>s.activo).length} total={Math.max(1,students.length)} color="bg-[#173b70]"/><ReportLine label="Pagos al corriente" value={payments.filter((p:any)=>p.estado==='pagado').length} total={Math.max(1,payments.length)} color="bg-emerald-600"/><ReportLine label="Asistencias registradas" value={attendance.length} total={Math.max(1,attendance.length)} color="bg-[#c9213b]"/><div className="border-t border-border pt-4 flex justify-between text-sm"><span className="text-muted-foreground">Ventas de inventario</span><strong>{sales.length} movimientos</strong></div></div></section></div><section className="panel mt-5 overflow-hidden"><div className="p-5 flex items-center justify-between"><div><div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Pagos</div><h3 className="display text-2xl font-bold mt-1">Detalle exportable</h3></div><ExportButtons rows={rows} filename="pagos-app-tkd" title="Historial de pagos"/></div>{payments.length?<div className="table-wrap"><table><thead><tr><th>Alumno</th><th>Periodo</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>{payments.slice(0,8).map((p:any)=><tr key={p.id}><td>{fullName(students.find((s:any)=>String(s.id)===String(p.studentId)))}</td><td>{p.periodo}</td><td className="mono">{mxn(p.monto)}</td><td><Status value={p.estado}/></td><td>{dateFmt(p.fechaPago||p.fechaVencimiento)}</td></tr>)}</tbody></table></div>:<Empty title="Sin pagos registrados" text="El reporte se actualizará en cuanto registres movimientos."/>}</section></>; }
function ReportLine({label,value,total,color}:{label:string;value:number;total:number;color:string}) { return <div><div className="flex justify-between text-xs mb-1.5"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div><div className="h-2 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{width:`${Math.min(100,value/total*100)}%`}}/></div></div>; }

function SettingsPage({data,auth}:{data:any;auth:any}) { const [backup,setBackup]=useState('');const [busy,setBusy]=useState(false);const makeBackup=async()=>{setBusy(true);setBackup('');try{const result=await data.createBackup();setBackup(`Respaldo guardado en el almacenamiento seguro de la escuela${result?`: ${result}`:''}.`);}catch{setBackup('No fue posible generar el respaldo. Intenta de nuevo.');}finally{setBusy(false);}};return <><PageHeading eyebrow="Tu espacio de trabajo" title="Configuración" description="Preferencias y herramientas para cuidar la información de la escuela."/><div className="grid lg:grid-cols-[1fr_.8fr] gap-4"><section className="panel p-5 md:p-6"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 grid place-items-center"><UserRound size={19}/></div><div><h3 className="display text-2xl font-bold">Cuenta de instructor</h3><p className="text-xs text-muted-foreground mt-1">Sesión protegida con acceso por correo.</p></div></div><div className="mt-5 space-y-3"><Info label="Nombre" value={auth.user?.displayName||'Instructor'} icon={UserRound}/><Info label="Correo" value={auth.user?.email} icon={Mail}/><Info label="Estado" value={data.isOnline?'Conectado':'Sin conexión'} icon={data.isOnline?Wifi:WifiOff}/></div><button className="btn btn-quiet mt-5" onClick={()=>auth.signOut()}><LogOut size={15}/> Cerrar sesión</button></section><section className="panel p-5 md:p-6"><div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 grid place-items-center"><Download size={19}/></div><h3 className="display text-2xl font-bold mt-4">Respaldo de datos</h3><p className="text-sm text-muted-foreground mt-1">Crea una copia segura de los datos de tu escuela.</p><button className="btn btn-primary mt-5" onClick={makeBackup} disabled={busy}><Download size={15}/>{busy?'Preparando…':'Crear respaldo'}</button>{backup&&<div className="text-xs text-muted-foreground mt-3">{backup}</div>}</section><section className="panel p-5 md:p-6 lg:col-span-2"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 grid place-items-center"><Wifi size={19}/></div><div><h3 className="display text-2xl font-bold">Conexión y sincronización</h3><p className="text-xs text-muted-foreground">La app está pensada para seguir funcionando cuando estás fuera de línea.</p></div></div><div className="mt-5 flex flex-wrap gap-3"><span className={`tag ${data.isOnline?'bg-emerald-100 text-emerald-800':'bg-amber-100 text-amber-900'}`}>{data.isOnline?'Conectado a internet':'Modo sin conexión'}</span><span className="tag bg-blue-100 text-blue-800">{syncLabel(data.syncState)}</span></div><p className="text-xs text-muted-foreground mt-3">Los cambios guardados se sincronizan al recuperar conexión. Mantén tu sesión abierta hasta que se complete el proceso.</p></section><section className="panel p-5 md:p-6 lg:col-span-2 bg-[#173b70] text-white border-0"><div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"><div><div className="text-[10px] uppercase tracking-[.18em] text-blue-100/65">App TKD · México</div><h3 className="display text-3xl font-bold mt-1">Disciplina que se nota.</h3><p className="text-sm text-blue-100/70 mt-1">Organiza el trabajo para dedicarte a formar mejores atletas.</p></div><Dumbbell size={38} className="text-[#f1c85b]"/></div></section></div></>; }

export default App;
