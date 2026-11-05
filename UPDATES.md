# 🔄 Inyector YT APPS — Guía de Updates y Actualizaciones

Cada vez que quieras actualizar la app (cambiar contenido, arreglar bugs, nuevas funciones), sigue este flujo.

---

## ⚡ Flujo Rápido (Solo cambios en la web)

Si solo modificaste `index.html`, `app.js`, `admin.html` o `admin.js`:

```powershell
# 1. Sincronizar archivos web con el proyecto Android
npm run cap:sync

# 2. Recompilar el APK Release firmado
cmd /c "set JAVA_HOME=e:\jdk21\jdk-21.0.12.1+1&& set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk&& cd android && gradlew.bat assembleRelease"

# 3. Copiar APK con nuevo nombre de versión
Copy-Item "android\app\build\outputs\apk\release\app-release.apk" "InyectorYT-v1.1-release.apk"
```

---

## 📋 Checklist de Actualización Completa

### Paso 1 — Editar los archivos web

| Archivo | Para qué sirve |
|---------|----------------|
| `index.html` | Cambiar UI, layout, estilos |
| `app.js` | Lógica, categorías, Firebase, descargas |
| `admin.html` | Panel de administración |
| `admin.js` | Lógica del panel admin |
| `games.json` | Catálogo de apps en fallback local |

### Paso 2 — Incrementar el versionCode

Edita `android/app/build.gradle`:

```groovy
defaultConfig {
    versionCode 2        // ← Incrementar SIEMPRE en cada update (+1)
    versionName "1.1"    // ← Versión visible para el usuario
}
```

> ⚠️ **OBLIGATORIO para Google Play:** Si subes una nueva versión sin incrementar el `versionCode`, Google Play rechazará la subida.

### Paso 3 — Sincronizar y compilar

```powershell
# Desde E:\APP Descargas
npm run cap:sync
cmd /c "set JAVA_HOME=e:\jdk21\jdk-21.0.12.1+1&& set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk&& cd android && gradlew.bat assembleRelease"
```

### Paso 4 — Verificar el APK generado

```powershell
Get-Item "android\app\build\outputs\apk\release\app-release.apk" | Select-Object Name, @{N='MB';E={[math]::Round($_.Length/1MB,2)}}, LastWriteTime
```

### Paso 5 — Renombrar y guardar

```powershell
# Usa el número de versión en el nombre del archivo
Copy-Item "android\app\build\outputs\apk\release\app-release.apk" "InyectorYT-v1.1-release.apk"
```

---

## 📦 Historial de Versiones

| Versión | versionCode | Fecha | Cambios |
|---------|-------------|-------|---------|
| **1.2.0** | 2 | 05/11/2026 | 🚀 Gran Actualización v1.2.0: Módulo de Petición de juegos/mods por usuarios (con o sin mods / de pago), Notificaciones Push nativas para Android con `@capacitor/local-notifications`, Avisos emitidos desde Admin, Sistema de Encuestas en tiempo real administrables, Modal de Bienvenida para primera instalación, Modal "Acerca de esta versión", **Aviso de publicidad antes de descarga** (modal previo al anuncio), **In-App Interstitial Monetag** reemplaza al anuncio anterior (frecuencia, capping, intervalo y delay configurados). **Totalmente compatible con Android 10 (API 29) y arquitecturas de 32 bits (armeabi-v7a / x86) y 64 bits.** |
| **1.0** | 1 | 18/10/2026 | 🚀 Lanzamiento inicial. App nativa Android con Capacitor. Nombre: Inyector YT APPS. Ícono personalizado. APK Release firmado. |

---

## 🔢 Control de Versiones — Referencia Rápida

```
versionCode: número entero que SIEMPRE sube (+1 por cada release)
versionName: texto visible al usuario ("1.0", "1.1", "2.0", etc.)

Ejemplos:
  Bug fix menor   → versionCode +1, versionName "1.0.1"
  Nueva función   → versionCode +1, versionName "1.1"
  Rediseño total  → versionCode +1, versionName "2.0"
```

---

## 🌐 Publicar Update en Google Play

Una vez compilado el nuevo APK:

1. Ir a [play.google.com/console](https://play.google.com/console)
2. Seleccionar **Inyector YT APPS**
3. Ir a **Producción** → **Crear nueva versión**
4. Subir el nuevo `app-release.apk` (o `.aab` si usas bundleRelease)
5. Escribir las **notas de la versión** (qué cambió)
6. Enviar para revisión → aprobación en 1-3 días

### Alternativa: Generar Android App Bundle (recomendado por Google)

```powershell
cmd /c "set JAVA_HOME=e:\jdk21\jdk-21.0.12.1+1&& set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk&& cd android && gradlew.bat bundleRelease"
```
Salida: `android\app\build\outputs\bundle\release\app-release.aab`

> El `.aab` es más pequeño y eficiente que el `.apk`. Google Play lo prefiere.

---

## 🗂️ Actualizaciones Solo del Catálogo (Sin recompilar)

Si solo quieres agregar o editar apps en el catálogo, **no necesitas recompilar**:

1. Ve al **Panel Admin** (`admin.html` en tu web o en la app)
2. Agrega/edita/elimina apps directamente en **Firebase Firestore**
3. Los cambios aparecen en tiempo real en todos los dispositivos (sin nuevo APK)

> Esta es la gran ventaja de usar Firebase: el catálogo se actualiza al instante sin necesidad de publicar un nuevo APK.

---

## 🆘 Comandos de Emergencia

### Limpiar caché de Gradle (si hay errores extraños)
```powershell
cmd /c "set JAVA_HOME=e:\jdk21\jdk-21.0.12.1+1&& cd android && gradlew.bat clean"
```

### Forzar recompilación completa
```powershell
cmd /c "set JAVA_HOME=e:\jdk21\jdk-21.0.12.1+1&& set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk&& cd android && gradlew.bat clean assembleRelease"
```

### Ver tareas disponibles de Gradle
```powershell
cmd /c "set JAVA_HOME=e:\jdk21\jdk-21.0.12.1+1&& cd android && gradlew.bat tasks"
```

---

## 📁 Archivos que NO debes perder

| Archivo | Por qué es crítico |
|---------|-------------------|
| `apkstore.keystore` | Sin este no puedes actualizar en Google Play NUNCA |
| Contraseña: `apkstore2024` | Necesaria para firmar cada release |
| Alias: `apkstore` | Identificador de la firma |

> 💾 **Backup:** Guarda `apkstore.keystore` en Google Drive, un USB y otro lugar seguro.

---

*Inyector YT APPS — Guía de Updates v1.0 — 18/10/2026*
