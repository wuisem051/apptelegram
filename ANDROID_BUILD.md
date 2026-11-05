# 📱 APK Store — Guía Completa de la App Android Nativa

> Documentación técnica del proyecto convertido de **Telegram Mini App / Web App** a **App Nativa Android** usando **Capacitor**.

---

## 🏗️ Arquitectura del Proyecto

```
E:\APP Descargas\
│
├── 📄 index.html            ← UI principal de la tienda de APKs
├── 📄 app.js                ← Lógica: Firebase, Firestore, Monetag, categorías, descargas
├── 📄 admin.html            ← Panel de administración (agregar/editar apps)
├── 📄 admin.js              ← Lógica del panel admin
├── 📄 games.json            ← Catálogo local de apps (respaldo del Firestore)
├── 📄 bot.js                ← Bot de Telegram (Node.js + Telegraf) — solo para TMA
├── 📄 package.json          ← Dependencias Node.js + scripts de build
├── 📄 capacitor.config.json ← Configuración de Capacitor (puente web → Android)
│
├── 📁 www/                  ← Copia de los archivos web para Capacitor
│   ├── index.html
│   ├── app.js
│   ├── admin.html
│   ├── admin.js
│   └── games.json
│
├── 📁 android/              ← Proyecto nativo Android (generado por Capacitor)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml  ← Permisos (INTERNET, STORAGE, INSTALL_PACKAGES)
│   │   │   └── assets/public/       ← Web assets copiados aquí en cada sync
│   │   └── build.gradle             ← Config compilación Android (appId, SDK version)
│   ├── build.gradle                 ← Config raíz (AGP 8.13.0, google-services 4.4.4)
│   ├── variables.gradle             ← Versiones de SDK y librerías
│   └── gradlew.bat                  ← Compilador de Gradle para Windows
│
├── 📦 APKStore-debug.apk    ← ✅ APK compilado y listo para instalar
└── 📁 node_modules/         ← Dependencias npm (incluyendo @capacitor/*)
```

---

## 🔧 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | HTML + Vanilla JS + Tailwind CSS (CDN) |
| **Fuente de datos** | Firebase Firestore (real-time) + `games.json` (fallback) |
| **Monetización** | Monetag (SDK Telegram Mini App + SmartLink) |
| **Puente nativo** | Capacitor v8.5.3 |
| **Android Native** | Android Gradle Plugin 8.13.0 |
| **SDK mínimo** | Android 7.0 (API 24) |
| **SDK objetivo** | Android 16 (API 36) |
| **JDK requerido** | ⚠️ OpenJDK 21 LTS (Temurin) — instalado en `E:\jdk21\` |
| **Bot Telegram** | Node.js 24 + Telegraf 4.16 |

---

## 📋 Permisos Android Configurados

Archivo: `android/app/src/main/AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
```

| Permiso | Para qué sirve |
|---------|----------------|
| `INTERNET` | Firebase, Monetag, cargar imágenes remotas |
| `POST_NOTIFICATIONS` | Avisos y notificaciones push nativas en Android 13+ |
| `READ/WRITE_EXTERNAL_STORAGE` | Guardar APKs descargados (Android 12 o menor) |
| `REQUEST_INSTALL_PACKAGES` | Instalar APKs directamente desde la app |

---

## 🔑 Identificadores de la App

| Campo | Valor |
|-------|-------|
| **App ID** | `com.apkstore.app` |
| **Nombre visible** | APK Store / Inyector YT APPS |
| **Version Code** | 2 |
| **Version Name** | 1.2.0 |
| **Proyecto Firebase** | `apptelegram-6aa9a` |

---

## 🛠️ Scripts Disponibles

```bash
# Copiar archivos web a la carpeta www/
npm run build

# Copiar web assets + sincronizar con el proyecto Android
npm run cap:sync

# Abrir el proyecto en Android Studio
npm run cap:open

# Iniciar el bot de Telegram
npm start
```

---

## ⚙️ Compilar el APK

### Herramientas instaladas en tu sistema

| Herramienta | Ubicación |
|-------------|-----------|
| Node.js 24 | En PATH global |
| **JDK 21 (Temurin)** | `E:\jdk21\jdk-21.0.12.1+1\` |
| Android SDK | `C:\Users\Maxi\AppData\Local\Android\Sdk\` |
| Android Studio 2026.2 | `G:\android\` |
| Gradle 8.14.3 | Descargado automáticamente por el wrapper |

> ⚠️ El JDK de Android Studio (`G:\android\jbr`) es versión 25 y **NO es compatible** con Capacitor 8. Siempre usar `E:\jdk21\`.

### APK Debug (para pruebas)

```powershell
npm run cap:sync

cmd /c "set JAVA_HOME=e:\jdk21\jdk-21.0.12.1+1&& set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk&& cd android && gradlew.bat assembleDebug"
```

Salida: `android\app\build\outputs\apk\debug\app-debug.apk`

### APK Release (para distribuir)

```powershell
cmd /c "set JAVA_HOME=e:\jdk21\jdk-21.0.12.1+1&& set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk&& cd android && gradlew.bat assembleRelease"
```

> Requiere keystore de firma. Ver sección de firma más abajo.

---

## 🔄 Flujo de Trabajo: Actualizar la App

```
1. Editar archivos web (index.html, app.js, etc.)
         ↓
2. npm run cap:sync   ← Copia cambios a www/ y sincroniza con Android
         ↓
3. gradlew.bat assembleDebug  ← Recompila el APK
         ↓
4. Instalar APKStore-debug.apk en el teléfono
```

---

## 🚀 Próximos Pasos Recomendados

### 1. 🖼️ Cambiar el ícono de la app

Reemplaza los archivos PNG en:
```
android/app/src/main/res/mipmap-mdpi/ic_launcher.png      (48x48 px)
android/app/src/main/res/mipmap-hdpi/ic_launcher.png      (72x72 px)
android/app/src/main/res/mipmap-xhdpi/ic_launcher.png     (96x96 px)
android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png    (144x144 px)
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png   (192x192 px)
```
También los `ic_launcher_round.png` en los mismos tamaños.

### 2. 🌅 Splash Screen personalizado

Edita `android/app/src/main/res/values/styles.xml` para configurar color y logo de inicio.

### 3. 🔏 Firma para Google Play

```powershell
# Generar keystore (solo UNA vez — guarda el archivo con cuidado)
& "e:\jdk21\jdk-21.0.12.1+1\bin\keytool.exe" -genkeypair -v -keystore apkstore.keystore -alias apkstore -keyalg RSA -keysize 2048 -validity 10000
```

Luego en `android/app/build.gradle`:
```groovy
signingConfigs {
    release {
        storeFile file("../../apkstore.keystore")
        storePassword "TU_PASSWORD"
        keyAlias "apkstore"
        keyPassword "TU_PASSWORD"
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
    }
}
```

### 4. 📊 Firebase google-services.json

Descarga `google-services.json` desde:
> Firebase Console → proyecto `apptelegram-6aa9a` → Configuración → Tu app Android

Colócalo en: `android/app/google-services.json`

### 5. 📲 Mejores descargas nativas de APKs

```bash
npm install @capacitor/filesystem @capacitor/browser @capacitor/toast
npm run cap:sync
```

### 6. 🌐 Publicar en Google Play Store

```powershell
# Compilar Android App Bundle (formato preferido por Google Play)
cmd /c "set JAVA_HOME=e:\jdk21\jdk-21.0.12.1+1&& set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk&& cd android && gradlew.bat bundleRelease"
```
El `.aab` se genera en: `android\app\build\outputs\bundle\release\app-release.aab`

Luego sube a: https://play.google.com/console

---

## 🐛 Solución de Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Requires at least JVM 11` | Se usó Java 8 | Especificar `JAVA_HOME=e:\jdk21\jdk-21.0.12.1+1` |
| `invalid source release: 21` | Se usó JDK 17 | Capacitor 8 necesita JDK 21, usar `E:\jdk21\` |
| `Unsupported class file major version 69` | Se usó JDK 25 (Android Studio) | Nunca usar `G:\android\jbr`, siempre `E:\jdk21\` |
| Firebase/Monetag no carga | HTTP bloqueado | Verificar `"cleartext": true` en `capacitor.config.json` |
| Cambios web no visibles | Assets no sincronizados | Ejecutar `npm run cap:sync` antes de recompilar |
| `Could not resolve...` | Sin internet | Verificar conexión, ejecutar con `--refresh-dependencies` |

---

## 📁 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `capacitor.config.json` | Config principal: appId, webDir, servidor HTTPS |
| `android/variables.gradle` | Versiones SDK Android (min 24, target 36) |
| `android/build.gradle` | Config raíz Gradle (AGP 8.13.0, Google Services) |
| `android/app/build.gradle` | Config del módulo app (applicationId, versionCode) |
| `android/app/src/main/AndroidManifest.xml` | Permisos y configuración de la Activity |
| `package.json` | Scripts npm y dependencias (Capacitor, Telegraf) |
| `www/` | Carpeta de assets web empaquetados en el APK |

---

*Documentación generada el 18/10/2026 — Proyecto: APK Store v1.0*
