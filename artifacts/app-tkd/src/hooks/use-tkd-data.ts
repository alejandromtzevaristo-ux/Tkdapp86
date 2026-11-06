import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  getDocs,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import {
  db,
  firebaseConfigured,
  offlinePersistenceEnabled,
  requireFirestore,
  requireStorage,
} from "@/lib/firebase";
import type {
  Attendance,
  AttendanceInput,
  GradeHistory,
  GradeInput,
  Payment,
  PaymentInput,
  PaymentUpdate,
  Product,
  ProductInput,
  ProductUpdate,
  Sale,
  SaleInput,
  Student,
  StudentInput,
  StudentUpdate,
  SyncState,
  TKDBackup,
} from "@/lib/tkd-types";

type CollectionKey =
  | "students"
  | "grades"
  | "attendance"
  | "payments"
  | "products"
  | "sales";
type DataState = Record<CollectionKey, unknown[]>;

const emptyData: DataState = {
  students: [],
  grades: [],
  attendance: [],
  payments: [],
  products: [],
  sales: [],
};

function collectionPath(userId: string, key: CollectionKey) {
  return collection(requireFirestore(), "schools", userId, key);
}

function withId<T>(snapshot: QueryDocumentSnapshot<DocumentData>): T {
  return { ...snapshot.data(), id: snapshot.id } as T;
}

function friendlyError(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  const messages: Record<string, string> = {
    "permission-denied":
      "Firebase rechazó el acceso. Revisa que las reglas estén publicadas y la sesión siga activa.",
    "unavailable":
      "Firebase no está disponible en este momento. Los cambios sin conexión se sincronizarán al recuperar la red.",
    "failed-precondition":
      "Firebase requiere una configuración adicional para completar esta operación.",
    "storage/unauthorized":
      "No hay permiso para guardar el archivo. Revisa las reglas de Firebase Storage.",
    "storage/canceled": "Se canceló la subida del archivo.",
    "storage/unknown": "No se pudo completar la subida del archivo.",
  };
  if (messages[code]) return messages[code];
  if (
    error instanceof Error &&
    (error.message.startsWith("Configura ") ||
      error.message.startsWith("Inicia sesión") ||
      error.message.startsWith("La ") ||
      error.message.startsWith("Conéctate"))
  ) {
    return error.message;
  }
  return "No se pudieron guardar los cambios. Inténtalo de nuevo.";
}

export function useTKDData(userId: string | undefined) {
  const [data, setData] = useState<DataState>(emptyData);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [syncState, setSyncState] = useState<SyncState>(
    typeof navigator === "undefined" || navigator.onLine
      ? "sincronizado"
      : "sin-conexion",
  );
  const loadedCollections = useRef(new Set<CollectionKey>());
  const pendingByCollection = useRef(new Map<CollectionKey, boolean>());
  const autoBackupStarted = useRef(false);

  useLayoutEffect(() => {
    setData(emptyData);
    setLoading(Boolean(userId));
    setError(null);
  }, [userId]);

  useEffect(() => {
    const updateOnlineState = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (!online) setSyncState("sin-conexion");
      else setSyncState("sincronizando");
    };
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  useEffect(() => {
    loadedCollections.current = new Set();
    pendingByCollection.current = new Map();
    autoBackupStarted.current = false;
    if (!userId) {
      setData(emptyData);
      setLoading(false);
      setError(null);
      return;
    }
    if (!firebaseConfigured || !db) {
      setData(emptyData);
      setLoading(false);
      setError("Configura Firebase en Replit Secrets para cargar los datos.");
      return;
    }

    setLoading(true);
    setError(null);
    const collections: CollectionKey[] = [
      "students",
      "grades",
      "attendance",
      "payments",
      "products",
      "sales",
    ];
    const unsubscribers = collections.map((key) =>
      onSnapshot(
        collectionPath(userId, key),
        { includeMetadataChanges: true },
        (snapshot) => {
          loadedCollections.current.add(key);
          pendingByCollection.current.set(
            key,
            snapshot.metadata.hasPendingWrites,
          );
          setData((current) => ({
            ...current,
            [key]: snapshot.docs.map((item) => withId(item)),
          }));
          setLoading(loadedCollections.current.size < collections.length);
          const anyPending = [...pendingByCollection.current.values()].some(
            Boolean,
          );
          setSyncState(
            !navigator.onLine
              ? "sin-conexion"
              : anyPending
                ? "sincronizando"
                : "sincronizado",
          );
        },
        (cause) => {
          setLoading(false);
          setError(friendlyError(cause));
        },
      ),
    );
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [userId]);

  const run = useCallback(async <T,>(action: () => Promise<T>) => {
    setError(null);
    try {
      return await action();
    } catch (cause) {
      const message = friendlyError(cause);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const addStudent = useCallback(
    (input: StudentInput) =>
      run(async () => {
        if (!userId) throw new Error("Inicia sesión para guardar alumnos.");
        const created = doc(collectionPath(userId, "students"));
        await setDoc(created, {
          ...input,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return created.id;
      }),
    [run, userId],
  );

  const updateStudent = useCallback(
    (studentId: string, input: StudentUpdate) =>
      run(async () => {
        if (!userId) throw new Error("Inicia sesión para editar alumnos.");
        await updateDoc(doc(collectionPath(userId, "students"), studentId), {
          ...input,
          updatedAt: serverTimestamp(),
        });
      }),
    [run, userId],
  );

  const deleteStudent = useCallback(
    (studentId: string) =>
      run(async () => {
        if (!userId) throw new Error("Inicia sesión para eliminar alumnos.");
        await deleteDoc(doc(collectionPath(userId, "students"), studentId));
      }),
    [run, userId],
  );

  const addGrade = useCallback(
    (input: GradeInput) =>
      run(async () => {
        if (!userId) throw new Error("Inicia sesión para registrar grados.");
        const created = await addDoc(collectionPath(userId, "grades"), {
          ...input,
          createdAt: serverTimestamp(),
        });
        return created.id;
      }),
    [run, userId],
  );

  const recordAttendance = useCallback(
    (input: AttendanceInput) =>
      run(async () => {
        if (!userId) throw new Error("Inicia sesión para tomar asistencia.");
        const dateKey = input.fecha.replaceAll("/", "-");
        const classKey = input.clase.trim().replaceAll("/", "-");
        const attendanceId = `${input.studentId}_${dateKey}_${classKey}`;
        const record: Omit<Attendance, "id"> = {
          ...input,
          hora: input.hora ?? new Date().toISOString(),
        };
        await setDoc(doc(collectionPath(userId, "attendance"), attendanceId), {
          ...record,
          updatedAt: serverTimestamp(),
        });
        return attendanceId;
      }),
    [run, userId],
  );

  const addPayment = useCallback(
    (input: PaymentInput) =>
      run(async () => {
        if (!userId) throw new Error("Inicia sesión para registrar pagos.");
        const created = await addDoc(collectionPath(userId, "payments"), {
          ...input,
          createdAt: serverTimestamp(),
        });
        return created.id;
      }),
    [run, userId],
  );

  const updatePayment = useCallback(
    (paymentId: string, input: PaymentUpdate) =>
      run(async () => {
        if (!userId) throw new Error("Inicia sesión para editar pagos.");
        await updateDoc(doc(collectionPath(userId, "payments"), paymentId), {
          ...input,
          updatedAt: serverTimestamp(),
        });
      }),
    [run, userId],
  );

  const addProduct = useCallback(
    (input: ProductInput) =>
      run(async () => {
        if (!userId) throw new Error("Inicia sesión para agregar productos.");
        const created = await addDoc(collectionPath(userId, "products"), {
          ...input,
          createdAt: serverTimestamp(),
        });
        return created.id;
      }),
    [run, userId],
  );

  const updateProduct = useCallback(
    (productId: string, input: ProductUpdate) =>
      run(async () => {
        if (!userId) throw new Error("Inicia sesión para editar inventario.");
        await updateDoc(doc(collectionPath(userId, "products"), productId), {
          ...input,
          updatedAt: serverTimestamp(),
        });
      }),
    [run, userId],
  );

  const deleteProduct = useCallback(
    (productId: string) =>
      run(async () => {
        if (!userId) throw new Error("Inicia sesión para eliminar productos.");
        await deleteDoc(doc(collectionPath(userId, "products"), productId));
      }),
    [run, userId],
  );

  const createSale = useCallback(
    (input: SaleInput) =>
      run(async () => {
        if (!userId) throw new Error("Inicia sesión para registrar ventas.");
        const batch = writeBatch(requireFirestore());
        const saleRef = doc(collectionPath(userId, "sales"));
        batch.set(saleRef, {
          ...input,
          fecha: input.fecha ?? new Date().toISOString(),
          createdAt: serverTimestamp(),
        });
        for (const item of input.articulos) {
          if (item.cantidad <= 0) {
            throw new Error("La cantidad de cada artículo debe ser mayor a cero.");
          }
          batch.update(doc(collectionPath(userId, "products"), item.productId), {
            stock: increment(-item.cantidad),
            updatedAt: serverTimestamp(),
          });
        }
        await batch.commit();
        return saleRef.id;
      }),
    [run, userId],
  );

  const uploadStudentPhoto = useCallback(
    (studentId: string, file: File) =>
      run(async () => {
        if (!userId) throw new Error("Inicia sesión para subir fotografías.");
        if (!file.type.startsWith("image/")) {
          throw new Error("Selecciona un archivo de imagen.");
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("La imagen debe pesar menos de 10 MB.");
        }
        const photoPath = `schools/${userId}/students/${studentId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const photoRef = ref(requireStorage(), photoPath);
        await uploadBytes(photoRef, file, { contentType: file.type });
        const fotoUrl = await getDownloadURL(photoRef);
        await updateDoc(doc(collectionPath(userId, "students"), studentId), {
          fotoUrl,
          fotoPath: photoPath,
          updatedAt: serverTimestamp(),
        });
        return { fotoUrl, fotoPath: photoPath };
      }),
    [run, userId],
  );

  const createBackup = useCallback(
    () =>
      run(async () => {
        if (!userId) throw new Error("Inicia sesión para crear un respaldo.");
        if (!navigator.onLine) {
          throw new Error("Conéctate a internet para guardar el respaldo en Firebase.");
        }
        const keys: CollectionKey[] = [
          "students",
          "grades",
          "attendance",
          "payments",
          "products",
          "sales",
        ];
        const results = await Promise.all(
          keys.map((key) => getDocs(collectionPath(userId, key))),
        );
        const backup: TKDBackup = {
          creadoEn: new Date().toISOString(),
          alumnos: results[0].docs.map((item) => withId<Student>(item)),
          grados: results[1].docs.map((item) => withId<GradeHistory>(item)),
          asistencias: results[2].docs.map((item) => withId<Attendance>(item)),
          pagos: results[3].docs.map((item) => withId<Payment>(item)),
          productos: results[4].docs.map((item) => withId<Product>(item)),
          ventas: results[5].docs.map((item) => withId<Sale>(item)),
        };
        const filename = `app-tkd-${backup.creadoEn.slice(0, 10)}-${Date.now()}.json`;
        const backupRef = ref(
          requireStorage(),
          `schools/${userId}/backups/${filename}`,
        );
        await uploadBytes(
          backupRef,
          new Blob([JSON.stringify(backup, null, 2)], {
            type: "application/json",
          }),
          { contentType: "application/json" },
        );
        return filename;
      }),
    [run, userId],
  );

  useEffect(() => {
    if (loading || !userId || !isOnline || autoBackupStarted.current) return;
    autoBackupStarted.current = true;
    const backupKey = `app-tkd-last-backup-${userId}`;
    const lastBackup = Number(localStorage.getItem(backupKey) ?? 0);
    if (Date.now() - lastBackup < 24 * 60 * 60 * 1000) return;
    void createBackup()
      .then(() => localStorage.setItem(backupKey, String(Date.now())))
      .catch((cause) => {
        setError(`No se pudo crear el respaldo automático: ${friendlyError(cause)}`);
      });
  }, [createBackup, isOnline, loading, userId]);

  return {
    students: data.students as Student[],
    grades: data.grades as GradeHistory[],
    attendance: data.attendance as Attendance[],
    payments: data.payments as Payment[],
    products: data.products as Product[],
    sales: data.sales as Sale[],
    loading,
    error,
    isOnline,
    syncState,
    offlinePersistenceEnabled,
    addStudent,
    updateStudent,
    deleteStudent,
    addGrade,
    recordAttendance,
    addPayment,
    updatePayment,
    addProduct,
    updateProduct,
    deleteProduct,
    createSale,
    uploadStudentPhoto,
    createBackup,
  };
}
