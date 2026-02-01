# Aura Desktop Pet 🤖✨

Aura, masaüstünüzde yaşayan, sizinle etkileşime giren, akıllı ve sevimli bir robot arkadaştır. Electron tabanlı bu uygulama, gelişmiş yapay zeka entegrasyonu ve modern tasarımıyla masaüstünüze canlılık katar.

## 🌟 Öne Çıkan Özellikler

- **Yapay Zeka Sohbeti:** Groq Cloud (Llama 3) tabanlı, esprili ve akıllı bir sohbet deneyimi.
- **Dinamik Hareketler:** Masaüstünde istediğiniz yere parmağınızla/farenizle pürüzsüzce sürükleyin.
- **Etkileşimli Animasyonlar:** 
  - **Baş Dönmesi (Dizzy):** Aura'yı çok hızlı sallarsanız başı döner ve gözleri kararır! 😵
  - **Dans Etme:** Ona "dans et" derseniz sizin için özel bir dans gösterisi yapar. 💃
- **Koruma Modu (Yeni!):** Aura'ya "koruma" dediğinizde kamera üzerinden hareket algılama yapar. yabancıları bilgisayardan uzak tutmak için alarm verir. 🚨👀
  - **Özelleştirilebilir Alarm Sesi:** Kendi `.mp3` veya `.wav` dosyanızı yükleyerek alarm sesini kişiselleştirebilirsiniz!
  - **Klon Ordusu:** Koruma anında ekranda beliren ek klonlarla tam güvenlik sağlar.
- **Sistem Medya Kontrolü (Yeni!):** Bilgisayarınızda çalan herhangi bir videoyu veya müziği (YouTube, Spotify vb.) Aura üzerinden yönetin! 🎵
  - **Dinamik Panel:** Aura'nın üzerine gelindiğinde veya bir medya oynatıldığında gözlerinin üzerinde kontrol tuşları (⏮ ▶/⏸ ⏭) belirir.
  - **Akıllı Sabitleme:** Medya oynatılırken kontrol paneli Aura'nın üzerinde sabit kalarak hızlı erişim sağlar.
- **Şık Tasarım:** Glassmorphism (cam tasarımı) efekti, neon parlamalar ve akıcı orbit halkaları.
- **Her Zaman Üstte:** Aura her zaman pencerelerinizin üzerinde durur, böylece her an ona ulaşabilirsiniz.

## 🛠️ Teknoloji Yığını

- **Core:** Core Electron.js
- **AI Engine:** Groq SDK (Llama 3.3 70B)
- **Frontend:** Vanilla JS, CSS3, HTML5
- **Icons & Glows:** Pure CSS animations

## ⚙️ Kurulum ve Çalıştırma

### 1. Gereksinimler
- [Node.js](https://nodejs.org/) (Sürüm 16 veya üzeri) yüklü olmalıdır.

### 2. Bağımlılıkları Yükleyin
Klasöre gidin ve terminalde şu komutu çalıştırın:
```bash
npm install
```

### 3. API Anahtarı Yapılandırması
Kök dizinde bir `.env` dosyası oluşturun ve Groq Cloud üzerinden aldığınız API anahtarını ekleyin:
```env
GROQ_API_KEY=your_api_key_here
```

### 4. Başlatın
Uygulamayı çalıştırmak için:
```bash
npm start
```

## 🖱️ Kullanım Kılavuzu

- **Sürükle & Bırak:** Aura'yı vücudundan yakalayıp istediğiniz yere taşıyabilirsiniz.
- **Sohbet:** Aura'ya çift tıklayarak sohbet ekranını açabilirsiniz.
- **Özel Komutlar:**
  - *"Dans et"* -> Aura dans etmeye başlar.
  - *"Kapat"* -> Aura uygulamayı kapatır.

## 🎨 Tasarım Detayları
Uygulama tamamen şeffaf bir pencere yapısına sahiptir. Arka planı yoktur ve masaüstünüzdeki simgelerin üzerinde süzülüyormuş gibi görünür. Görsel efektler donanım hızlandırmalı modern CSS kullanılarak performansa optimize edilmiştir.

---
*Geliştirici Notu: Aura, sizinle vakit geçirmeyi çok sever!* 💙
