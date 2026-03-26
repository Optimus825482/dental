# DENT-ALP: Geliştirme ve Tamamlama Planı

## 1. Mevcut Durum Analizi (Current State)

Uygulamanın mevcut kaynak kodları (`d:\DENT2\dent-alp-os`) ve veritabanı şeması incelenmiştir. Şu anki durumda backend ve veritabanı altyapısı genel hatlarıyla oldukça kapsamlıdır. Ancak, `D:\DENT2\stitch_clean_medical_ferah_prd` prototiplerinde ve proje dokümanında ("Bulut Tabanlı Diş Hekimliği...") belirtilen bazı önemli özellikler ve kullanıcı arayüzü pencereleri uygulama içerisine tam olarak entegre edilmemiştir.

**Mevcut (Hazır/Kısmen Hazır) Modüller:**

- **Veritabanı (Prisma):** Randevu, Hasta, Cari Hesap, Tedavi, Stok, Radyoloji, Kullanıcı ve Bildirim tabloları tasarımı yapılmış.
- **API Endpoints:** İlgili veri modellerinin API endpoint klasörleri oluşturulmuş.
- **Frontend OS Pencereleri:** Takvim, Hasta Kabul, Hasta Detay, Finans, Raporlar, Ayarlar, Tedavi Planları gibi pencereler mevcut (`components/windows` altında).

## 2. Tespit Edilen Eksiklikler (Missing Features & Gaps)

1. **Radyoloji ve Görüntüleme Sistemi:**
   - **Sorun:** Veritabanında `RadiologyImage` modeli olmasına rağmen UI tarafında bir "Radyoloji Penceresi" (radiology-content.tsx) eksik.
   - **Prototip Karşılığı:** `radyoloji_ve_g_r_nt_leme_penceresi`

2. **Stok ve Ürün Yönetimi:**
   - **Sorun:** `Product` ve `StockMovement` modelleri ve API'leri var, ancak UI katmanında Stok Yönetimi penceresi bulunmuyor.
   - **Prototip Karşılığı:** `stok_ve_r_n_y_netimi`, `r_n_ve_stok_tan_mlama`

3. **Hekim ve Kullanıcı Tanımlamaları:**
   - **Sorun:** Klinik personelinin detaylı yetki, çalışma saati ve profil tanımlarının yapılacağı pencereler eksik.
   - **Prototip Karşılığı:** `hekim_tan_mlar_penceresi`, `kullan_c_tan_mlar_penceresi`

4. **Bildirim Merkezi:**
   - **Sorun:** `Notification` modeli var ancak işletim sistemi arayüzünde bildirimleri gösteren veya yöneten bir "Bildirim Merkezi" veya "Aksiyon Merkezi" paneli eksik.
   - **Prototip Karşılığı:** `bildirim_merkezi_dentaos`

5. **Dental Harita ve Detaylı Tedavi Seçimleri:**
   - **Sorun:** Mevcut hasta detay ekranındaki dental haritanın (FDI/Universal) interaktif özellikleri ve tedavi ile doğrudan entegrasyonu (prototipte yer alan "İnteraktif Diş Haritası Penceresi") tam fonksiyonel olmayabilir, kontrol ve geliştirme gerektiriyor.
   - **Prototip Karşılığı:** `i_nteraktif_di_haritas_pencesi`, `i_lemler_penceresi`

6. **Mobil / Responsive Görünümler:**
   - **Sorun:** Masaüstü "OS" deneyimi mobil cihazlar için optimize edilmemiş. Prototiplerde mobil dashboard, takvim, stok yönetimi vb. ekranlar mevcut.
   - **Aksiyon:** Responsive layout iyileştirmeleri ve PWA özelliklerinin tamamlanması.

## 3. Yol Haritası ve Fazlar (Implementation Roadmap)

Bu eksiklikler, sistematik bir çoklu önceliklendirme (Multi-agent orchestration) yapısıyla şu fazlarda tamamlanacaktır:

### Faz 1: Eksik Ana OS Pencerelerinin Eklenmesi (UI & Entegrasyon)

- **Görev 1:** `radiology-content.tsx` oluşturarak radyoloji görüntüleri yükleme ve görüntüleme panelini yapma.
- **Görev 2:** `stock-content.tsx` ile ürün/stok ekleme, liste ve hareketleri (StockMovement) yöneten modülü bağlama.
- **Görev 3:** `users-content.tsx` (veya Ayarlar altına tab olarak) hekim/kullanıcı yönetiminin dahil edilmesi.

### Faz 2: Sistem İyileştirmeleri ve Tamamlayıcı Modüller

- **Görev 4:** "Bildirim Merkezi" bileşeninin sağ alt köşede/başlangıç çubuğunda oluşturulması ve API entegrasyonu.
- **Görev 5:** `patient-detail-content.tsx` içerisinde dental haritanın interaktif yapısının geliştirilmesi (İşlem Ekleme Modal entegrasyonu).
- **Görev 6:** Cari hesap modülüne (taksitli ödeme, klinik içi yöntemler vb.) ait gelişmiş finansal akışların tamamlanması.

### Faz 3: Mobil Uyumluluk ve Kalite Kontrolü (QA & Responsive)

- **Görev 7:** Masaüstü pencerelere, prototiplerde hedeflendiği gibi mobil görünümlerinin, responsive CSS ("Tailwind/Shadcn") ile yedirilmesi.
- **Görev 8:** End-to-end Test ve Lint/Güvenlik kontrolleri.

---

_Not: Bu plan DENT-ALP projesinin eksik modüllerinin tamamlanarak, yayına hazır hale getirilmesini hedefler._
