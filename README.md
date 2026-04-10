# 🔴 My Pokemon App

แอป React + Vite สำหรับค้นหาข้อมูลโปเกมอน ท่าต่อสู้ ไอเทม และอื่น ๆ โดยใช้ข้อมูลจาก [PokeAPI](https://pokeapi.co/)

🌐 **Live Demo:** [https://kotkun000.github.io/my-pokemon-app/](https://kotkun000.github.io/my-pokemon-app/)

---

## 📋 สารบัญ

- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [การติดตั้งโปรเจกต์](#-การติดตั้งโปรเจกต์)
- [คำสั่งที่ใช้บ่อย](#-คำสั่งที่ใช้บ่อย)
- [โครงสร้างโปรเจกต์](#-โครงสร้างโปรเจกต์)
- [การ Deploy ขึ้น GitHub Pages](#-การ-deploy-ขึ้น-github-pages)
- [การทำงานเป็นทีม (Git Branching)](#-การทำงานเป็นทีม-git-branching)

---

## 🛠 Tech Stack

| เทคโนโลยี | เวอร์ชัน |
|-----------|---------|
| React | 19.x |
| Vite | 8.x |
| Tailwind CSS | 4.x |
| Axios | 1.x |
| Node.js | 20+ |

---

## ✅ Prerequisites

ก่อนเริ่มต้น ให้ติดตั้งโปรแกรมเหล่านี้บนเครื่อง:

1. **Node.js v20+** — [ดาวน์โหลดที่นี่](https://nodejs.org/)
2. **Git** — [ดาวน์โหลดที่นี่](https://git-scm.com/)
3. **Code Editor** แนะนำ [VS Code](https://code.visualstudio.com/) หรือ [Cursor](https://www.cursor.com/)

ตรวจสอบว่าติดตั้งแล้ว:

```bash
node -v   # ควรได้ v20.x.x ขึ้นไป
npm -v    # ควรได้ 10.x.x ขึ้นไป
git -v    # ควรได้ git version 2.x.x
```

---

## 🚀 การติดตั้งโปรเจกต์

### 1. Clone โปรเจกต์จาก GitHub

```bash
git clone https://github.com/KotKun000/my-pokemon-app.git
```

### 2. เข้าไปในโฟลเดอร์โปรเจกต์

```bash
cd my-pokemon-app
```

### 3. ติดตั้ง Dependencies

```bash
npm install
```

### 4. รันโปรเจกต์ (Development Mode)

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ลิงก์ที่แสดงใน terminal (เช่น `http://localhost:5173`)

---

## 📌 คำสั่งที่ใช้บ่อย

| คำสั่ง | คำอธิบาย |
|-------|----------|
| `npm run dev` | รัน dev server (hot reload) |
| `npm run build` | สร้าง production build ไว้ในโฟลเดอร์ `dist/` |
| `npm run preview` | ดูตัวอย่าง production build |
| `npm run lint` | ตรวจสอบโค้ดด้วย ESLint |
| `node scripts/fetch-moves.js` | ดึงข้อมูล Move ทั้งหมดจาก PokeAPI มาไว้ใน `src/data/moves_th.json` |

---

## 📁 โครงสร้างโปรเจกต์

```
my-pokemon-app/
├── .github/workflows/    # GitHub Actions (auto deploy)
│   └── deploy.yml
├── public/               # Static file
├── scripts/
│   └── fetch-moves.js    # สคริปต์ดึงข้อมูล Move จาก PokeAPI
├── src/
│   ├── assets/           # รูปภาพ, ไอคอน
│   ├── data/             # ไฟล์ JSON ข้อมูลโปเกมอน
│   │   └── moves_th.json
│   ├── tabs/             # คอมโพเนนต์แต่ละแท็บ
│   │   ├── PokemonTab.jsx
│   │   ├── PokemonDetailModal.jsx
│   │   ├── MoveTab.jsx
│   │   └── PlaceholderTab.jsx
│   ├── utils/            # ฟังก์ชันช่วยเหลือ
│   │   ├── typeIcons.js
│   │   └── pokemonTypeDefense.js
│   ├── App.jsx           # คอมโพเนนต์หลัก + เมนูแท็บ
│   ├── App.css           # สไตล์หลัก
│   ├── index.css
│   └── main.jsx          # Entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🌐 การ Deploy ขึ้น GitHub Pages

โปรเจกต์นี้ตั้งค่า auto deploy ผ่าน GitHub Actions ไว้แล้ว

1. ไปที่ GitHub repo → **Settings** → **Pages**
2. เลือก **Source:** `GitHub Actions`
3. ทุกครั้งที่ push ไป branch `main` จะ deploy อัตโนมัติ
4. ลิงก์จะเป็น: `https://<username>.github.io/my-pokemon-app/`

---

## 👥 การทำงานเป็นทีม (Git Branching)

### หลักการสำคัญ

> ⚠️ **ห้าม push โค้ดเข้า `main` โดยตรง!**
> ให้สร้าง branch ใหม่ทุกครั้ง แล้วทำ Pull Request (PR) เพื่อให้ทีมรีวิวก่อน merge

### ขั้นตอนการทำงาน (Git Flow)

```
main (เวอร์ชันที่ deploy อยู่)
 └── feature/xxx (branch ที่แต่ละคนทำงาน)
```

---

### 🔄 ขั้นตอนที่ 1: อัปเดตโค้ดล่าสุดจาก main

ก่อนเริ่มงานใหม่ ให้ดึงโค้ดล่าสุดก่อนเสมอ:

```bash
git checkout main
git pull origin main
```

---

### 🌿 ขั้นตอนที่ 2: สร้าง Branch ใหม่

ตั้งชื่อ branch ให้สื่อความหมาย:

```bash
git checkout -b feature/ชื่อฟีเจอร์
```

**ตัวอย่างการตั้งชื่อ branch:**

| รูปแบบ | ตัวอย่าง | ใช้เมื่อ |
|--------|---------|---------|
| `feature/xxx` | `feature/item-tab` | เพิ่มฟีเจอร์ใหม่ |
| `fix/xxx` | `fix/pokemon-image-loading` | แก้บั๊ก |
| `style/xxx` | `style/navbar-redesign` | แก้ไข UI/CSS |
| `docs/xxx` | `docs/update-readme` | แก้ไขเอกสาร |

---

### 💻 ขั้นตอนที่ 3: เขียนโค้ดและ Commit

```bash
# ดูสถานะไฟล์ที่แก้ไข
git status

# เพิ่มไฟล์ที่ต้องการ commit
git add .

# Commit พร้อมข้อความอธิบาย
git commit -m "feat: เพิ่มหน้า Item Tab ดึงข้อมูลจาก PokeAPI"
```

**รูปแบบ Commit Message แนะนำ:**

| Prefix | ใช้เมื่อ | ตัวอย่าง |
|--------|---------|---------|
| `feat:` | เพิ่มฟีเจอร์ใหม่ | `feat: เพิ่มระบบกรอง type` |
| `fix:` | แก้บั๊ก | `fix: แก้รูปโปเกมอนไม่โหลด` |
| `style:` | แก้ CSS/UI | `style: ปรับสีปุ่ม pagination` |
| `docs:` | แก้เอกสาร | `docs: อัปเดต README` |
| `refactor:` | ปรับโครงสร้างโค้ด | `refactor: แยก component` |

---

### 🚀 ขั้นตอนที่ 4: Push Branch ขึ้น GitHub

```bash
git push origin feature/ชื่อฟีเจอร์
```

---

### 📝 ขั้นตอนที่ 5: สร้าง Pull Request (PR)

1. ไปที่ GitHub repo ของโปรเจกต์
2. จะเห็นแถบเหลือง **"Compare & pull request"** → กดเลย
3. กรอกรายละเอียด:
   - **Title:** อธิบายสั้น ๆ ว่าทำอะไร
   - **Description:** อธิบายรายละเอียดเพิ่มเติม เช่น ไฟล์ที่แก้ วิธีทดสอบ
4. กด **Create pull request**
5. รอสมาชิกในทีม **Review** และ **Approve**

---

### ✅ ขั้นตอนที่ 6: Merge เข้า main

เมื่อ PR ถูก approve แล้ว:

1. กดปุ่ม **Merge pull request** บน GitHub
2. กด **Confirm merge**
3. ลบ branch เก่าได้ (GitHub จะมีปุ่ม **Delete branch** ให้)

---

### 🔥 กรณีเกิด Conflict

ถ้ามีคนอื่นแก้ไฟล์เดียวกัน จะเกิด conflict ให้แก้ดังนี้:

```bash
# 1. อัปเดต main ล่าสุด
git checkout main
git pull origin main

# 2. กลับไป branch ของตัวเอง
git checkout feature/ชื่อฟีเจอร์

# 3. Merge main เข้ามา
git merge main

# 4. แก้ไฟล์ที่ conflict (จะเห็นเครื่องหมาย <<<<<<< ในไฟล์)
# เลือกโค้ดที่ต้องการเก็บ แล้วลบเครื่องหมาย conflict ออก

# 5. Commit และ Push ใหม่
git add .
git commit -m "fix: resolve merge conflict"
git push origin feature/ชื่อฟีเจอร์
```

---

### 📊 สรุป Flow การทำงาน

```
1. git pull origin main          ← ดึงโค้ดล่าสุด
2. git checkout -b feature/xxx   ← สร้าง branch ใหม่
3. เขียนโค้ด + commit            ← ทำงาน
4. git push origin feature/xxx   ← push ขึ้น GitHub
5. สร้าง Pull Request            ← ขอ review
6. ทีม review + approve          ← ตรวจโค้ด
7. Merge เข้า main               ← รวมโค้ด (auto deploy!)
```

---

## 📄 License

MIT
