# Panduan Deployment StoryShare

## Persiapan Sebelum Deploy

1. **Build aplikasi:**
   ```bash
   npm run build
   ```
   
2. **Test lokal:**
   ```bash
   npm run serve
   ```
   Buka http://localhost:8080 dan pastikan semua fitur berfungsi.

3. **Update STUDENT.txt** dengan informasi Anda dan URL deployment.

---

## Opsi 1: Deploy ke GitHub Pages

### Langkah-langkah:

1. **Buat repository baru di GitHub** (jika belum ada)

2. **Push kode ke GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO-NAME.git
   git push -u origin main
   ```

3. **Deploy folder dist ke GitHub Pages:**
   ```bash
   # Install gh-pages (jika belum)
   npm install --save-dev gh-pages
   
   # Deploy
   npx gh-pages -d dist
   ```

4. **Aktifkan GitHub Pages:**
   - Buka repository di GitHub
   - Settings → Pages
   - Source: pilih branch `gh-pages`
   - Save

5. **URL akan tersedia di:**
   ```
   https://USERNAME.github.io/REPO-NAME/
   ```

6. **Update STUDENT.txt** dengan URL tersebut.

---

## Opsi 2: Deploy ke Netlify

### Langkah-langkah:

1. **Buat akun di [Netlify](https://www.netlify.com/)**

2. **Deploy via Drag & Drop:**
   - Login ke Netlify
   - Klik "Add new site" → "Deploy manually"
   - Drag folder `dist` ke area upload
   - Tunggu proses deploy selesai

3. **Atau deploy via CLI:**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login
   netlify login
   
   # Deploy
   netlify deploy --prod --dir=dist
   ```

4. **URL akan tersedia di:**
   ```
   https://RANDOM-NAME.netlify.app
   ```
   (Anda bisa custom domain di settings)

5. **Update STUDENT.txt** dengan URL tersebut.

---

## Opsi 3: Deploy ke Firebase Hosting

### Langkah-langkah:

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login ke Firebase:**
   ```bash
   firebase login
   ```

3. **Inisialisasi Firebase:**
   ```bash
   firebase init hosting
   ```
   - Pilih "Use an existing project" atau "Create a new project"
   - Public directory: ketik `dist`
   - Configure as SPA: pilih `Yes`
   - Set up automatic builds: pilih `No`

4. **Deploy:**
   ```bash
   firebase deploy
   ```

5. **URL akan tersedia di:**
   ```
   https://PROJECT-ID.web.app
   ```

6. **Update STUDENT.txt** dengan URL tersebut.

---

## Verifikasi Setelah Deploy

Pastikan fitur-fitur berikut berfungsi:

### ✅ Checklist PWA:
- [ ] Aplikasi dapat diinstall (muncul prompt install)
- [ ] Aplikasi berfungsi offline
- [ ] Service Worker terdaftar (cek di DevTools → Application → Service Workers)
- [ ] Manifest terbaca (cek di DevTools → Application → Manifest)

### ✅ Checklist Push Notification:
- [ ] Toggle button notifikasi muncul di header
- [ ] Dapat subscribe/unsubscribe notifikasi
- [ ] Notifikasi muncul saat ada story baru (test dengan API)

### ✅ Checklist IndexedDB:
- [ ] Dapat menambah cerita ke favorit
- [ ] Dapat melihat halaman favorit (#/favorites)
- [ ] Dapat search dan sort di halaman favorit
- [ ] Dapat menghapus dari favorit
- [ ] Offline sync berfungsi (test dengan offline mode)

### ✅ Checklist Umum:
- [ ] Login/Register berfungsi
- [ ] Dapat menambah cerita dengan foto dan lokasi
- [ ] Peta menampilkan marker cerita
- [ ] SPA routing berfungsi (tidak reload halaman)
- [ ] Aksesibilitas: skip to content, aria-label, dll

---

## Troubleshooting

### Service Worker tidak terdaftar:
- Pastikan mengakses via HTTPS atau localhost
- Clear cache browser (Ctrl+Shift+Delete)
- Hard reload (Ctrl+Shift+R)

### Manifest tidak terbaca:
- Pastikan path `/manifest.json` benar
- Cek CORS headers di hosting

### Push Notification tidak berfungsi:
- Pastikan VAPID key sudah benar di `config.js`
- Pastikan permission notifikasi granted
- Test di browser yang support (Chrome, Firefox, Edge)

### Aplikasi tidak bisa diinstall:
- Pastikan manifest lengkap (name, icons, start_url)
- Pastikan service worker terdaftar
- Pastikan akses via HTTPS

---

## Update STUDENT.txt

Setelah deploy berhasil, update file `STUDENT.txt`:

```
Nama: [NAMA LENGKAP ANDA]
Email: [EMAIL ANDA]
ID Dicoding: F308D5X1933
URL Deployment: https://your-app.netlify.app
```

Lalu commit dan push perubahan:
```bash
git add STUDENT.txt
git commit -m "Update deployment URL"
git push
```

---

## Catatan Penting

1. **VAPID Key**: Sudah dikonfigurasi di `src/scripts/config.js`
2. **API Endpoint**: Menggunakan `https://story-api.dicoding.dev/v1`
3. **Browser Support**: Chrome, Firefox, Edge (modern browsers)
4. **HTTPS Required**: Untuk PWA dan Push Notification

---

Selamat! Aplikasi StoryShare Anda siap untuk submission! 🎉

