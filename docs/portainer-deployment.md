# Deployment Kontrak Karyawan di Portainer

Deployment menggunakan frontend Nginx sebagai satu-satunya entrypoint publik pada host port `3005`. Nginx meneruskan `/api/` dan `/health` ke backend internal pada port `3000`. Tidak ada port backend yang dipublish ke host.

## Prasyarat

- Docker Engine dan Portainer tersedia di server.
- Server dapat mengakses SQL Server existing.
- `backend/database/001_initial_schema.sql` sudah dijalankan.
- Tabel HRIS `dbo.hris_Employee` tersedia dan hanya dibaca aplikasi.
- Tabel `dbo.EmployeeContracts` sudah dibuat menggunakan `backend/database/001_initial_schema.sql`.

## Deploy melalui Portainer

1. Buka **Stacks** lalu pilih **Add stack**.
2. Masukkan nama stack `kontrakkaryawan`.
3. Deploy dari Git repository atau gunakan Web Editor.
4. Gunakan file `docker-compose.portainer.yml`.
5. Masukkan environment variables dari `portainer.env.example` pada bagian Environment variables Portainer.
6. Pastikan `APP_PORT=3005` dan `FRONTEND_URL=http://<SERVER-IP>:3005`.
7. Isi `DB_*` dan `JWT_SECRET`. Jangan menaruh credential asli di repository atau compose file.
8. Deploy stack.
9. Buka `http://<SERVER-IP>:3005`.

## Arsitektur

- `frontend` dipublish sebagai `3005:80`.
- `backend` hanya expose port internal `3000` pada network Docker.
- Nginx meneruskan `/api/` ke `http://backend:3000`.
- Nginx meneruskan `/health` ke endpoint backend `/health`.
- Tidak ada database container. Aplikasi memakai SQL Server existing.
- Kedua service memakai restart policy dan healthcheck.

## Validasi pada host Docker

```bash
docker compose --env-file portainer.env -f docker-compose.portainer.yml config
docker compose --env-file portainer.env -f docker-compose.portainer.yml build
docker compose --env-file portainer.env -f docker-compose.portainer.yml up -d
docker compose --env-file portainer.env -f docker-compose.portainer.yml ps
```

Verifikasi:

```text
http://<SERVER-IP>:3005
http://<SERVER-IP>:3005/health
```

## Catatan cookie

Cookie aplikasi adalah `bmc_contract_access_token`, bukan cookie Nomor Surat BMC. Untuk deployment HTTPS, gunakan `COOKIE_SECURE=true` dan konfigurasi SameSite sesuai arsitektur domain.
