document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Logika Navigasi Active State
    const currentPath = window.location.pathname;
    let pageIndex = 0;

    if (currentPath.includes("transaksi.html")) pageIndex = 1;
    else if (currentPath.includes("insight.html")) pageIndex = 2;
    else if (currentPath.includes("skor.html")) pageIndex = 3;
    else if (currentPath.includes("profil.html")) pageIndex = 4;

    const indicator = document.querySelector('.nav-indicator');
    if(indicator) {
        // Hitung posisi indikator agar pas di atas icon aktif
        const percentage = (pageIndex * 20) + 10; 
        indicator.style.transform = `translateX(calc(${percentage}vw * 4.14 - 18px))`; 
    }

    // 2. Animasi Counter Saldo (Khusus Beranda)
    if (document.getElementById("counter-saldo")) {
        animateValue("counter-saldo", 0, 450000, 1500);
    }

    // 3. Tab Sub-Menu (Khusus Transaksi)
    const tabBtns = document.querySelectorAll('.tab-btn');
    if(tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const target = this.getAttribute('data-target');
                
                tabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                document.getElementById('trx-input-area').classList.add('hidden');
                document.getElementById('trx-riwayat-area').classList.add('hidden');
                document.getElementById('trx-rekap-area').classList.add('hidden');

                document.getElementById(`trx-${target}-area`).classList.remove('hidden');

                if(target === 'rekap') updateRekapChart();
            });
        });
    }

    // 4. Form Submit Simulation
    const formTrx = document.getElementById('form-trx');
    if (formTrx) {
        formTrx.addEventListener('submit', function(e) {
            e.preventDefault();
            const btn = this.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Klasifikasi Data AI...';
            btn.style.opacity = '0.8';

            setTimeout(() => {
                alert("Transaksi Berhasil Dicatat!\nData dikirim ke sistem Credit Scoring.");
                this.reset();
                btn.innerHTML = originalText;
                btn.style.opacity = '1';
                window.location.href = "beranda.html";
            }, 1000);
        });
    }

    // 5. Ripple Effect
    document.querySelectorAll('.ripple').forEach(button => {
        button.addEventListener('click', function (e) {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const ripples = document.createElement('span');
            ripples.classList.add('ripple-span');
            ripples.style.left = `${x}px`;
            ripples.style.top = `${y}px`;
            this.appendChild(ripples);
            setTimeout(() => ripples.remove(), 600);
        });
    });
});

// Utilities
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if(!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = progress * (2 - progress);
        const currentNum = Math.floor(easeProgress * (end - start) + start);
        obj.innerHTML = currentNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// Rekap Chart Logic
let rekapChartInstance = null;
window.updateRekapChart = function() {
    const canvas = document.getElementById('rekapChart');
    if(!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const filter = document.getElementById('rekap-filter') ? document.getElementById('rekap-filter').value : 'mingguan';
    
    if(rekapChartInstance) rekapChartInstance.destroy();

    let labels = filter === 'mingguan' ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] : ['Mg 1', 'Mg 2', 'Mg 3', 'Mg 4'];
    let dataSets = filter === 'mingguan' ? [15, 12, 18, 14, 22, 30, 25] : [120, 115, 140, 155];

    let gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(10, 76, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(10, 76, 246, 0.0)');

    rekapChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Transaksi',
                data: dataSets,
                backgroundColor: gradient,
                borderColor: '#0A4CF6',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { display: false } } } }
    });
}

// js/app.js (Tambahkan fungsi ini)

// --- MENGHUBUNGKAN LANGKAH 1 KE HALAMAN LAIN ---
function loadUserData() {
    const data = JSON.parse(localStorage.getItem('fingrow_data'));
    
    if(data) {
        // Ganti Nama Usaha di Beranda & Profil
        const namaUsahaEls = document.querySelectorAll('.shop-name, .font-bold.text-md, .font-bold.text-lg');
        namaUsahaEls.forEach(el => {
            // Cek jika teks saat ini mirip nama toko, lalu ganti
            if(el.innerText.includes('Toko') || el.innerText.includes('Warung') || el.innerText.includes('Usaha')) {
                el.innerText = data.nama;
            }
        });

        // Ganti Lokasi & Jenis Usaha
        const lokasiEls = document.querySelectorAll('.user-name, .text-xs.text-muted');
        lokasiEls.forEach(el => {
            if(el.innerHTML.includes('Karawang') || el.innerText.includes('ID')) {
                el.innerHTML = `<i class="fa-solid fa-location-dot text-primary text-xs"></i> ${data.lokasi}, ID`;
            }
        });
    }
}

// Panggil saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
});

// --- AUTHENTICATION GUARD (PENJAGA GERBANG) ---
(function() {
    const userData = localStorage.getItem('fingrow_data');
    const currentPath = window.location.pathname;

    // Jika data tidak ada DAN kita tidak sedang di halaman login/index
    if (!userData && !currentPath.endsWith('index.html') && currentPath !== '/') {
        alert("Akses Ditolak: Silakan registrasi usaha Anda terlebih dahulu.");
        window.location.href = "index.html";
    }
})();

// js/app.js

// Fungsi Logout Global
function logout() {
    // Menampilkan konfirmasi sebelum menghapus data
    const yakin = confirm("Apakah Anda yakin ingin keluar? Semua data transaksi lokal akan dihapus.");
    
    if (yakin) {
        // Hapus data dari memori browser
        localStorage.removeItem('fingrow_data');
        
        // Arahkan kembali ke halaman registrasi (Langkah 1 Alur Aplikasi)
        window.location.href = "index.html";
    }
}

