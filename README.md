# My Pokemon App

แอป React + Vite สำหรับค้นหา “ท่าต่อสู้โปเกมอน (Moves)” โดยโหลดข้อมูลจากไฟล์ `src/data/moves_th.json` ที่ดึงมาจาก [PokeAPI](https://pokeapi.co/).

## Prerequisites

- Node.js แนะนำ **v20+**
- npm (มากับ Node.js)

## ติดตั้ง

```bash
npm install
```

## รันโปรเจกต์ (Development)

```bash
npm run dev
```

จากนั้นเปิดลิงก์ที่ Vite แสดงใน terminal (เช่น `http://localhost:5173`)

## สร้าง/อัปเดตไฟล์ข้อมูล Moves

สคริปต์จะดึงข้อมูล move ทั้งหมดจาก PokeAPI แล้ว **เขียนทับ** ไฟล์ `src/data/moves_th.json` ใหม่ทั้งหมด

```bash
node scripts/fetch-moves.js
```

หมายเหตุ:
- ฟิลด์ `name` เป็นอังกฤษ (ทับศัพท์แบบ PokeAPI)
- ฟิลด์ `description_th` จะถูกตั้งเป็น `""` (ยังไม่แปล)

## Build (Production)

```bash
npm run build
```

ไฟล์ build จะอยู่ในโฟลเดอร์ `dist/`

## Deploy ขึ้น GitHub Pages (github.io)

โปรเจกต์นี้ตั้งค่า workflow ไว้ที่ `.github/workflows/deploy.yml` แล้ว

### 1) ตั้งค่า Vite base (สำคัญ)

เพื่อให้ path ของ asset ถูกต้องบน GitHub Pages แนะนำให้ตั้งใน `vite.config.js`:

```js
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
```

### 2) เปิด Pages ใน GitHub

ไปที่ `Settings` → `Pages`
- **Source** เลือก `GitHub Actions`

### 3) Trigger deploy

ทำอย่างใดอย่างหนึ่ง:
- กด `Actions` → เลือก workflow deploy → `Re-run jobs`
- หรือ push commit ใหม่เข้า branch `main`

### 4) ลิงก์ที่ได้

เมื่อ deploy สำเร็จ จะได้ลิงก์ประมาณ:
- `https://<username>.github.io/<repo-name>/`
