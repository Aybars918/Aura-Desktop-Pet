# Aura Desktop Pet 🤖✨

Aura, masaüstünüzde yaşayan, sizinle etkileşime giren, akıllı ve sevimli bir robot arkadaştır. Electron tabanlı bu uygulama, gelişmiş yapay zeka entegrasyonu ve modern tasarımıyla masaüstünüze canlılık katar.

## 🌟 Öne Çıkan Özellikler

- **Yapay Zeka Sohbeti:** Groq Cloud (Llama 3) tabanlı, esprili ve akıllı bir sohbet deneyimi.
- **Dinamik Hareketler:** Masaüstünde istediğiniz yere parmağınızla/farenizle pürüzsüzce sürükleyin.
- **Etkileşimli Animasyonlar:** 
  - **Baş Dönmesi (Dizzy):** Aura'yı çok hızlı sallarsanız başı döner ve gözleri kararır! 😵
  - **Dans Etme:** Ona "dans et" derseniz sizin için özel bir dans gösterisi yapar. 💃
- **Koruma Modu :** Aura'ya "koruma" dediğinizde kamera üzerinden hareket algılama yapar. yabancıları bilgisayardan uzak tutmak için alarm verir. 🚨👀
  - **Özelleştirilebilir Alarm Sesi:** Kendi `.mp3` veya `.wav` dosyanızı yükleyerek alarm sesini kişiselleştirebilirsiniz!
  - **Klon Ordusu:** Koruma anında ekranda beliren ek klonlarla tam güvenlik sağlar.
- **Gelişmiş Ses (Yeni!):** ElevenLabs entegrasyonu ile Aura artık sadece robotik değil, insan benzeri, doğal bir sesle konuşuyor! 🎙️✨
  - **Dinamik Ses Seçimi:** İstediğiniz ElevenLabs ses ID'sini kullanarak Aura'nın karakterini değiştirebilirsiniz.
  - **Yedek Sistem:** İnternet veya API sorunu olduğunda Aura otomatik olarak standart sesine (Web Speech) döner.
- **Veda Göz Kırpması:** Aura kapanırken size tatlı bir şekilde göz kırparak veda eder. 😉👋
- **Sistem Medya Kontrolü:** Bilgisayarınızda çalan herhangi bir videoyu veya müziği (YouTube, Spotify vb.) Aura üzerinden yönetin! 🎵
  - **Dinamik Panel:** Aura'nın üzerine gelindiğinde veya bir medya oynatıldığında gözlerinin üzerinde kontrol tuşları (⏮ ▶/⏸ ⏭) belirir.
- **İstatistik Takibi (Canlı):** Aura bilgisayarınızın nabzını tutar! 📉
  - **Dinamik Glow:** CPU ve RAM kullanımı arttıkça Aura'nın kalbi (core-glow) daha hızlı atmaya başlar.
  - **Yorgunluk Uyarısı:** Sistem yükü %90'ı geçerse Aura "kırmızı" alarm moduna girer ve sizi uyarır.
- **Pomodoro Sayacı:** Çalışma verimliliğinizi artırın. ⏳
  - **Odaklanma Modu:** "Zamanlayıcı başlat" dediğinizde Aura mavi bir ışığa bürünür ve 25 dakikalık geri sayımı başlatır.
- **Şık Tasarım:** Glassmorphism (cam tasarımı) efekti, neon parlamalar ve akıcı orbit halkaları.
- **Her Zaman Üstte:** Aura her zaman pencerelerinizin üzerinde durur, böylece her an ona ulaşabilirsiniz.

## 🛠️ Teknoloji Yığını

- **Framework:** Electron.js
- **AI Engine:** Groq SDK (Llama 3.3 70B)
- **Voice Engine:** ElevenLabs API & Web Speech API
- **Frontend:** Vanilla JS, CSS3, HTML5
- **Animations:** Hardware Accelerated CSS3

## ⚙️ Kurulum ve Çalıştırma

### 1. Gereksinimler
- [Node.js](https://nodejs.org/) (Sürüm 16 veya üzeri) yüklü olmalıdır.

### 2. Bağımlılıkları Yükleyin
Klasöre gidin ve terminalde şu komutu çalıştırın:
```bash
npm install
```

### 3. API Anahtarı Yapılandırması
Kök dizinde bir `.env` dosyası oluşturun ve gerekli anahtarları ekleyin:
```env
# Groq Cloud API Anahtarı (Zorunlu)
GROQ_API_KEY=your_groq_key_here

# ElevenLabs API Anahtarı (Doğal ses için opsiyonel)
ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

### 4. Başlatın
Uygulamayı çalıştırmak için:
```bash
npm start
```

## 🖱️ Kullanım Kılavuzu

- **Ses Ayarları:** 
  - ElevenLabs sesini değiştirmek için `renderer.js` içerisindeki `VOICE_ID` değişkenini güncelleyebilirsiniz.
  - Aura varsayılan olarak Türkçe diline ve sevimli bir tona ayarlanmıştır.
- **Masaüstü Asistanı (Gelişmiş):** Aura'dan herhangi bir uygulamayı (`Steam`, `Discord`, `Notepad` vb.) açmasını isteyebilirsiniz. 🛠️
  - **Derin Arama:** Eğer uygulama standart yerlerde yoksa Aura tüm bilgisayarınızı tarayıp bulur.
  - **Akıllı Seçim:** Aynı isimde birden fazla uygulama varsa size seçenek sunar.
  - **Web & Bilgi:** "Hava durumu nasıl?" veya "X nedir?" gibi sorularınızda varsayılan tarayıcınızda otomatik arama yapar.
- **Ruh Hali ve Enerji Sistemi:** Aura artık "yaşıyor"! 📊
  - **Dinamik Mod:** İlgisiz kaldığında üzülür (griye döner), çok yorulursa uykusu gelir (baş dönmesi animasyonu).
  - **Etkileşim:** Onu sevmek için üzerine tıklayın! Tıkladığınızda neşelenir ve zıplar.
  - **Durum Sorgulama:** "Nasıl hissediyorsun?" diye sorarak puanlarını görebilirsiniz.
- **Sohbet:** Aura'ya çift tıklayarak sohbet ekranını açabilirsiniz.
- **Dahili Komutlar:**
  - *"Dans et"* -> Aura dans etmeye başlar.
  - *"Sesli konuşmayı aç/kapat"* -> Aura cevaplarını sesli veya sadece yazılı olarak söyler.
  - *"Kapat / Görüşürüz"* -> Aura veda eder ve uygulamayı kapatır.

## 🎨 Tasarım Detayları
Uygulama tamamen şeffaf bir pencere yapısına sahiptir. Arka planı yoktur ve masaüstünüzdeki simgelerin üzerinde süzülüyormuş gibi görünür. Görsel efektler donanım hızlandırmalı modern CSS kullanılarak performansa optimize edilmiştir.

---
*Geliştirici Notu: Aura, sizinle vakit geçirmeyi çok sever!* 💙
