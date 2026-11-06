export type Student = {
  id: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  telefono: string;
  email: string;
  contactoEmergencia: string;
  telefonoEmergencia: string;
  direccion: string;
  grado: string;
  fechaIngreso: string;
  cuotaMensual: number;
  activo: boolean;
  fotoUrl: string;
  fotoPath: string;
};

export type StudentInput = Omit<Student, "id">;
export type StudentUpdate = Partial<StudentInput>;

export type GradeHistory = {
  id: string;
  studentId: string;
  grado: string;
  fecha: string;
  notas: string;
};
export type GradeInput = Omit<GradeHistory, "id">;

export type AttendanceStatus = "presente" | "tardanza" | "falta" | "ausente";
export type Attendance = {
  id: string;
  studentId: string;
  clase: string;
  fecha: string;
  hora: string;
  estado: AttendanceStatus;
};
export type AttendanceInput = Omit<Attendance, "id" | "hora"> & {
  hora?: string;
};

export type PaymentStatus = "pendiente" | "pagado" | "vencido";
export type Payment = {
  id: string;
  studentId: string;
  monto: number;
  periodo: string;
  fechaVencimiento: string;
  fechaPago: string;
  estado: PaymentStatus;
  metodo: string;
  concepto: string;
};
export type PaymentInput = Omit<Payment, "id">;
export type PaymentUpdate = Partial<PaymentInput>;

export type Product = {
  id: string;
  nombre: string;
  categoria: string;
  talla: string;
  stock: number;
  precio: number;
  activo: boolean;
};
export type ProductInput = Omit<Product, "id">;
export type ProductUpdate = Partial<ProductInput>;

export type SaleItem = {
  productId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
};

export type Sale = {
  id: string;
  articulos: SaleItem[];
  total: number;
  fecha: string;
  metodoPago: string;
};
export type SaleInput = Omit<Sale, "id" | "fecha"> & { fecha?: string };

export type SyncState = "sincronizado" | "sincronizando" | "sin-conexion";

export type TKDBackup = {
  creadoEn: string;
  alumnos: Student[];
  grados: GradeHistory[];
  asistencias: Attendance[];
  pagos: Payment[];
  productos: Product[];
  ventas: Sale[];
};
